#!/bin/bash

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  Ultra AI Platform - Docker Management Script${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Build images
build_images() {
    print_header
    print_info "Building Docker images..."
    
    docker-compose build --no-cache api web
    
    if [ $? -eq 0 ]; then
        print_success "Images built successfully"
    else
        print_error "Failed to build images"
        exit 1
    fi
}

# Start services
start_services() {
    print_header
    print_info "Starting services..."
    
    docker-compose up -d
    
    if [ $? -eq 0 ]; then
        print_success "Services started successfully"
        print_info "Waiting for services to be healthy..."
        
        # Wait for backend
        echo -n "Waiting for API..."
        while ! curl -f http://localhost:5555/health > /dev/null 2>&1; do
            echo -n "."
            sleep 2
        done
        print_success "API is healthy"
        
        # Wait for frontend
        echo -n "Waiting for Web..."
        while ! curl -f http://localhost:3000 > /dev/null 2>&1; do
            echo -n "."
            sleep 2
        done
        print_success "Web is healthy"
        
        print_success "All services are healthy!"
        print_services_info
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Stop services
stop_services() {
    print_header
    print_info "Stopping services..."
    
    docker-compose down
    
    if [ $? -eq 0 ]; then
        print_success "Services stopped successfully"
    else
        print_error "Failed to stop services"
        exit 1
    fi
}

# Show service info
print_services_info() {
    echo ""
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}  Services Running${NC}"
    echo -e "${GREEN}════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${BLUE}API Server:${NC}"
    echo "  URL: http://localhost:5555"
    echo "  Health: http://localhost:5555/health"
    echo "  Swagger: http://localhost:5555/api-docs"
    echo ""
    echo -e "${BLUE}Web Application:${NC}"
    echo "  URL: http://localhost:3000"
    echo ""
    echo -e "${BLUE}Database:${NC}"
    echo "  PostgreSQL: localhost:5432"
    echo "  MongoDB: localhost:27017"
    echo "  Adminer: http://localhost:8081"
    echo ""
    echo -e "${BLUE}Cache:${NC}"
    echo "  Redis: localhost:6379"
    echo "  Commander: http://localhost:8082"
    echo ""
    echo -e "${BLUE}File Storage:${NC}"
    echo "  IPFS Gateway: http://localhost:8080"
    echo "  IPFS API: http://localhost:5001"
    echo ""
}

# View logs
view_logs() {
    print_header
    
    if [ -z "$1" ]; then
        print_info "Showing logs from all services..."
        docker-compose logs -f
    else
        print_info "Showing logs from $1..."
        docker-compose logs -f $1
    fi
}

# Cleanup
cleanup() {
    print_header
    print_info "Cleaning up containers and volumes..."
    
    docker-compose down -v
    
    if [ $? -eq 0 ]; then
        print_success "Cleanup completed successfully"
    else
        print_error "Failed to cleanup"
        exit 1
    fi
}

# Main
case "${1:-help}" in
    build)
        build_images
        ;;
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        stop_services
        start_services
        ;;
    logs)
        view_logs $2
        ;;
    status)
        print_header
        docker-compose ps
        ;;
    cleanup)
        cleanup
        ;;
    *)
        echo "Usage: $0 {build|start|stop|restart|logs|status|cleanup|help}"
        echo ""
        echo "Commands:"
        echo "  build     - Build Docker images"
        echo "  start     - Start all services"
        echo "  stop      - Stop all services"
        echo "  restart   - Restart all services"
        echo "  logs      - View service logs (usage: logs [service_name])"
        echo "  status    - Show service status"
        echo "  cleanup   - Remove all containers and volumes"
        echo "  help      - Show this help message"
        echo ""
        exit 1
        ;;
esac
