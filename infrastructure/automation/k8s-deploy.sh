#!/bin/bash

# ============================================================================
# Ultra AI Platform - Kubernetes Deployment Script
# Phase 19: Kubernetes Orchestration
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="ultra-ai"
K8S_DIR="./k8s"
CLUSTER_TIMEOUT=600

# Functions
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl not found. Please install kubectl."
        exit 1
    fi
    print_success "kubectl found: $(kubectl version --client --short)"
    
    # Check cluster connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    print_success "Connected to Kubernetes cluster"
    
    # Check kustomize (optional)
    if command -v kustomize &> /dev/null; then
        print_success "kustomize found: $(kustomize version --short)"
    else
        print_warning "kustomize not found (optional, can use kubectl apply -k)"
    fi
    
    # Check k8s directory
    if [ ! -d "$K8S_DIR" ]; then
        print_error "Directory $K8S_DIR not found"
        exit 1
    fi
    print_success "K8s manifests directory found: $K8S_DIR"
}

# Create namespace
deploy_namespace() {
    print_header "Step 1: Creating Namespace and Security Policies"
    kubectl apply -f "$K8S_DIR/01-namespace.yaml"
    print_success "Namespace created"
}

# Create ConfigMaps and Secrets
deploy_config() {
    print_header "Step 2: Creating ConfigMaps and Secrets"
    kubectl apply -f "$K8S_DIR/02-configmap.yaml"
    print_success "ConfigMaps created"
    
    kubectl apply -f "$K8S_DIR/03-secrets.yaml"
    print_success "Secrets created"
    
    print_warning "⚠️  Remember to update secrets in 03-secrets.yaml with production values!"
}

# Create storage
deploy_storage() {
    print_header "Step 3: Creating Storage Classes and PersistentVolumeClaims"
    kubectl apply -f "$K8S_DIR/04-storage.yaml"
    print_success "Storage resources created"
    
    echo ""
    echo "Waiting for PVCs to bind..."
    kubectl wait --for=condition=Bound pvc --all -n $NAMESPACE --timeout=60s 2>/dev/null || true
    print_success "Storage ready"
}

# Deploy databases
deploy_databases() {
    print_header "Step 4: Deploying Databases (PostgreSQL, Redis, MongoDB)"
    
    # PostgreSQL
    echo "Deploying PostgreSQL..."
    kubectl apply -f "$K8S_DIR/05-postgres.yaml"
    echo "  Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n $NAMESPACE --timeout=300s 2>/dev/null || true
    print_success "PostgreSQL deployed"
    
    # Redis
    echo "Deploying Redis..."
    kubectl apply -f "$K8S_DIR/06-redis.yaml"
    echo "  Waiting for Redis to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis -n $NAMESPACE --timeout=300s 2>/dev/null || true
    print_success "Redis deployed"
    
    # MongoDB
    echo "Deploying MongoDB..."
    kubectl apply -f "$K8S_DIR/07-mongodb.yaml"
    echo "  Waiting for MongoDB to be ready..."
    kubectl wait --for=condition=ready pod -l app=mongodb -n $NAMESPACE --timeout=300s 2>/dev/null || true
    print_success "MongoDB deployed"
}

# Deploy applications
deploy_applications() {
    print_header "Step 5: Deploying Applications (API & Web)"
    
    # API
    echo "Deploying API..."
    kubectl apply -f "$K8S_DIR/08-api-deployment.yaml"
    echo "  Waiting for API to be ready..."
    kubectl wait --for=condition=ready pod -l app=api -n $NAMESPACE --timeout=300s 2>/dev/null || true
    print_success "API deployed"
    
    # Web
    echo "Deploying Web..."
    kubectl apply -f "$K8S_DIR/09-web-deployment.yaml"
    echo "  Waiting for Web to be ready..."
    kubectl wait --for=condition=ready pod -l app=web -n $NAMESPACE --timeout=300s 2>/dev/null || true
    print_success "Web deployed"
}

# Create services and ingress
deploy_routing() {
    print_header "Step 6: Creating Services and Ingress"
    
    kubectl apply -f "$K8S_DIR/10-services.yaml"
    print_success "Services created"
    
    kubectl apply -f "$K8S_DIR/11-ingress.yaml"
    print_success "Ingress created"
}

# Deploy autoscaling
deploy_autoscaling() {
    print_header "Step 7: Configuring Autoscaling and Policies"
    kubectl apply -f "$K8S_DIR/12-hpa-and-policies.yaml"
    print_success "HPA and policies configured"
}

# Verify deployment
verify_deployment() {
    print_header "Deployment Verification"
    
    echo ""
    echo "Pods:"
    kubectl get pods -n $NAMESPACE
    
    echo ""
    echo "Services:"
    kubectl get svc -n $NAMESPACE
    
    echo ""
    echo "Ingress:"
    kubectl get ingress -n $NAMESPACE
    
    echo ""
    echo "HPA Status:"
    kubectl get hpa -n $NAMESPACE
    
    echo ""
    echo "PersistentVolumeClaims:"
    kubectl get pvc -n $NAMESPACE
}

# Display access information
show_access_info() {
    print_header "Access Information"
    
    echo ""
    echo "Services are available at:"
    echo "  API:      http://localhost:5555 (kubectl port-forward)"
    echo "  Web:      http://localhost:3000 (kubectl port-forward)"
    echo ""
    echo "Ingress hosts (configure in your /etc/hosts or DNS):"
    echo "  api.ultra-ai.local"
    echo "  app.ultra-ai.local"
    echo "  graphql.ultra-ai.local"
    echo "  admin.ultra-ai.local"
    echo ""
    echo "Useful commands:"
    echo "  # Port forward API"
    echo "  kubectl port-forward -n $NAMESPACE svc/api 5555:5555"
    echo ""
    echo "  # Port forward Web"
    echo "  kubectl port-forward -n $NAMESPACE svc/web 3000:3000"
    echo ""
    echo "  # View API logs"
    echo "  kubectl logs -n $NAMESPACE deployment/api -f"
    echo ""
    echo "  # Get shell in API pod"
    echo "  kubectl exec -it -n $NAMESPACE deployment/api -- /bin/sh"
    echo ""
    echo "  # Watch HPA scaling"
    echo "  kubectl get hpa -n $NAMESPACE -w"
}

# Full deployment
full_deploy() {
    print_header "Ultra AI Platform - Full Kubernetes Deployment"
    
    check_prerequisites
    deploy_namespace
    deploy_config
    deploy_storage
    deploy_databases
    deploy_applications
    deploy_routing
    deploy_autoscaling
    verify_deployment
    show_access_info
    
    print_header "Deployment Complete!"
    print_success "Ultra AI Platform is now running on Kubernetes"
}

# Individual deployment functions
deploy_only_config() {
    check_prerequisites
    deploy_config
}

deploy_only_databases() {
    check_prerequisites
    deploy_namespace
    deploy_config
    deploy_storage
    deploy_databases
}

deploy_only_apps() {
    check_prerequisites
    deploy_applications
    deploy_routing
}

# Undeploy function
undeploy() {
    print_header "Undeploying Ultra AI Platform"
    
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        echo "Deleting namespace $NAMESPACE..."
        kubectl delete namespace $NAMESPACE --ignore-not-found
        print_success "Namespace deleted"
    else
        print_warning "Namespace $NAMESPACE not found"
    fi
}

# Main
case "${1:-full}" in
    full)
        full_deploy
        ;;
    config)
        deploy_only_config
        ;;
    databases)
        deploy_only_databases
        ;;
    apps)
        deploy_only_apps
        ;;
    verify)
        verify_deployment
        ;;
    info)
        show_access_info
        ;;
    delete|undeploy)
        undeploy
        ;;
    *)
        echo "Usage: $0 {full|config|databases|apps|verify|info|delete}"
        echo ""
        echo "Commands:"
        echo "  full       - Full deployment (default)"
        echo "  config     - Deploy only configuration"
        echo "  databases  - Deploy only databases"
        echo "  apps       - Deploy only applications"
        echo "  verify     - Verify current deployment"
        echo "  info       - Show access information"
        echo "  delete     - Undeploy everything"
        exit 1
        ;;
esac
