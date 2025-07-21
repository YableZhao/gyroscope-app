# Quick Start Guide

## 🚀 Option 1: Frontend Only (Fastest Setup)

This runs just the frontend with mock data - perfect for testing the UI and features.

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

**Access the app at: http://localhost:3000**

### What you'll see:
- ✅ Complete UI with all game components
- ✅ Multi-modal input handling (gyroscope, voice, gesture)
- ✅ Room creation and joining (with mock data)
- ✅ Game interface with all question types
- ✅ Real-time features (simulated)

---

## 🐳 Option 2: Full Stack with Docker (Recommended)

This runs the complete application with all services.

### Prerequisites:
- Docker Desktop installed and running
- At least 4GB RAM available for Docker

### Steps:

```bash
# Navigate to project root
cd /Users/yable/Projects/gyroscope-app

# Start all services
docker-compose up -d

# View logs (optional)
docker-compose logs -f
```

### Services that will start:
- **Frontend**: http://localhost:3000
- **Database**: PostgreSQL on port 5432
- **Cache**: Redis on port 6379
- **API Gateway**: http://localhost:8080 (when backend is ready)

### To stop:
```bash
docker-compose down
```

---

## 🔧 Option 3: Local Development Setup

For active development with hot reloading.

### Frontend Setup:
```bash
cd frontend

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start development server
npm run dev
```

### Backend Setup (Optional):
```bash
cd backend

# Install Go dependencies
go mod download

# Set up environment
cp .env.example .env

# Start PostgreSQL (via Docker)
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=multimodal_platform \
  -p 5432:5432 \
  postgres:15-alpine

# Start Redis (via Docker)  
docker run -d --name redis -p 6379:6379 redis:7-alpine

# Run migrations (when ready)
# go run migrations/migrate.go

# Start services
make dev
```

---

## 🌐 Option 4: Production Deployment

### With Kubernetes:
```bash
# Deploy to development environment
./k8s/deploy.sh

# Or manually
kubectl apply -k k8s/overlays/development

# Port forward to access
kubectl port-forward -n multimodal-platform-dev svc/frontend-service 3000:3000
```

### With Docker Compose (Production):
```bash
# Start production stack
docker-compose --profile production up -d

# Access via Nginx load balancer
# http://localhost (port 80)
```

---

## 🎮 How to Use the Platform

### 1. **Home Page** (http://localhost:3000)
- Welcome screen with platform introduction
- Navigation to lobby and game areas

### 2. **Create/Join Room** 
- Click "Create Room" or "Join Room"
- For testing, use any 4-6 character room code
- Configure room settings (max players, time limits, etc.)

### 3. **Game Lobby**
- Wait for other players (or simulate them)
- Host can start the game when ready
- Real-time participant updates

### 4. **Game Interface**
- Multiple question types available:
  - **Multiple Choice**: Tap/click answers
  - **Orientation Match**: Use device gyroscope
  - **Voice Command**: Speak your answer
  - **Gesture Recognition**: Use camera for hand gestures
  - **Touch Input**: Touch/swipe interactions

### 5. **Multi-Modal Features**
- **Gyroscope**: Tilt your device to control elements
- **Voice**: Click mic button and speak
- **Camera**: Enable camera for gesture detection
- **Touch**: Standard touch interactions

---

## 🔍 Testing Features

### Gyroscope (Works on mobile devices):
1. Open site on your phone
2. Allow motion permissions when prompted  
3. Tilt device to see gyroscope visualization
4. Try orientation-based questions

### Voice Recognition:
1. Click the microphone button
2. Allow microphone permissions
3. Speak clearly for voice commands
4. Works best in quiet environments

### Gesture Detection:
1. Allow camera permissions
2. Use hand gestures in camera view
3. Try different hand positions
4. Works with MediaPipe integration

### Real-time Features:
1. Open multiple browser tabs/windows
2. Join the same room from different tabs
3. See real-time updates across all instances
4. Test multiplayer game sessions

---

## 🐛 Troubleshooting

### Common Issues:

#### Port Already in Use:
```bash
# Kill processes on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- --port 3001
```

#### Docker Issues:
```bash
# Restart Docker Desktop
# Then clean up and restart
docker-compose down
docker system prune -f
docker-compose up -d
```

#### Permission Issues (Mobile):
- **Gyroscope**: Reload page and allow motion permissions
- **Camera**: Allow camera access in browser settings
- **Microphone**: Allow microphone access when prompted

#### Database Connection:
```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Restart database
docker-compose restart postgres
```

### Performance Tips:
- **Chrome/Safari recommended** for best WebRTC support
- **Mobile device recommended** for gyroscope features
- **Good internet connection** for real-time features
- **Allow all permissions** for full experience

---

## 📱 Mobile Experience

### For best mobile experience:
1. **Use Chrome or Safari** on mobile
2. **Add to Home Screen** for PWA experience
3. **Allow all permissions** (motion, camera, mic)
4. **Use in landscape mode** for some games
5. **Ensure stable wifi** for real-time features

### Mobile-Specific Features:
- Device orientation detection
- Touch gestures and swipes  
- Vibration feedback (where supported)
- Mobile-optimized UI components

---

## 🎯 Next Steps

### For Development:
1. **Explore the code**: Check out the well-documented source
2. **Modify components**: All UI components are in `frontend/src/components`
3. **Add new features**: Use the existing patterns and hooks
4. **Test thoroughly**: Run `npm test` for unit tests

### For Production:
1. **Set up infrastructure**: Use the Kubernetes manifests
2. **Configure domains**: Update ingress configurations
3. **Set up monitoring**: Deploy Prometheus/Grafana stack
4. **Configure CI/CD**: Set up the GitHub Actions workflows

### For Demo/Portfolio:
1. **Record videos**: Show off the multi-modal features
2. **Take screenshots**: Capture the polished UI
3. **Prepare talking points**: Highlight the tech stack
4. **Deploy publicly**: Use the production deployment guides

---

## 🤝 Getting Help

If you run into issues:

1. **Check the logs**: `docker-compose logs -f`
2. **Verify ports**: Make sure no conflicts with other services
3. **Test permissions**: Ensure browser permissions are granted
4. **Try different browsers**: Chrome usually works best
5. **Check documentation**: Refer to the detailed README files

The platform is designed to work out-of-the-box with minimal setup. The frontend-only option is perfect for showcasing the UI and interactions, while the full Docker setup demonstrates the complete architecture!

Happy gaming! 🎮✨