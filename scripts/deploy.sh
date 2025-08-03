#!/bin/bash

# Code Review Agent - Production Deployment Script
# Usage: ./scripts/deploy.sh [production|staging|development]

set -e  # Exit on any error

ENVIRONMENT=${1:-production}
PROJECT_NAME="code-review-agent"
LOG_FILE="/tmp/${PROJECT_NAME}-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
    fi
    
    # Check environment file
    if [ ! -f ".env" ]; then
        warning ".env file not found, copying from .env.example"
        cp .env.example .env
        warning "Please edit .env file with your configuration"
    fi
    
    # Check if API key is set
    if ! grep -q "GEMINI_API_KEY=.*[^=]" .env; then
        error "GEMINI_API_KEY is not set in .env file"
    fi
    
    success "Prerequisites check passed"
}

# Build images
build_images() {
    log "Building Docker images..."
    
    case $ENVIRONMENT in
        "development")
            docker-compose -f docker-compose.dev.yml build --no-cache
            ;;
        "staging")
            if [ -f "docker-compose.staging.yml" ]; then
                docker-compose -f docker-compose.staging.yml build --no-cache
            else
                warning "Staging config not found, using production config"
                docker-compose build --no-cache
            fi
            ;;
        "production")
            docker-compose build --no-cache
            ;;
        *)
            error "Unknown environment: $ENVIRONMENT"
            ;;
    esac
    
    success "Images built successfully"
}

# Deploy services
deploy_services() {
    log "Deploying services for $ENVIRONMENT environment..."
    
    case $ENVIRONMENT in
        "development")
            docker-compose -f docker-compose.dev.yml up -d
            ;;
        "staging")
            if [ -f "docker-compose.staging.yml" ]; then
                docker-compose -f docker-compose.staging.yml up -d
            else
                docker-compose up -d
            fi
            ;;
        "production")
            docker-compose up -d
            ;;
    esac
    
    success "Services deployed successfully"
}

# Health checks
health_checks() {
    log "Performing health checks..."
    
    # Wait for services to start
    sleep 30
    
    # Check backend health
    local backend_health=0
    for i in {1..10}; do
        if curl -f -s http://localhost:8000/health > /dev/null; then
            backend_health=1
            break
        fi
        log "Waiting for backend to be ready... (attempt $i/10)"
        sleep 10
    done
    
    if [ $backend_health -eq 0 ]; then
        error "Backend health check failed"
    fi
    
    # Check frontend health (for production/staging)
    if [ "$ENVIRONMENT" != "development" ]; then
        local frontend_health=0
        for i in {1..5}; do
            if curl -f -s http://localhost:3000 > /dev/null; then
                frontend_health=1
                break
            fi
            log "Waiting for frontend to be ready... (attempt $i/5)"
            sleep 5
        done
        
        if [ $frontend_health -eq 0 ]; then
            error "Frontend health check failed"
        fi
    fi
    
    success "Health checks passed"
}

# Show deployment info
show_deployment_info() {
    log "Deployment completed successfully!"
    echo ""
    echo "🚀 Code Review Agent is now running:"
    echo ""
    
    case $ENVIRONMENT in
        "development")
            echo "  Frontend (dev): http://localhost:3000"
            echo "  Backend (dev):  http://localhost:8000"
            echo "  API Docs:       http://localhost:8000/docs"
            ;;
        *)
            echo "  Application:    http://localhost:3000"
            echo "  API:           http://localhost:8000"
            echo "  API Docs:      http://localhost:8000/docs"
            ;;
    esac
    
    echo ""
    echo "📊 Useful commands:"
    echo "  View logs:      docker-compose logs -f"
    echo "  Check status:   docker-compose ps"
    echo "  Stop services:  docker-compose down"
    echo "  Restart:        docker-compose restart"
    echo ""
    echo "📋 Monitoring:"
    echo "  Resource usage: docker stats"
    echo "  Service health: curl http://localhost:8000/health"
    echo ""
}

# Cleanup function
cleanup() {
    if [ $? -ne 0 ]; then
        error "Deployment failed. Check logs at $LOG_FILE"
        echo ""
        echo "🔧 Troubleshooting steps:"
        echo "  1. Check Docker daemon is running"
        echo "  2. Verify .env file has correct API key"
        echo "  3. Ensure ports 3000 and 8000 are available"
        echo "  4. Check logs: docker-compose logs"
        echo "  5. View troubleshooting guide: cat TROUBLESHOOTING.md"
    fi
}

# Main deployment flow
main() {
    trap cleanup EXIT
    
    log "Starting deployment for $ENVIRONMENT environment"
    log "Logs will be saved to: $LOG_FILE"
    
    check_prerequisites
    build_images
    deploy_services
    health_checks
    show_deployment_info
    
    success "Deployment completed successfully!"
}

# Help function
show_help() {
    echo "Code Review Agent - Deployment Script"
    echo ""
    echo "Usage: $0 [ENVIRONMENT]"
    echo ""
    echo "Environments:"
    echo "  production   - Deploy for production use (default)"
    echo "  staging      - Deploy for staging/testing"
    echo "  development  - Deploy with hot reloading for development"
    echo ""
    echo "Examples:"
    echo "  $0                    # Deploy production"
    echo "  $0 production         # Deploy production"
    echo "  $0 development        # Deploy for development"
    echo "  $0 staging            # Deploy for staging"
    echo ""
}

# Handle help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main