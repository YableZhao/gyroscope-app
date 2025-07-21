package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/websocket"
	"github.com/google/uuid"
	"github.com/joho/godotenv"
)

var (
	upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// TODO: Implement proper origin checking
			return true
		},
	}
	
	redisClient *redis.Client
	hub         *Hub
)

// Hub maintains the set of active clients and broadcasts messages to the clients
type Hub struct {
	// Registered clients
	clients map[*Client]bool
	
	// Inbound messages from the clients
	broadcast chan []byte
	
	// Register requests from the clients
	register chan *Client
	
	// Unregister requests from clients
	unregister chan *Client
	
	// Room-based message routing
	rooms map[string]map[*Client]bool
}

// Client is a middleman between the websocket connection and the hub
type Client struct {
	hub *Hub
	
	// The websocket connection
	conn *websocket.Conn
	
	// Buffered channel of outbound messages
	send chan []byte
	
	// User information
	userID   string
	username string
	roomID   string
}

// Message represents a WebSocket message
type Message struct {
	Type      string      `json:"type"`
	Data      interface{} `json:"data"`
	UserID    string      `json:"user_id,omitempty"`
	RoomID    string      `json:"room_id,omitempty"`
	Timestamp int64       `json:"timestamp"`
}

// SensorUpdate represents real-time sensor data
type SensorUpdate struct {
	Type        string  `json:"type"` // gyroscope, touch, voice, gesture
	Alpha       float64 `json:"alpha,omitempty"`
	Beta        float64 `json:"beta,omitempty"`
	Gamma       float64 `json:"gamma,omitempty"`
	X           float64 `json:"x,omitempty"`
	Y           float64 `json:"y,omitempty"`
	Confidence  float64 `json:"confidence,omitempty"`
	Timestamp   int64   `json:"timestamp"`
}

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Initialize Redis client
	redisAddr := os.Getenv("REDIS_ADDR")
	if redisAddr == "" {
		redisAddr = "localhost:6379"
	}
	
	redisClient = redis.NewClient(&redis.Options{
		Addr:     redisAddr,
		Password: "",
		DB:       0,
	})
	
	// Test Redis connection
	ctx := context.Background()
	if err := redisClient.Ping(ctx).Err(); err != nil {
		log.Printf("Redis connection failed: %v", err)
	} else {
		log.Println("Connected to Redis")
	}

	// Initialize hub
	hub = &Hub{
		broadcast:  make(chan []byte),
		register:   make(chan *Client),
		unregister: make(chan *Client),
		clients:    make(map[*Client]bool),
		rooms:      make(map[string]map[*Client]bool),
	}
	
	// Start the hub
	go hub.run()

	// Set up Gin router
	r := gin.Default()
	
	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":    "healthy",
			"timestamp": time.Now().Unix(),
			"service":   "websocket-service",
		})
	})
	
	// WebSocket endpoint
	r.GET("/ws", handleWebSocket)
	
	// Room metrics endpoint
	r.GET("/metrics/rooms", func(c *gin.Context) {
		stats := make(map[string]int)
		for roomID, clients := range hub.rooms {
			stats[roomID] = len(clients)
		}
		c.JSON(http.StatusOK, gin.H{
			"rooms": stats,
			"total_connections": len(hub.clients),
		})
	})

	port := os.Getenv("WS_PORT")
	if port == "" {
		port = "8081"
	}

	log.Printf("WebSocket service starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.clients[client] = true
			
			// Add to room
			if client.roomID != "" {
				if h.rooms[client.roomID] == nil {
					h.rooms[client.roomID] = make(map[*Client]bool)
				}
				h.rooms[client.roomID][client] = true
				
				// Notify room about new user
				h.broadcastToRoom(client.roomID, Message{
					Type:   "user_joined",
					UserID: client.userID,
					RoomID: client.roomID,
					Data: map[string]string{
						"username": client.username,
					},
					Timestamp: time.Now().Unix(),
				})
				
				// Update Redis with room state
				h.updateRoomStateInRedis(client.roomID)
			}
			
			log.Printf("Client registered: %s in room %s", client.userID, client.roomID)

		case client := <-h.unregister:
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.send)
				
				// Remove from room
				if client.roomID != "" && h.rooms[client.roomID] != nil {
					delete(h.rooms[client.roomID], client)
					
					// Clean up empty rooms
					if len(h.rooms[client.roomID]) == 0 {
						delete(h.rooms, client.roomID)
					} else {
						// Notify room about user leaving
						h.broadcastToRoom(client.roomID, Message{
							Type:   "user_left",
							UserID: client.userID,
							RoomID: client.roomID,
							Data: map[string]string{
								"username": client.username,
							},
							Timestamp: time.Now().Unix(),
						})
					}
					
					// Update Redis
					h.updateRoomStateInRedis(client.roomID)
				}
				
				log.Printf("Client unregistered: %s", client.userID)
			}

		case message := <-h.broadcast:
			// Broadcast to all clients (rarely used)
			for client := range h.clients {
				select {
				case client.send <- message:
				default:
					close(client.send)
					delete(h.clients, client)
				}
			}
		}
	}
}

func (h *Hub) broadcastToRoom(roomID string, message Message) {
	if h.rooms[roomID] == nil {
		return
	}
	
	messageBytes, err := json.Marshal(message)
	if err != nil {
		log.Printf("Error marshaling message: %v", err)
		return
	}
	
	for client := range h.rooms[roomID] {
		select {
		case client.send <- messageBytes:
		default:
			close(client.send)
			delete(h.clients, client)
			delete(h.rooms[roomID], client)
		}
	}
	
	// Also publish to Redis for other service instances
	ctx := context.Background()
	redisClient.Publish(ctx, "room:"+roomID, messageBytes)
}

func (h *Hub) updateRoomStateInRedis(roomID string) {
	if h.rooms[roomID] == nil {
		return
	}
	
	ctx := context.Background()
	participants := make([]string, 0)
	
	for client := range h.rooms[roomID] {
		participants = append(participants, client.userID)
	}
	
	roomState := map[string]interface{}{
		"participants": participants,
		"count":       len(participants),
		"updated_at":  time.Now().Unix(),
	}
	
	data, err := json.Marshal(roomState)
	if err != nil {
		log.Printf("Error marshaling room state: %v", err)
		return
	}
	
	redisClient.Set(ctx, "room_state:"+roomID, data, time.Hour)
}

func handleWebSocket(c *gin.Context) {
	// Get user info from query params or headers
	userID := c.Query("user_id")
	username := c.Query("username")
	roomID := c.Query("room_id")
	
	if userID == "" || roomID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user_id and room_id are required"})
		return
	}
	
	// Upgrade HTTP connection to WebSocket
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}
	
	// Create new client
	client := &Client{
		hub:      hub,
		conn:     conn,
		send:     make(chan []byte, 256),
		userID:   userID,
		username: username,
		roomID:   roomID,
	}
	
	// Register client
	client.hub.register <- client
	
	// Start goroutines for reading and writing
	go client.writePump()
	go client.readPump()
}

const (
	// Time allowed to write a message to the peer
	writeWait = 10 * time.Second
	
	// Time allowed to read the next pong message from the peer
	pongWait = 60 * time.Second
	
	// Send pings to peer with this period. Must be less than pongWait
	pingPeriod = (pongWait * 9) / 10
	
	// Maximum message size allowed from peer
	maxMessageSize = 512
)

func (c *Client) readPump() {
	defer func() {
		c.hub.unregister <- c
		c.conn.Close()
	}()
	
	c.conn.SetReadLimit(maxMessageSize)
	c.conn.SetReadDeadline(time.Now().Add(pongWait))
	c.conn.SetPongHandler(func(string) error {
		c.conn.SetReadDeadline(time.Now().Add(pongWait))
		return nil
	})
	
	for {
		_, messageBytes, err := c.conn.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				log.Printf("WebSocket error: %v", err)
			}
			break
		}
		
		// Parse message
		var msg Message
		if err := json.Unmarshal(messageBytes, &msg); err != nil {
			log.Printf("Error parsing message: %v", err)
			continue
		}
		
		// Set message metadata
		msg.UserID = c.userID
		msg.RoomID = c.roomID
		msg.Timestamp = time.Now().Unix()
		
		// Handle different message types
		switch msg.Type {
		case "sensor_data":
			// Handle real-time sensor data
			c.handleSensorData(msg)
		case "game_action":
			// Handle game-related actions
			c.handleGameAction(msg)
		case "chat_message":
			// Handle chat messages
			c.handleChatMessage(msg)
		default:
			log.Printf("Unknown message type: %s", msg.Type)
		}
	}
}

func (c *Client) writePump() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		c.conn.Close()
	}()
	
	for {
		select {
		case message, ok := <-c.send:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if !ok {
				c.conn.WriteMessage(websocket.CloseMessage, []byte{})
				return
			}
			
			w, err := c.conn.NextWriter(websocket.TextMessage)
			if err != nil {
				return
			}
			w.Write(message)
			
			// Add queued messages to the current websocket message
			n := len(c.send)
			for i := 0; i < n; i++ {
				w.Write([]byte{'\n'})
				w.Write(<-c.send)
			}
			
			if err := w.Close(); err != nil {
				return
			}
			
		case <-ticker.C:
			c.conn.SetWriteDeadline(time.Now().Add(writeWait))
			if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}

func (c *Client) handleSensorData(msg Message) {
	// Broadcast sensor data to room participants
	c.hub.broadcastToRoom(c.roomID, msg)
	
	// Store in Redis for analytics
	ctx := context.Background()
	key := fmt.Sprintf("sensor:%s:%s", c.roomID, c.userID)
	
	data, err := json.Marshal(msg.Data)
	if err != nil {
		log.Printf("Error marshaling sensor data: %v", err)
		return
	}
	
	// Store with expiration
	redisClient.SetEX(ctx, key, data, time.Minute*5)
}

func (c *Client) handleGameAction(msg Message) {
	// Forward game actions to game service via Redis pub/sub
	ctx := context.Background()
	channel := fmt.Sprintf("game_actions:%s", c.roomID)
	
	data, err := json.Marshal(msg)
	if err != nil {
		log.Printf("Error marshaling game action: %v", err)
		return
	}
	
	redisClient.Publish(ctx, channel, data)
	
	// Also broadcast to room participants
	c.hub.broadcastToRoom(c.roomID, msg)
}

func (c *Client) handleChatMessage(msg Message) {
	// Broadcast chat message to room participants
	c.hub.broadcastToRoom(c.roomID, msg)
}