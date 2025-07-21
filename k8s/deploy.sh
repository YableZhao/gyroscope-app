#!/bin/bash

# Multimodal Platform Kubernetes Deployment Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
ENVIRONMENT="development"
NAMESPACE=""
DRY_RUN=false
VERBOSE=false
SKIP_BUILD=false

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to show usage
usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Deploy Multimodal Platform to Kubernetes

OPTIONS:
    -e, --environment ENVIRONMENT    Deployment environment (development|staging|production)
                                    Default: development
    -n, --namespace NAMESPACE       Kubernetes namespace (optional, auto-detected from environment)
    -d, --dry-run                   Show what would be deployed without applying
    -v, --verbose                   Enable verbose output
    -s, --skip-build               Skip Docker image building
    -h, --help                     Show this help message

EXAMPLES:
    $0                              # Deploy to development environment
    $0 -e production                # Deploy to production environment
    $0 -e staging -d                # Dry run for staging environment
    $0 -e production -v             # Deploy to production with verbose output

PREREQUISITES:
    - kubectl configured and connected to your cluster
    - kustomize installed (or kubectl with kustomize support)
    - Docker daemon running (unless --skip-build is used)
    - Access to container registry for your images

ENVIRONMENTS:
    development: Local/dev cluster, reduced resources, debug mode
    staging:     Staging cluster, production-like setup for testing
    production:  Production cluster, full security and monitoring
EOF
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--environment)
            ENVIRONMENT="$2"
            shift 2
            ;;
        -n|--namespace)
            NAMESPACE="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -s|--skip-build)
            SKIP_BUILD=true
            shift
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
done

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(development|staging|production)$ ]]; then
    print_error "Invalid environment: $ENVIRONMENT"
    print_error "Must be one of: development, staging, production"
    exit 1
fi

# Auto-detect namespace if not provided
if [[ -z "$NAMESPACE" ]]; then
    case $ENVIRONMENT in
        development)
            NAMESPACE="multimodal-platform-dev"
            ;;
        staging)
            NAMESPACE="multimodal-platform-staging"
            ;;
        production)
            NAMESPACE="multimodal-platform-prod"
            ;;
    esac
fi

print_status "Deploying to environment: $ENVIRONMENT"
print_status "Using namespace: $NAMESPACE"

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v kubectl &> /dev/null; then
    print_error "kubectl is not installed or not in PATH"
    exit 1
fi

if ! kubectl cluster-info &> /dev/null; then
    print_error "kubectl is not configured or cluster is not accessible"
    exit 1
fi

if ! kubectl version --client --output=yaml | grep -q kustomize && ! command -v kustomize &> /dev/null; then
    print_error "kustomize is not available (either standalone or in kubectl)"
    exit 1
fi

if [[ "$SKIP_BUILD" == false ]] && ! docker info &> /dev/null; then
    print_warning "Docker is not running. Use --skip-build if images are already built and pushed."
    exit 1
fi

print_success "Prerequisites check passed"

# Build and push Docker images (unless skipped)
if [[ "$SKIP_BUILD" == false ]]; then
    print_status "Building and pushing Docker images..."
    
    # Change to project root directory
    cd "$(dirname "$0")/.."
    
    # Build images with appropriate tags
    case $ENVIRONMENT in
        development)
            IMAGE_TAG="dev"
            ;;
        staging)
            IMAGE_TAG="staging"
            ;;
        production)
            IMAGE_TAG="1.0.0"
            ;;
    esac
    
    # Build frontend
    print_status "Building frontend image..."
    docker build -t "multimodal-frontend:$IMAGE_TAG" -f frontend/Dockerfile frontend/
    
    # Note: Backend images should be built from the backend directory
    # This would typically be done in a CI/CD pipeline
    print_warning "Backend images should be built and pushed separately from the backend directory"
    
    print_success "Docker images built successfully"
fi

# Deploy using Kustomize
print_status "Deploying to Kubernetes..."

KUSTOMIZE_DIR="k8s/overlays/$ENVIRONMENT"

if [[ ! -d "$KUSTOMIZE_DIR" ]]; then
    print_error "Kustomization directory not found: $KUSTOMIZE_DIR"
    exit 1
fi

# Build the manifests
if [[ "$VERBOSE" == true ]]; then
    print_status "Generated manifests:"
    kubectl kustomize "$KUSTOMIZE_DIR"
fi

# Apply the manifests
if [[ "$DRY_RUN" == true ]]; then
    print_status "Dry run - showing what would be applied:"
    kubectl kustomize "$KUSTOMIZE_DIR" | kubectl apply --dry-run=client -f -
else
    print_status "Applying manifests to cluster..."
    kubectl kustomize "$KUSTOMIZE_DIR" | kubectl apply -f -
    
    print_status "Waiting for deployments to be ready..."
    kubectl wait --for=condition=available --timeout=300s deployment --all -n "$NAMESPACE"
    
    print_success "Deployment completed successfully!"
fi

# Show deployment status
print_status "Deployment status:"
kubectl get pods,svc,ingress -n "$NAMESPACE"

# Show access information
case $ENVIRONMENT in
    development)
        print_status "Access the application:"
        print_status "  Frontend: kubectl port-forward -n $NAMESPACE svc/frontend-service 3000:3000"
        print_status "  Then visit: http://localhost:3000"
        ;;
    production)
        print_status "Production deployment completed."
        print_status "Configure your DNS to point to the ingress controller's external IP."
        print_status "Get external IP with: kubectl get ingress -n $NAMESPACE"
        ;;
esac

# Show logs command
print_status "To view logs: kubectl logs -f -l app.kubernetes.io/name=multimodal-platform -n $NAMESPACE"

print_success "Deployment script completed!"

if [[ "$ENVIRONMENT" == "production" ]]; then
    print_warning "Remember to:"
    print_warning "  1. Update secrets with production values"
    print_warning "  2. Configure SSL certificates"
    print_warning "  3. Set up monitoring alerts"
    print_warning "  4. Configure backup procedures"
fi