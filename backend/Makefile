# Multimodal Platform - Go Microservices Makefile

# Variables
DOCKER_COMPOSE = docker-compose
GO = go
PROTOC = protoc

# Service names
SERVICES = api-gateway websocket-service auth-service user-service game-service

# Default target
.PHONY: help
help: ## Show this help message
	@echo "Multimodal Platform - Development Commands"
	@echo "=========================================="
	@awk 'BEGIN {FS = ":.*##"; printf "\nUsage:\n  make \033[36m<target>\033[0m\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2 } /^##@/ { printf "\n\033[1m%s\033[0m\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

.PHONY: dev
dev: ## Start development environment
	$(DOCKER_COMPOSE) up --build

.PHONY: dev-detached
dev-detached: ## Start development environment in background
	$(DOCKER_COMPOSE) up --build -d

.PHONY: logs
logs: ## View logs from all services
	$(DOCKER_COMPOSE) logs -f

.PHONY: logs-service
logs-service: ## View logs from specific service (usage: make logs-service SERVICE=api-gateway)
	$(DOCKER_COMPOSE) logs -f $(SERVICE)

##@ Building

.PHONY: build
build: ## Build all services
	$(DOCKER_COMPOSE) build

.PHONY: build-service
build-service: ## Build specific service (usage: make build-service SERVICE=api-gateway)
	$(DOCKER_COMPOSE) build $(SERVICE)

.PHONY: proto
proto: ## Generate gRPC code from protobuf files
	$(PROTOC) --go_out=. --go_opt=paths=source_relative \
		--go-grpc_out=. --go-grpc_opt=paths=source_relative \
		shared/proto/*.proto

##@ Testing

.PHONY: test
test: ## Run all tests
	$(GO) test ./...

.PHONY: test-verbose
test-verbose: ## Run tests with verbose output
	$(GO) test -v ./...

.PHONY: test-coverage
test-coverage: ## Run tests with coverage report
	$(GO) test -coverprofile=coverage.out ./...
	$(GO) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

.PHONY: benchmark
benchmark: ## Run benchmark tests
	$(GO) test -bench=. -benchmem ./...

##@ Code Quality

.PHONY: lint
lint: ## Run linter
	golangci-lint run

.PHONY: fmt
fmt: ## Format code
	$(GO) fmt ./...

.PHONY: vet
vet: ## Run go vet
	$(GO) vet ./...

.PHONY: mod-tidy
mod-tidy: ## Tidy go modules
	$(GO) mod tidy

.PHONY: security-check
security-check: ## Run security vulnerability check
	gosec ./...

##@ Database

.PHONY: db-up
db-up: ## Start only database services
	$(DOCKER_COMPOSE) up postgres redis -d

.PHONY: db-migrate
db-migrate: ## Run database migrations
	$(GO) run migrations/migrate.go

.PHONY: db-seed
db-seed: ## Seed database with test data
	$(GO) run scripts/seed.go

.PHONY: db-reset
db-reset: ## Reset database (WARNING: This will delete all data)
	$(DOCKER_COMPOSE) down -v
	$(DOCKER_COMPOSE) up postgres redis -d
	sleep 5
	make db-migrate
	make db-seed

##@ Docker

.PHONY: docker-clean
docker-clean: ## Clean up Docker resources
	$(DOCKER_COMPOSE) down -v --remove-orphans
	docker system prune -f

.PHONY: docker-logs
docker-logs: ## View Docker logs
	$(DOCKER_COMPOSE) logs

##@ Production

.PHONY: prod-up
prod-up: ## Start production environment with monitoring
	$(DOCKER_COMPOSE) --profile production --profile monitoring up -d

.PHONY: prod-down
prod-down: ## Stop production environment
	$(DOCKER_COMPOSE) --profile production --profile monitoring down

##@ Monitoring

.PHONY: monitoring-up
monitoring-up: ## Start monitoring stack (Prometheus + Grafana)
	$(DOCKER_COMPOSE) --profile monitoring up -d

.PHONY: monitoring-down
monitoring-down: ## Stop monitoring stack
	$(DOCKER_COMPOSE) --profile monitoring down

##@ Utilities

.PHONY: health-check
health-check: ## Check health of all services
	@echo "Checking service health..."
	@curl -f http://localhost:8080/health || echo "API Gateway: DOWN"
	@curl -f http://localhost:8081/health || echo "WebSocket Service: DOWN"
	@curl -f http://localhost:8082/health || echo "Auth Service: DOWN"
	@curl -f http://localhost:8083/health || echo "User Service: DOWN"
	@curl -f http://localhost:8084/health || echo "Game Service: DOWN"

.PHONY: generate-docs
generate-docs: ## Generate API documentation
	swag init -g api-gateway/main.go

.PHONY: clean
clean: ## Clean build artifacts
	$(GO) clean ./...
	rm -f coverage.out coverage.html

##@ Setup

.PHONY: setup
setup: ## Initial setup for development
	@echo "Setting up development environment..."
	@command -v $(GO) >/dev/null 2>&1 || { echo "Go is not installed. Please install Go 1.21+"; exit 1; }
	@command -v docker >/dev/null 2>&1 || { echo "Docker is not installed. Please install Docker"; exit 1; }
	@command -v $(DOCKER_COMPOSE) >/dev/null 2>&1 || { echo "Docker Compose is not installed. Please install Docker Compose"; exit 1; }
	$(GO) mod download
	@echo "✅ Development environment setup complete!"
	@echo "Run 'make dev' to start the development environment"

.PHONY: setup-tools
setup-tools: ## Install development tools
	$(GO) install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	$(GO) install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest
	$(GO) install github.com/swaggo/swag/cmd/swag@latest
	@echo "✅ Development tools installed"

##@ Environment

.PHONY: env-example
env-example: ## Create example environment file
	@echo "Creating .env.example..."
	@cat > .env.example << 'EOF'
# Database
DATABASE_URL=postgres://postgres:postgres@localhost:5432/multimodal_platform?sslmode=disable

# Redis
REDIS_ADDR=localhost:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Services
API_GATEWAY_PORT=8080
WEBSOCKET_SERVICE_PORT=8081
AUTH_SERVICE_PORT=8082
USER_SERVICE_PORT=8083
GAME_SERVICE_PORT=8084

# Environment
GIN_MODE=debug

# External APIs (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF
	@echo "✅ .env.example created. Copy to .env and update values."

##@ All-in-one Commands

.PHONY: fresh-start
fresh-start: docker-clean setup db-up db-migrate dev ## Complete fresh start (clean + setup + start)

.PHONY: quick-start
quick-start: build dev-detached health-check ## Quick start for development

# Include OS-specific targets
ifeq ($(OS),Windows_NT)
    include Makefile.windows
else
    include Makefile.unix
endif