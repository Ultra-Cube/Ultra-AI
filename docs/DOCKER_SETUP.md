# Docker Setup Guide for Ultra AI Platform

## Overview

This guide explains how to build, run, and manage the Ultra AI Platform using Docker and Docker Compose.

## Prerequisites

- Docker 20.10+ ([Install Docker](https://docs.docker.com/get-docker/))
- Docker Compose 2.0+ ([Install Docker Compose](https://docs.docker.com/compose/install/))
- At least 4GB RAM for Docker
- 20GB free disk space

## Files Included

### Dockerfiles

- **`Dockerfile.api`** - Multi-stage Dockerfile for backend API
  - Node.js 20 Alpine base image
  - Production-optimized build
  - Health checks included
  - Non-root user for security

- **`Dockerfile.web`** - Multi-stage Dockerfile for frontend
  - Node.js 20 Alpine base image
  - Next.js production build
  - Optimized for static generation
  - Health checks included

### Configuration Files

- **`docker-compose.yml`** - Complete development environment
  - PostgreSQL 16 database
  - MongoDB 7 database
  - Redis 7 cache
  - IPFS node
  - Adminer for database management
  - Redis Commander for cache management

- **`environments/.env.example`** - Environment variables template
  - All configurable options with defaults
  - Copy to `.env` for local development

- **`.dockerignore`** - Files to exclude from Docker build context

### Helper Scripts

- **`docker-manage.sh`** - Management script for common Docker operations
  - Build, start, stop, restart services
  - View logs, check status, cleanup

- **`docker-entrypoint.sh`** - Initialization script for backend
  - Database migration automation
  - Service health checks
  - Database seeding

## Quick Start

### 1. Setup Environment Variables

```bash
# Copy environment template
cp environments/.env.example .env

# Edit .env with your configuration
nano .env
```

### 2. Build and Start Services

```bash
# Make script executable
chmod +x docker-manage.sh

# Build Docker images
./docker-manage.sh build

# Start all services
./docker-manage.sh start
```

### 3. Verify Services

```bash
# Show service status
./docker-manage.sh status

# Check logs for any errors
./docker-manage.sh logs
```

## Service Access

Once services are running:

### API Server
- **HTTP**: `http://localhost:5555`
- **Health Check**: `http://localhost:5555/health`
- **Swagger UI**: `http://localhost:5555/api-docs`
- **Metrics**: `http://localhost:5555/metrics`

### Web Application
- **URL**: `http://localhost:3000`

### Databases
- **PostgreSQL**: `localhost:5432`
  - User: `ultra_ai_user`
  - Database: `ultra_ai_db`
  - Connection: `postgresql://ultra_ai_user:password@localhost:5432/ultra_ai_db`

- **MongoDB**: `localhost:27017`
  - User: `ultra_ai_user`
  - Database: `ultra_ai_db`
  - Connection: `mongodb://ultra_ai_user:password@localhost:27017/ultra_ai_db`

### Cache & Tools
- **Redis**: `localhost:6379`
- **Adminer** (Database UI): `http://localhost:8081`
- **Redis Commander** (Cache UI): `http://localhost:8082`
- **IPFS Gateway**: `http://localhost:8080`
- **IPFS API**: `http://localhost:5001`

## Common Commands

### Start Services
```bash
# Using docker-manage script
./docker-manage.sh start

# Or using docker-compose directly
docker-compose up -d
```

### Stop Services
```bash
# Using docker-manage script
./docker-manage.sh stop

# Or using docker-compose directly
docker-compose down
```

### Restart Services
```bash
./docker-manage.sh restart
```

### View Logs
```bash
# All services
./docker-manage.sh logs

# Specific service
./docker-manage.sh logs api
./docker-manage.sh logs web
./docker-manage.sh logs postgres
./docker-manage.sh logs redis
```

### Build Images
```bash
./docker-manage.sh build
```

### Check Status
```bash
./docker-manage.sh status
```

### Cleanup Everything
```bash
./docker-manage.sh cleanup
```

## Database Management

### Running Migrations

Migrations run automatically when the API container starts. To manually run:

```bash
docker-compose exec api npx prisma migrate deploy
```

### Seeding Database

For development (in development environment only):

```bash
docker-compose exec api npx prisma db seed
```

### Accessing Database UI

**Adminer** (for PostgreSQL & MongoDB):
- URL: `http://localhost:8081`
- Select database system and enter credentials
- Default user: `ultra_ai_user`
- Default password: (from .env POSTGRES_PASSWORD)

### Backup Database

```bash
# PostgreSQL backup
docker-compose exec postgres pg_dump -U ultra_ai_user ultra_ai_db > backup.sql

# MongoDB backup
docker-compose exec mongodb mongodump --username ultra_ai_user -o /backups
```

### Restore Database

```bash
# PostgreSQL restore
docker-compose exec -T postgres psql -U ultra_ai_user ultra_ai_db < backup.sql

# MongoDB restore
docker-compose exec mongodb mongorestore --username ultra_ai_user /backups
```

## Performance Optimization

### Memory Configuration

Edit `docker-compose.yml` to set memory limits:

```yaml
services:
  api:
    environment:
      NODE_OPTIONS: "--max-old-space-size=1024"
  web:
    environment:
      NODE_OPTIONS: "--max-old-space-size=512"
```

### CPU Configuration

Set CPU limits in `docker-compose.yml`:

```yaml
services:
  api:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1024M
```

## Troubleshooting

### Services won't start

1. Check Docker daemon is running
2. Verify ports 3000, 5555, 5432, 6379 are not in use
3. Check logs: `./docker-manage.sh logs`

### Database connection failed

1. Verify PostgreSQL container is healthy: `docker-compose ps`
2. Check database credentials in `.env`
3. Wait for database to be ready (health check)

### Out of disk space

```bash
# Remove unused images and volumes
docker system prune -a --volumes
```

### Port already in use

Change ports in `.env` or `docker-compose.yml`:

```bash
API_PORT=5556
WEB_PORT=3001
DB_PORT=5433
```

### Memory issues

Increase Docker Desktop memory allocation:
- Docker Desktop → Settings → Resources → Memory → Increase to 8GB+

## Production Considerations

### Security

1. **Change default passwords** in `.env`
2. **Use strong JWT_SECRET** (generate with: `openssl rand -base64 32`)
3. **Enable HTTPS** with reverse proxy (nginx/traefik)
4. **Restrict database access** to backend only
5. **Use secrets management** for sensitive data

### Monitoring

1. **Monitor container health** with health checks
2. **Check logs regularly** for errors
3. **Monitor resource usage**: `docker stats`
4. **Set up alerting** for failed health checks

### Data Persistence

1. **Back up database regularly**
2. **Use named volumes** for persistent data
3. **Implement disaster recovery** plan
4. **Test restore procedures** regularly

## Building for Production

### Push to Registry

```bash
# Tag images
docker tag ultra-ai-api:latest myregistry/ultra-ai-api:1.0.0
docker tag ultra-ai-web:latest myregistry/ultra-ai-web:1.0.0

# Push to registry
docker push myregistry/ultra-ai-api:1.0.0
docker push myregistry/ultra-ai-web:1.0.0
```

### Create Production Compose File

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api:
    image: myregistry/ultra-ai-api:1.0.0
    environment:
      NODE_ENV: production
      # ... production environment variables
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
          cpus: '1'
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3

  web:
    image: myregistry/ultra-ai-web:1.0.0
    environment:
      NODE_ENV: production
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
```

Run production stack:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Health Checks

All containers have health checks configured:

```bash
# View health status
docker-compose ps

# Check specific service health
docker inspect ultra-ai-api --format='{{json .State.Health}}'
```

## Networking

Services communicate using the `ultra-ai-network` bridge network:

- `api` ↔ `postgres` (database)
- `api` ↔ `redis` (cache)
- `api` ↔ `ipfs` (file storage)
- `web` ↔ `api` (frontend-backend)

## Next Steps

1. **For Kubernetes**: See [KUBERNETES_SETUP.md](KUBERNETES_SETUP.md)
2. **For CI/CD**: See [CI_CD_SETUP.md](CI_CD_SETUP.md)
3. **For Monitoring**: See [MONITORING_SETUP.md](MONITORING_SETUP.md)
4. **For Security**: See [SECURITY_HARDENING.md](SECURITY_HARDENING.md)

## Support

For issues or questions:
1. Check logs: `./docker-manage.sh logs`
2. Review Docker documentation: https://docs.docker.com
3. Check service health: `./docker-manage.sh status`
4. Restart services: `./docker-manage.sh restart`

---

**Last Updated**: 2026-03-05  
**Status**: Production Ready for Docker Deployment
