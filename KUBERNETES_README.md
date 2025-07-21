# Kubernetes Deployment Guide

This guide provides comprehensive instructions for deploying the Multimodal Interactive Gaming Platform on Kubernetes.

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [Manual Deployment](#manual-deployment)
- [Monitoring](#monitoring)
- [Security](#security)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Architecture Overview

The platform is deployed using a microservices architecture with the following components:

### Core Services
- **Frontend** (Next.js): React application with server-side rendering
- **API Gateway**: Central routing and authentication
- **WebSocket Service**: Real-time communication handling
- **Auth Service**: User authentication and authorization
- **User Service**: User profile and management
- **Game Service**: Game logic and session management

### Infrastructure Services
- **PostgreSQL**: Primary database for persistent data
- **Redis**: Caching and message broker
- **Nginx**: Load balancer and ingress controller

### Monitoring Stack
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Metrics visualization and dashboards

## Prerequisites

### Required Tools
```bash
# Kubernetes CLI
kubectl version --client
# Should be >= 1.21

# Kustomize (or kubectl with kustomize support)
kustomize version
# or
kubectl version --client | grep kustomize

# Docker (for image building)
docker --version

# Optional: Helm for additional components
helm version
```

### Cluster Requirements
- Kubernetes 1.21+
- At least 3 worker nodes (for production)
- Container runtime (Docker, containerd, or CRI-O)
- CSI storage driver for persistent volumes
- Ingress controller (nginx, traefik, etc.)
- LoadBalancer support or external load balancer

### Resource Requirements

#### Development
- CPU: 2 cores minimum
- Memory: 4GB minimum
- Storage: 20GB minimum

#### Production
- CPU: 8 cores minimum
- Memory: 16GB minimum
- Storage: 100GB minimum (with proper backup)

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd gyroscope-app
```

### 2. Deploy to Development
```bash
# Deploy to development environment
./k8s/deploy.sh

# Or manually with kubectl
kubectl apply -k k8s/overlays/development
```

### 3. Access the Application
```bash
# Port forward to access locally
kubectl port-forward -n multimodal-platform-dev svc/frontend-service 3000:3000

# Open browser
open http://localhost:3000
```

## Environment Configuration

The deployment supports three environments with different configurations:

### Development
- **Namespace**: `multimodal-platform-dev`
- **Replicas**: 1 per service
- **Resources**: Minimal (for local development)
- **Debug**: Enabled
- **Monitoring**: Optional

### Staging
- **Namespace**: `multimodal-platform-staging`
- **Replicas**: 2 per service
- **Resources**: Medium (production-like)
- **Debug**: Disabled
- **Monitoring**: Enabled

### Production
- **Namespace**: `multimodal-platform-prod`
- **Replicas**: 3+ per service
- **Resources**: High availability
- **Security**: Network policies, pod security standards
- **Monitoring**: Full stack with alerting

## Manual Deployment

### 1. Create Namespace
```bash
kubectl create namespace multimodal-platform-dev
```

### 2. Deploy Infrastructure Services
```bash
# PostgreSQL and Redis
kubectl apply -k k8s/base -l app.kubernetes.io/component=database
kubectl apply -k k8s/base -l app.kubernetes.io/component=cache

# Wait for databases to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=postgres -n multimodal-platform-dev --timeout=300s
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=redis -n multimodal-platform-dev --timeout=300s
```

### 3. Deploy Application Services
```bash
# Backend services
kubectl apply -k k8s/base -l app.kubernetes.io/component=auth
kubectl apply -k k8s/base -l app.kubernetes.io/component=user
kubectl apply -k k8s/base -l app.kubernetes.io/component=game
kubectl apply -k k8s/base -l app.kubernetes.io/component=gateway
kubectl apply -k k8s/base -l app.kubernetes.io/component=realtime

# Frontend
kubectl apply -k k8s/base -l app.kubernetes.io/component=web

# Load balancer
kubectl apply -k k8s/base -l app.kubernetes.io/component=loadbalancer
```

### 4. Verify Deployment
```bash
# Check pod status
kubectl get pods -n multimodal-platform-dev

# Check services
kubectl get svc -n multimodal-platform-dev

# Check ingress
kubectl get ingress -n multimodal-platform-dev
```

## Monitoring

### Deploy Monitoring Stack
```bash
# Deploy Prometheus and Grafana
kubectl apply -f k8s/monitoring/

# Port forward to access Grafana
kubectl port-forward -n multimodal-platform svc/grafana-service 3001:3000

# Access Grafana at http://localhost:3001
# Default credentials: admin/admin
```

### Available Metrics
- **Application Metrics**: Request rates, response times, error rates
- **Infrastructure Metrics**: CPU, memory, disk usage
- **Business Metrics**: Active games, user sessions, game completion rates
- **Database Metrics**: Connection pools, query performance

### Custom Dashboards
The deployment includes pre-configured Grafana dashboards:
- **Platform Overview**: High-level metrics
- **Service Performance**: Individual service metrics
- **Infrastructure Health**: Cluster and node metrics
- **Game Analytics**: Game-specific business metrics

## Security

### Network Security
```bash
# Apply network policies (production only)
kubectl apply -f k8s/overlays/production/network-policies.yaml
```

Network policies restrict communication between pods:
- Frontend can only communicate with API Gateway and database
- API Gateway can communicate with all backend services
- Backend services can only access required resources

### Pod Security
- **Non-root users**: All containers run as non-root
- **Read-only filesystems**: Where possible
- **Resource limits**: CPU and memory limits enforced
- **Security contexts**: Minimal privileges

### Secret Management
```bash
# Create secrets for production
kubectl create secret generic production-secrets \
  --from-literal=JWT_SECRET=your-strong-jwt-secret \
  --from-literal=POSTGRES_PASSWORD=your-strong-db-password \
  -n multimodal-platform-prod

# Or use external secret management
kubectl apply -f k8s/overlays/production/external-secrets.yaml
```

### SSL/TLS
```bash
# Install cert-manager for automatic SSL certificates
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.11.0/cert-manager.yaml

# Configure ClusterIssuer for Let's Encrypt
kubectl apply -f - <<EOF
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: your-email@domain.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

## Scaling

### Horizontal Pod Autoscaling
HPA is configured for main services:

```bash
# View HPA status
kubectl get hpa -n multimodal-platform-prod

# Manual scaling
kubectl scale deployment frontend --replicas=5 -n multimodal-platform-prod
```

### Vertical Pod Autoscaling
```bash
# Install VPA (if available)
kubectl apply -f https://github.com/kubernetes/autoscaler/tree/master/vertical-pod-autoscaler/deploy/vpa-v1-crd-gen.yaml

# Apply VPA configuration
kubectl apply -f - <<EOF
apiVersion: autoscaling.k8s.io/v1
kind: VerticalPodAutoscaler
metadata:
  name: frontend-vpa
  namespace: multimodal-platform-prod
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  updatePolicy:
    updateMode: "Auto"
EOF
```

### Database Scaling
For production, consider:
- **Read replicas**: For read-heavy workloads
- **Connection pooling**: Using PgBouncer
- **Partitioning**: For large datasets

```bash
# Deploy PgBouncer
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: pgbouncer
  namespace: multimodal-platform-prod
spec:
  replicas: 2
  selector:
    matchLabels:
      app: pgbouncer
  template:
    metadata:
      labels:
        app: pgbouncer
    spec:
      containers:
      - name: pgbouncer
        image: pgbouncer/pgbouncer:latest
        ports:
        - containerPort: 5432
        env:
        - name: DATABASES_HOST
          value: postgres-service
        - name: DATABASES_PORT
          value: "5432"
        - name: DATABASES_USER
          value: postgres
        - name: DATABASES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: postgres-secret
              key: POSTGRES_PASSWORD
        - name: DATABASES_DBNAME
          value: multimodal_platform
        - name: POOL_MODE
          value: transaction
        - name: MAX_CLIENT_CONN
          value: "1000"
        - name: DEFAULT_POOL_SIZE
          value: "25"
EOF
```

## Troubleshooting

### Common Issues

#### Pod Startup Issues
```bash
# Check pod status and events
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace>

# Check previous container logs (if crashed)
kubectl logs <pod-name> --previous -n <namespace>
```

#### Database Connection Issues
```bash
# Test database connectivity
kubectl exec -it deployment/postgres -n <namespace> -- psql -U postgres -d multimodal_platform -c "SELECT 1;"

# Check service DNS resolution
kubectl exec -it <any-pod> -n <namespace> -- nslookup postgres-service
```

#### Performance Issues
```bash
# Check resource usage
kubectl top pods -n <namespace>
kubectl top nodes

# Check HPA status
kubectl get hpa -n <namespace>

# Check for resource constraints
kubectl describe nodes
```

#### Network Issues
```bash
# Test internal service connectivity
kubectl exec -it <frontend-pod> -n <namespace> -- curl http://api-gateway-service:8080/health

# Check network policies (if enabled)
kubectl get networkpolicy -n <namespace>

# Debug DNS issues
kubectl exec -it <pod> -n <namespace> -- dig api-gateway-service.<namespace>.svc.cluster.local
```

### Debugging Commands

```bash
# Get all resources in namespace
kubectl get all -n <namespace>

# Describe problematic resources
kubectl describe <resource-type> <resource-name> -n <namespace>

# Shell into container for debugging
kubectl exec -it <pod-name> -n <namespace> -- /bin/sh

# Port forward for local testing
kubectl port-forward -n <namespace> pod/<pod-name> <local-port>:<container-port>

# Check cluster events
kubectl get events --sort-by='.lastTimestamp' -n <namespace>
```

## Maintenance

### Backup Procedures

#### Database Backup
```bash
# Create database backup
kubectl exec -it deployment/postgres -n <namespace> -- pg_dump -U postgres multimodal_platform > backup-$(date +%Y%m%d).sql

# Restore database
kubectl exec -i deployment/postgres -n <namespace> -- psql -U postgres multimodal_platform < backup.sql
```

#### Configuration Backup
```bash
# Export all configurations
kubectl get all,configmap,secret,pvc -n <namespace> -o yaml > cluster-backup-$(date +%Y%m%d).yaml
```

### Updates and Upgrades

#### Application Updates
```bash
# Update image tags in kustomization
# Then apply updates
kubectl apply -k k8s/overlays/production

# Rolling restart if needed
kubectl rollout restart deployment -n <namespace>

# Monitor rollout
kubectl rollout status deployment/<deployment-name> -n <namespace>
```

#### Kubernetes Cluster Updates
1. **Backup everything**: Configurations, data, certificates
2. **Update worker nodes**: One at a time, drain before updating
3. **Update control plane**: Follow your cloud provider's process
4. **Test thoroughly**: Verify all services work correctly

### Monitoring and Alerting

#### Set up Alerts
```yaml
# Example Prometheus alert rules
groups:
- name: platform-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High error rate detected"
      
  - alert: DatabaseDown
    expr: up{job="postgres"} == 0
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "Database is down"
```

#### Log Aggregation
```bash
# Install Fluentd or similar for log collection
kubectl apply -f https://raw.githubusercontent.com/fluent/fluentd-kubernetes-daemonset/master/fluentd-daemonset-elasticsearch.yaml
```

### Performance Tuning

#### Database Optimization
```sql
-- Add indexes for common queries
CREATE INDEX idx_game_sessions_room_id ON game_sessions(room_id);
CREATE INDEX idx_player_responses_session_id ON player_responses(session_id);
CREATE INDEX idx_users_email ON users(email);

-- Optimize PostgreSQL settings
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
```

#### Application Optimization
- **Connection pooling**: Implement at application level
- **Caching strategies**: Use Redis effectively
- **Database queries**: Optimize N+1 queries
- **Static assets**: Use CDN for production

## Disaster Recovery

### Backup Strategy
1. **Database backups**: Daily automated backups
2. **Configuration backups**: Version controlled in Git
3. **Persistent volumes**: Regular snapshots
4. **Secrets backup**: Securely stored offline

### Recovery Procedures
1. **Deploy infrastructure**: Database, Redis, networking
2. **Restore data**: From latest backup
3. **Deploy applications**: Using version-controlled manifests
4. **Verify functionality**: Run health checks and tests
5. **Update DNS/routing**: Point traffic to recovered system

## Contributing

When modifying Kubernetes configurations:

1. **Test locally**: Use development environment first
2. **Security review**: Check for security implications
3. **Resource planning**: Ensure adequate resources
4. **Documentation**: Update this guide as needed
5. **Rollback plan**: Always have a rollback strategy

For questions or issues, please refer to the main project documentation or create an issue in the repository.