# Docker Deployment Guide

This document describes how to deploy the Multimodal Interactive Gaming Platform using Docker.

## Quick Start

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- Make (optional, for convenience commands)

### Development Environment

```bash
# Clone the repository
git clone <repository-url>
cd gyroscope-app

# Copy environment file
cp .env.example .env

# Start development services
make up
# or
docker-compose up -d

# Access the application
open http://localhost:3000
```

### Production Environment

```bash
# Start production services with Nginx
make up-prod
# or
docker-compose --profile production up -d

# Access the application
open https://localhost
```

## Architecture Overview

The platform consists of the following services:

### Core Services
- **Frontend** (Next.js): React application with SSR
- **API Gateway** (Go): Central API routing and authentication
- **WebSocket Service** (Go): Real-time communication
- **Auth Service** (Go): User authentication and authorization
- **User Service** (Go): User management
- **Game Service** (Go): Game logic and session management

### Infrastructure Services  
- **PostgreSQL**: Primary database
- **Redis**: Cache and message broker
- **Nginx**: Load balancer and reverse proxy

### Monitoring Services
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization and dashboards

## Service Profiles

The Docker Compose configuration uses profiles to organize services:

- **default**: Core services (frontend, backend, database, redis)
- **production**: Adds Nginx load balancer
- **monitoring**: Adds Prometheus and Grafana
- **development**: Development-specific configurations

## Environment Variables

Copy `.env.example` to `.env` and customize:

### Database Configuration
```bash
POSTGRES_DB=multimodal_platform
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-secure-password
```

### Service Ports
```bash
FRONTEND_PORT=3000
API_GATEWAY_PORT=8080
WEBSOCKET_PORT=8081
```

### Application Configuration
```bash
JWT_SECRET=your-super-secret-jwt-key
USE_DATABASE=true
NODE_ENV=production
```

## Available Commands

### Using Make
```bash
make help            # Show all available commands
make build           # Build all images
make up              # Start development environment
make up-prod         # Start production environment
make up-monitoring   # Start with monitoring stack
make down            # Stop all services
make clean           # Clean up everything
make logs            # View logs
make status          # Show container status
make health          # Run health checks
```

### Using Docker Compose Directly
```bash
# Development
docker-compose up -d

# Production
docker-compose --profile production up -d

# With monitoring
docker-compose --profile production --profile monitoring up -d

# View logs
docker-compose logs -f [service-name]

# Stop services
docker-compose down
```

## Development Workflow

### Hot Reloading
The development configuration includes hot reloading for the frontend:

```bash
# Start development services
make up

# Frontend will reload automatically when files change
# Backend services require container restart for changes
```

### Debugging
The frontend development container exposes port 9229 for Node.js debugging:

```bash
# Start services
make up

# Connect debugger to localhost:9229
```

### Database Operations
```bash
# Access database shell
make shell-postgres

# Run migrations
make db-migrate

# Create backup
make backup-db

# Restore from backup
make restore-db BACKUP_FILE=backup.sql
```

## Production Deployment

### SSL Certificates
Place SSL certificates in `nginx/ssl/`:
```
nginx/ssl/
├── cert.pem
└── key.pem
```

### Environment Security
- Change all default passwords
- Use strong JWT secrets
- Enable firewall rules
- Regular security updates

### Monitoring
Access monitoring dashboards:
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001 (admin/admin)

### Health Checks
All services include health checks:
```bash
# Check all service health
make health

# View container health status
docker-compose ps
```

## Scaling

### Horizontal Scaling
Scale individual services:
```bash
# Scale API Gateway
docker-compose up -d --scale api-gateway=3

# Scale Game Service  
docker-compose up -d --scale game-service=2
```

### Load Balancing
Nginx automatically balances load across scaled instances.

## Troubleshooting

### Common Issues

**Port conflicts:**
```bash
# Check port usage
netstat -tulpn | grep :3000

# Change ports in .env file
```

**Memory issues:**
```bash
# Increase Docker memory limit
# Check Docker Desktop settings

# Monitor resource usage
docker stats
```

**Database connection issues:**
```bash
# Check database health
docker-compose exec postgres pg_isready

# View database logs
docker-compose logs postgres
```

**Build failures:**
```bash
# Clean build cache
docker builder prune

# Rebuild from scratch
docker-compose build --no-cache
```

### Log Analysis
```bash
# View all logs
make logs

# View specific service logs
docker-compose logs -f frontend

# Search logs
docker-compose logs | grep "ERROR"
```

### Container Debugging
```bash
# Access container shell
make shell-frontend
make shell-backend

# Check container processes
docker-compose exec frontend ps aux

# Check container resources
docker stats --no-stream
```

## Security Considerations

### Network Security
- Services communicate through internal Docker networks
- Only necessary ports are exposed to host
- Nginx handles SSL termination

### Data Security
- Database passwords in environment variables
- JWT secrets properly configured
- Regular security scanning with Docker Scout

### Image Security
```bash
# Scan for vulnerabilities
make security-scan

# Use specific image versions in production
# Regularly update base images
```

## Backup and Recovery

### Database Backups
```bash
# Automated backup
make backup-db

# Restore backup
make restore-db BACKUP_FILE=backup_20231201_120000.sql
```

### Volume Backups
```bash
# Backup volumes
docker run --rm -v multimodal_postgres_data:/data -v $(pwd):/backup alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore volumes  
docker run --rm -v multimodal_postgres_data:/data -v $(pwd):/backup alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

## Performance Optimization

### Image Optimization
- Multi-stage builds reduce image size
- .dockerignore excludes unnecessary files
- Layer caching optimizes build times

### Resource Limits
Add resource limits in docker-compose.yml:
```yaml
services:
  frontend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

### Caching
- Redis caches API responses
- Nginx caches static assets
- Browser caching headers configured

## Monitoring and Metrics

### Application Metrics
- Custom metrics exported to Prometheus
- Business metrics tracked
- Error rates monitored

### Infrastructure Metrics
- Container resource usage
- Database performance
- Network traffic

### Alerting
Configure Grafana alerts for:
- High error rates
- Resource exhaustion
- Service downtime
- Database connection issues

## Contributing

When modifying Docker configurations:
1. Test changes in development profile
2. Update documentation
3. Verify security implications
4. Test production deployment

For questions or issues, please refer to the main README or create an issue.