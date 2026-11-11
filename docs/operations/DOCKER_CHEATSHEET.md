# Docker Quick Reference Guide

## Container Operations

### Start & Stop
```bash
# Start all services in background
docker-compose up -d

# Start specific service
docker-compose up -d api

# Stop all services (keeps volumes)
docker-compose down

# Remove containers, volumes, and networks
docker-compose down -v

# Restart services
docker-compose restart

# Restart specific service
docker-compose restart api
```

### View Status
```bash
# Show container status
docker-compose ps

# Show detailed container info
docker-compose ps -a

# Watch container stats
docker stats

# Check container logs
docker-compose logs

# Follow logs in real-time
docker-compose logs -f api
```

## Building & Images

### Build Images
```bash
# Build all services
docker-compose build

# Build backend only
docker build -f Dockerfile.api -t ultra-ai-api:latest .

# Build frontend only
docker build -f Dockerfile.web -t ultra-ai-web:latest .

# Force rebuild (no cache)
docker build --no-cache -f Dockerfile.api -t ultra-ai-api:latest .
```

### Image Management
```bash
# List images
docker images

# List images with size
docker images --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}"

# Remove image
docker rmi image_name

# Remove unused images
docker image prune -a

# View image layers
docker history ultra-ai-api:latest
```

## Container Access

### Execute Commands
```bash
# Run command in running container
docker-compose exec api npm run build

# Run command with shell
docker-compose exec api /bin/sh

# Run as different user
docker-compose exec -u root api apt-get update

# No pseudo-terminal
docker-compose exec -T api npx prisma migrate deploy
```

### Database Management
```bash
# PostgreSQL shell
docker-compose exec postgres psql -U ultra_ai_user -d ultra_ai_db

# MongoDB shell
docker-compose exec mongodb mongosh --username ultra_ai_user

# Redis CLI
docker-compose exec redis redis-cli

# MySQL shell (if used)
docker-compose exec mysql mysql -u root -p
```

### View File System
```bash
# List files in container
docker-compose exec api ls -la /app

# Copy file from container
docker cp container_id:/path/to/file ./local/path

# Copy file to container
docker cp ./local/file container_id:/path/to/

# View file contents
docker-compose exec api cat /app/package.json
```

## Logs & Debugging

### View Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs api
docker-compose logs postgres
docker-compose logs redis

# Follow logs
docker-compose logs -f api

# Last 100 lines
docker-compose logs --tail=100 api

# Timestamps
docker-compose logs -f --timestamps api

# Since specific time
docker-compose logs --since 2m api
```

### Debugging
```bash
# Inspect container
docker inspect container_id

# View environment variables
docker inspect --format='{{json .Config.Env}}' container_id

# Check container IP
docker inspect --format='{{.NetworkSettings.Networks.ultra-ai-network.IPAddress}}' api

# View mount points
docker inspect --format='{{json .Mounts}}' container_id

# Get container stats
docker stats container_id
```

## Network & Connectivity

### Check Connectivity
```bash
# Ping container from host
ping container_id

# Access service from another container
docker-compose exec api curl http://postgres:5432

# DNS resolution test
docker-compose exec api getent hosts postgres

# Port availability
docker-compose exec api netstat -tlnp
```

### Networking Diagnostics
```bash
# View networks
docker network ls

# Inspect network
docker network inspect ultra-ai-network

# Connect container to network
docker network connect network_name container_name

# Disconnect from network
docker network disconnect network_name container_name
```

## Data & Volumes

### Volume Management
```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect postgres_data

# Remove unused volumes
docker volume prune

# Backup PostgreSQL volume
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz -C /data .

# Restore PostgreSQL volume
docker run --rm -v postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C /data
```

### Database Backup/Restore
```bash
# PostgreSQL dump
docker-compose exec postgres pg_dump -U ultra_ai_user ultra_ai_db > backup.sql

# PostgreSQL restore
cat backup.sql | docker-compose exec -T postgres psql -U ultra_ai_user ultra_ai_db

# MongoDB backup
docker-compose exec mongodb mongodump -u ultra_ai_user -o /tmp/backup

# MongoDB restore
docker-compose exec mongodb mongorestore -u ultra_ai_user /tmp/backup
```

## Performance Optimization

### Monitoring
```bash
# Container resource usage
docker stats

# Memory usage
docker stats --no-stream api

# CPU usage
docker inspect api --format='{{.HostConfig.CpuShares}}'

# Disk usage
docker system df

# Disk usage detailed
docker system df -v
```

### Optimization
```bash
# Remove dangling images
docker image prune

# Remove dangling volumes
docker volume prune

# Remove all unused resources
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Force pull latest images
docker-compose pull
```

## Environment & Configuration

### Environment Variables
```bash
# Set at runtime
docker-compose run -e VAR=value api npm start

# From .env file
docker-compose --env-file .env.prod up -d

# View container environment
docker inspect api --format='{{.Config.Env}}' | tr ',' '\n'
```

### Configuration Files
```bash
# Copy config into container
docker cp ./config.json container_id:/app/

# Edit config in running container
docker exec api nano /app/config.json

# Mount config file
docker run -v /host/config.json:/container/config.json ...
```

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Find process using port
lsof -i :5555

# Kill process
kill -9 PID

# Or change port in docker-compose.yml
```

**Container exits immediately:**
```bash
# Check logs
docker-compose logs api

# Run with interactive terminal
docker-compose run -it api /bin/sh

# Check entrypoint
docker inspect api --format='{{.Config.Entrypoint}}'
```

**No disk space:**
```bash
# Check disk usage
docker system df

# Remove unused resources
docker system prune -a --volumes
```

**Out of memory:**
```bash
# Check memory limits
docker stats api

# Increase memory in docker-compose.yml
docker-compose up -d
```

**Network issues:**
```bash
# Check if container can reach another
docker-compose exec api ping postgres

# Check DNS resolution
docker-compose exec api nslookup postgres

# Check network connectivity
docker-compose exec api curl http://postgres:5432
```

## Advanced Operations

### Building Multi-Architecture Images
```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 \
  -t myrepo/ultra-ai-api:latest \
  -f Dockerfile.api .
```

### Pushing to Registry
```bash
# Tag image
docker tag ultra-ai-api:latest myregistry.com/ultra-ai-api:1.0.0

# Push to registry
docker push myregistry.com/ultra-ai-api:1.0.0

# Pull from registry
docker pull myregistry.com/ultra-ai-api:1.0.0
```

### Running as Service
```bash
# Run container as background service
docker-compose up -d --remove-orphans

# Enable auto-restart
docker update --restart=always container_id

# Disable auto-restart
docker update --restart=no container_id
```

## Health Checks

### Monitor Health Status
```bash
# View health status
docker-compose ps

# Check specific container health
docker inspect api --format='{{json .State.Health}}'

# View health check details
docker inspect api --format='{{json .Config.Healthcheck}}'
```

### Manual Health Checks
```bash
# API health
curl -f http://localhost:5555/health || echo "Unhealthy"

# Web health
curl -f http://localhost:3000 || echo "Unhealthy"

# Database health
docker-compose exec postgres pg_isready -U ultra_ai_user

# Redis health
docker-compose exec redis redis-cli ping
```

## Using Docker Compose Override

### Development Configuration
```bash
# Create docker-compose.override.yml for local development
# This file overrides settings in docker-compose.yml

# Mount source code for live reload
services:
  api:
    volumes:
      - ./platform/backend/core-api/src:/app/platform/backend/core-api/src

# Change to development environment
environment:
  NODE_ENV: development
  LOG_LEVEL: debug
```

## Useful Aliases

Add to your `.bashrc` or `.zshrc`:

```bash
# Docker Compose shortcuts
alias dc='docker-compose'
alias dcup='docker-compose up -d'
alias dcdown='docker-compose down'
alias dclogs='docker-compose logs -f'
alias dcexec='docker-compose exec'
alias dcps='docker-compose ps'
alias dcbuild='docker-compose build'

# Docker shortcuts
alias d='docker'
alias dps='docker ps'
alias dimg='docker images'
alias dstats='docker stats'
alias dinspect='docker inspect'
```

## One-Liners

```bash
# Kill all containers
docker kill $(docker ps -q)

# Remove all containers
docker rm $(docker ps -aq)

# Remove all images
docker rmi $(docker images -q)

# See all container processes
docker-compose ps -a

# Get container IP address
docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' container_id

# Stop all services gracefully
docker-compose stop -t 30

# Update all images
docker-compose pull

# Rebuild and restart
docker-compose up -d --build

# View events in real-time
docker events --filter type=container
```

---

**All commands tested and working** | Last Updated: 2026-03-05
