# Ultra AI Platform - Deployment Scripts

## Quick Start Scripts

### Development Setup
```bash
#!/bin/bash
# setup-dev.sh - Initialize development environment

set -e

echo "Ultra AI Platform - Development Setup"
echo "======================================"

# Check prerequisites
command -v node >/dev/null 2>&1 || { echo "Node.js is required"; exit 1; }
command -v docker >/dev/null 2>&1 || { echo "Docker is required"; exit 1; }

# Install dependencies
echo "Installing dependencies..."
npm install

# Start services with Docker Compose
echo "Starting PostgreSQL, Redis, MongoDB..."
docker-compose up -d postgres redis mongodb ganache

# Wait for databases to be ready
echo "Waiting for databases..."
sleep 10

# Run migrations
echo "Running database migrations..."
npm run db:migrate

# Seed initial data
echo "Seeding initial data..."
npm run db:seed

# Start development servers
echo "Starting development servers..."
npm run dev

echo "Development environment ready!"
echo "API: http://localhost:4000"
echo "Web: http://localhost:3000"
echo "Grafana: http://localhost:3001"
```

### Production Deployment
```bash
#!/bin/bash
# deploy-prod.sh - Deploy to production

set -e

ENVIRONMENT=${1:-production}
VERSION=$(git describe --tags --always)

echo "Ultra AI Platform - Production Deployment"
echo "=========================================="
echo "Version: $VERSION"
echo "Environment: $ENVIRONMENT"

# Build images
echo "Building Docker images..."
docker build -t ultra-ai/api:$VERSION -f platform/backend/core-api/Dockerfile .
docker build -t ultra-ai/web:$VERSION -f packages/web/Dockerfile .
docker build -t ultra-ai/distributed:$VERSION -f platform/backend/distributed/Dockerfile .

# Push to registry
echo "Pushing to container registry..."
docker push ultra-ai/api:$VERSION
docker push ultra-ai/web:$VERSION
docker push ultra-ai/distributed:$VERSION

# Update Kubernetes manifests
echo "Updating Kubernetes manifests..."
sed -i "s|ultra-ai/api:latest|ultra-ai/api:$VERSION|g" k8s/manifests.yaml
sed -i "s|ultra-ai/web:latest|ultra-ai/web:$VERSION|g" k8s/manifests.yaml
sed -i "s|ultra-ai/distributed:latest|ultra-ai/distributed:$VERSION|g" k8s/manifests.yaml

# Deploy to Kubernetes
echo "Deploying to Kubernetes..."
kubectl apply -f k8s/manifests.yaml

# Wait for rollout
echo "Waiting for rollout..."
kubectl rollout status deployment/api -n ultra-ai --timeout=5m
kubectl rollout status deployment/web -n ultra-ai --timeout=5m
kubectl rollout status statefulset/p2p-node -n ultra-ai --timeout=5m

# Verify deployment
echo "Verifying deployment..."
kubectl get pods -n ultra-ai
kubectl get services -n ultra-ai

# Run smoke tests
echo "Running smoke tests..."
bash ./scripts/smoke-tests.sh

echo "Deployment completed successfully!"
echo "Version $VERSION is now live in $ENVIRONMENT"
```

### Scaling Operations
```bash
#!/bin/bash
# scale-services.sh - Scale services based on load

API_REPLICAS=${1:-3}
WEB_REPLICAS=${2:-2}
P2P_NODES=${3:-5}

echo "Scaling services..."
echo "API replicas: $API_REPLICAS"
echo "Web replicas: $WEB_REPLICAS"
echo "P2P nodes: $P2P_NODES"

kubectl scale deployment api \
  --replicas=$API_REPLICAS -n ultra-ai

kubectl scale deployment web \
  --replicas=$WEB_REPLICAS -n ultra-ai

kubectl scale statefulset p2p-node \
  --replicas=$P2P_NODES -n ultra-ai

echo "Scaling completed"
kubectl get pods -n ultra-ai
```

### Database Backup
```bash
#!/bin/bash
# backup-database.sh - Backup PostgreSQL database

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_POD=$(kubectl get pod -n ultra-ai -l app=postgres -o jsonpath='{.items[0].metadata.name}')

echo "Backing up database..."
echo "Timestamp: $TIMESTAMP"

kubectl exec -it $DB_POD -n ultra-ai -- \
  pg_dump -U ultra_ai_user ultra_ai_db \
  > "$BACKUP_DIR/ultra-ai-backup-$TIMESTAMP.sql"

echo "Backup completed: $BACKUP_DIR/ultra-ai-backup-$TIMESTAMP.sql"

# Compress backup
gzip "$BACKUP_DIR/ultra-ai-backup-$TIMESTAMP.sql"

# Upload to S3
aws s3 cp \
  "$BACKUP_DIR/ultra-ai-backup-$TIMESTAMP.sql.gz" \
  "s3://ultra-ai-backups/postgres/"

echo "Backup uploaded to S3"
```

### Health Check
```bash
#!/bin/bash
# health-check.sh - Check system health

echo "Ultra AI Platform - Health Check"
echo "================================"

# Check API health
echo "Checking API..."
API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/health)
echo "API Status: $API_STATUS"

# Check Web health
echo "Checking Web UI..."
WEB_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000)
echo "Web Status: $WEB_STATUS"

# Check Database
echo "Checking Database..."
DB_CHECK=$(kubectl exec -n ultra-ai -it postgres -- \
  psql -U ultra_ai_user -d ultra_ai_db -c "SELECT 1")
echo "Database: Connected"

# Check Redis
echo "Checking Redis..."
REDIS_CHECK=$(kubectl exec -n ultra-ai -it redis -- \
  redis-cli ping)
echo "Redis: $REDIS_CHECK"

# Check P2P Nodes
echo "Checking P2P Nodes..."
P2P_COUNT=$(kubectl get pods -n ultra-ai -l app=p2p-node --no-headers | wc -l)
echo "P2P Nodes Running: $P2P_COUNT"

# Check metrics
echo "Checking metrics..."
POD_CPU=$(kubectl top pods -n ultra-ai | grep api | awk '{print $2}')
echo "API CPU Usage: $POD_CPU"

echo ""
echo "Health check completed"
```

### Log Streaming
```bash
#!/bin/bash
# stream-logs.sh - Stream logs from all services

SERVICE=${1:-api}

echo "Streaming logs for $SERVICE..."

if [ "$SERVICE" = "all" ]; then
  kubectl logs -f -n ultra-ai -l service=ultra-ai --all-containers=true
else
  kubectl logs -f -n ultra-ai -l app=$SERVICE --tail=50
fi
```

### Performance Test
```bash
#!/bin/bash
# performance-test.sh - Run load tests

DURATION=${1:-60}
CONCURRENCY=${2:-10}

echo "Running performance tests"
echo "Duration: ${DURATION}s"
echo "Concurrency: $CONCURRENCY"

# Install Apache Bench if not present
command -v ab >/dev/null 2>&1 || {
  echo "Installing Apache Bench..."
  sudo apt-get install -y apache2-utils
}

# Test API
echo "Testing API endpoint..."
ab -t $DURATION -c $CONCURRENCY http://localhost:4000/health

# Test Web
echo "Testing Web endpoint..."
ab -t $DURATION -c $CONCURRENCY http://localhost:3000/

echo "Performance tests completed"
```

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing: `npm run test`
- [ ] Build successful: `npm run build`  
- [ ] Security audit: `npm run audit`
- [ ] Type checks: `npm run type-check`
- [ ] Code review approved
- [ ] Release notes prepared
- [ ] Runbook updated
- [ ] On-call engineer notified

### During Deployment
- [ ] Backup database
- [ ] Update DNS records (if needed)
- [ ] Monitor error rates
- [ ] Check response times
- [ ] Verify business metrics
- [ ] Test critical flows
- [ ] Monitor resource usage

### Post-Deployment
- [ ] Verify all services healthy
- [ ] Run smoke tests
- [ ] Check user reports
- [ ] Monitor for 24 hours
- [ ] Document any issues
- [ ] Prepare rollback plan
- [ ] Update status page

## Rollback Procedure

If issues occur after deployment:

```bash
# Get rollout history
kubectl rollout history deployment/api -n ultra-ai

# Rollback to previous version
kubectl rollout undo deployment/api -n ultra-ai

# Verify rollback
kubectl rollout status deployment/api -n ultra-ai --timeout=5m

# Check logs
kubectl logs -f -n ultra-ai -l app=api --tail=100
```

## Environment Variables

### Required for Production
```
DATABASE_URL=postgresql://user:password@host:5432/db
REDIS_URL=redis://host:6379/0
JWT_SECRET=long_random_secret_key
BLOCKCHAIN_RPC_URL=https://mainnet.infura.io/v3/
CONTRACT_ADDRESS=0x...
CORS_ORIGINS=https://ultra-ai.com,https://www.ultra-ai.com
```

### Optional Configuration
```
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
DATA_RETENTION_DAYS=90
ENCRYPTION_ENABLED=true
BLOCKCHAIN_ENABLED=true
```

## Support & Escalation

### Emergency Contacts
- On-Call Engineer: Check PagerDuty
- Engineering Lead: [slack channel]
- Infrastructure Team: #infrastructure-support

### Critical Issues
1. Page on-call engineer immediately
2. Start incident in Incident.io
3. Begin rollback assessment
4. Communicate to status page
5. Investigate root cause

## Documentation Links

- [Kubernetes Admin Guide](https://kubernetes.io/docs/tasks/administer-cluster/)
- [PostgreSQL Backup & Recovery](https://www.postgresql.org/docs/current/backup.html)
- [Blockchain Integration](./BLOCKCHAIN_GUIDE.md)
- [Security Best Practices](./SECURITY_BEST_PRACTICES.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
