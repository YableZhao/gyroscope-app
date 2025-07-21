package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"multimodal-platform/shared/utils"
)

func main() {
	// Load environment variables
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	// Set Gin mode
	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// Middleware
	r.Use(corsMiddleware())
	r.Use(requestLoggerMiddleware())
	r.Use(rateLimitMiddleware())

	// Health check endpoints
	r.GET("/health", healthCheck)
	r.GET("/ready", readinessCheck)

	// API routes
	api := r.Group("/api/v1")
	{
		// Auth routes (proxy to auth-service)
		auth := api.Group("/auth")
		{
			auth.POST("/register", proxyToAuthService)
			auth.POST("/login", proxyToAuthService)
			auth.POST("/refresh", proxyToAuthService)
			auth.POST("/logout", authMiddleware(), proxyToAuthService)
		}

		// User routes (proxy to user-service)
		users := api.Group("/users")
		users.Use(authMiddleware())
		{
			users.GET("/profile", proxyToUserService)
			users.PUT("/profile", proxyToUserService)
			users.DELETE("/profile", proxyToUserService)
		}

		// Room/Game routes (proxy to game-service)
		rooms := api.Group("/rooms")
		rooms.Use(authMiddleware())
		{
			rooms.GET("", proxyToGameService)
			rooms.POST("", proxyToGameService)
			rooms.GET("/:code", proxyToGameService)
			rooms.PUT("/:id", proxyToGameService)
			rooms.DELETE("/:id", proxyToGameService)
			rooms.POST("/:code/join", proxyToGameService)
			rooms.POST("/:id/leave", proxyToGameService)
			rooms.POST("/:id/start", proxyToGameService)
		}

		// Game session routes
		games := api.Group("/games")
		games.Use(authMiddleware())
		{
			games.GET("/:id", proxyToGameService)
			games.POST("/:id/answer", proxyToGameService)
			games.GET("/:id/leaderboard", proxyToGameService)
		}
	}

	// WebSocket proxy (to websocket-service)
	r.GET("/ws", proxyWebSocket)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("API Gateway starting on port %s", port)
	log.Fatal(r.Run(":" + port))
}

func corsMiddleware() gin.HandlerFunc {
	config := cors.Config{
		AllowOrigins:     []string{"http://localhost:3000", "https://your-frontend-domain.com"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}
	return cors.New(config)
}

func requestLoggerMiddleware() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC1123),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	})
}

func rateLimitMiddleware() gin.HandlerFunc {
	// TODO: Implement rate limiting using Redis
	return func(c *gin.Context) {
		c.Next()
	}
}

func authMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			utils.Unauthorized(c, "Missing authorization header")
			c.Abort()
			return
		}

		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		if tokenString == authHeader {
			utils.Unauthorized(c, "Invalid authorization header format")
			c.Abort()
			return
		}

		claims, err := utils.ValidateToken(tokenString)
		if err != nil {
			utils.Unauthorized(c, "Invalid token")
			c.Abort()
			return
		}

		// Set user info in context
		c.Set("user_id", claims.UserID.String())
		c.Set("username", claims.Username)
		c.Set("email", claims.Email)
		c.Next()
	}
}

func healthCheck(c *gin.Context) {
	utils.Success(c, gin.H{
		"status":    "healthy",
		"timestamp": time.Now().Unix(),
		"service":   "api-gateway",
	})
}

func readinessCheck(c *gin.Context) {
	// TODO: Check if downstream services are available
	utils.Success(c, gin.H{
		"status":     "ready",
		"timestamp":  time.Now().Unix(),
		"services": gin.H{
			"auth-service":      "healthy",
			"user-service":      "healthy",
			"game-service":      "healthy",
			"websocket-service": "healthy",
		},
	})
}

// Proxy functions to downstream services
func proxyToAuthService(c *gin.Context) {
	// TODO: Implement HTTP proxy to auth-service
	// For now, return a placeholder
	utils.InternalError(c, "Auth service not implemented yet")
}

func proxyToUserService(c *gin.Context) {
	// TODO: Implement HTTP proxy to user-service
	utils.InternalError(c, "User service not implemented yet")
}

func proxyToGameService(c *gin.Context) {
	// TODO: Implement HTTP proxy to game-service
	utils.InternalError(c, "Game service not implemented yet")
}

func proxyWebSocket(c *gin.Context) {
	// TODO: Implement WebSocket proxy to websocket-service
	utils.InternalError(c, "WebSocket service not implemented yet")
}