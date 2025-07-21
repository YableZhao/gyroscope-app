# Multimodal Interactive Gaming Platform - Docker Management
.PHONY: help build up down clean logs shell test lint

# Default target
help:
	@echo "Available commands:"
	@echo "  build          - Build all Docker images"
	@echo "  up             - Start all services (development)"
	@echo "  up-prod        - Start all services (production with Nginx)"
	@echo "  up-monitoring  - Start services with monitoring stack"
	@echo "  down           - Stop and remove all containers"
	@echo "  clean          - Remove all containers, images, and volumes"
	@echo "  logs           - Show logs for all services"
	@echo "  logs-frontend  - Show frontend logs"
	@echo "  logs-backend   - Show backend services logs"
	@echo "  shell-frontend - Open shell in frontend container"
	@echo "  shell-backend  - Open shell in backend container"
	@echo "  db-migrate     - Run database migrations"
	@echo "  db-seed        - Seed database with test data"
	@echo "  test           - Run tests in containers"
	@echo "  lint           - Run linting in containers"
	@echo "  status         - Show container status"

# Build all images
build:
	@echo "Building all Docker images..."
	docker-compose build --parallel

# Development environment (without production services)
up:
	@echo "Starting development environment..."
	docker-compose --profile development up -d
	@echo "Services available at:"
	@echo "  Frontend: http://localhost:3000"
	@echo "  API Gateway: http://localhost:8080"
	@echo "  WebSocket: ws://localhost:8081"

# Production environment with Nginx
up-prod:
	@echo "Starting production environment..."
	docker-compose --profile production up -d
	@echo "Production services available at:"
	@echo "  Application: https://localhost (via Nginx)"
	@echo "  Direct Frontend: http://localhost:3000"

# Full stack with monitoring
up-monitoring:
	@echo "Starting full stack with monitoring..."
	docker-compose --profile monitoring --profile production up -d
	@echo "All services available:"
	@echo "  Application: https://localhost"
	@echo "  Prometheus: http://localhost:9090"
	@echo "  Grafana: http://localhost:3001"

# Stop all services
down:
	@echo "Stopping all services..."
	docker-compose --profile development --profile production --profile monitoring down

# Clean up everything
clean:
	@echo "Cleaning up containers, images, and volumes..."
	docker-compose --profile development --profile production --profile monitoring down -v
	docker system prune -f --volumes
	docker image prune -f

# Show logs
logs:
	docker-compose logs -f

logs-frontend:
	docker-compose logs -f frontend frontend-dev

logs-backend:
	docker-compose logs -f api-gateway websocket-service auth-service user-service game-service

# Database operations
db-migrate:
	@echo "Running database migrations..."
	docker-compose exec postgres psql -U postgres -d multimodal_platform -f /docker-entrypoint-initdb.d/init.sql

db-seed:
	@echo "Seeding database with test data..."
	# Add your seeding commands here
	docker-compose exec postgres psql -U postgres -d multimodal_platform -c "INSERT INTO test_data..."

# Shell access
shell-frontend:
	docker-compose exec frontend sh

shell-backend:
	docker-compose exec api-gateway sh

shell-postgres:
	docker-compose exec postgres psql -U postgres -d multimodal_platform

shell-redis:
	docker-compose exec redis redis-cli

# Testing
test:
	@echo "Running frontend tests..."
	docker-compose exec frontend npm test
	@echo "Running backend tests..."
	# Add backend test commands here

# Linting
lint:
	@echo "Running frontend linting..."
	docker-compose exec frontend npm run lint
	@echo "Running backend linting..."
	# Add backend lint commands here

# Status check
status:
	@echo "Container status:"
	docker-compose ps
	@echo "\nResource usage:"
	docker stats --no-stream

# Health check
health:
	@echo "Checking service health..."
	@curl -f http://localhost:3000/api/health || echo "Frontend health check failed"
	@curl -f http://localhost:8080/health || echo "API Gateway health check failed"
	@curl -f http://localhost:8081/health || echo "WebSocket service health check failed"

# Development helpers
dev-install:
	@echo "Installing development dependencies..."
	cd frontend && npm install
	cd backend && go mod download

dev-reset:
	@echo "Resetting development environment..."
	$(MAKE) down
	$(MAKE) clean
	$(MAKE) build
	$(MAKE) up

# Security scan (requires Docker Scout)
security-scan:
	@echo "Running security scan on images..."
	docker scout cves --format table --output security-report.txt

# Backup database
backup-db:
	@echo "Creating database backup..."
	docker-compose exec postgres pg_dump -U postgres multimodal_platform > backup_$(shell date +%Y%m%d_%H%M%S).sql

# Restore database
restore-db:
	@echo "Usage: make restore-db BACKUP_FILE=backup_file.sql"
	@test -n "$(BACKUP_FILE)" || (echo "Please specify BACKUP_FILE"; exit 1)
	docker-compose exec -T postgres psql -U postgres multimodal_platform < $(BACKUP_FILE)