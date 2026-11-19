#!/bin/sh
# ╔══════════════════════════════════════════════════════════════════════════╗
# ║                                                                          ║
# ║ ██╗   ██╗██╗      █████╗ ██████╗                                         ║
# ║ ██║   ██║██║     ██╔══██╗██╔══██╗                                        ║
# ║ ██║   ██║██║     ███████║██████╔╝                                        ║
# ║ ╚██╗ ██╔╝██║     ██╔══██║██╔══██╗                                        ║
# ║  ╚████╔╝ ███████╗██║  ██║██████╔╝                                        ║
# ║   ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═════╝                                         ║
# ║                                                                          ║
# ║ Project   : Ultra AI — Proprietary AI Platform                           ║
# ║ Developer : Ultra Cube Tech — ucubetech.com                              ║
# ║ Team      : Ultra Zone Team — ultra-zone.ucubetech.com                   ║
# ║ GitHub Org: github.com/Ultra-Cube                                        ║
# ║ Repository: github.com/Ultra-Cube/Ultra-AI                               ║
# ║ Copyright : (c) Ultra Cube Tech — All rights reserved                    ║
# ║ [UCUBETECH-COPYRIGHT]                                                    ║
# ║                                                                          ║
# ╚══════════════════════════════════════════════════════════════════════════╝

set -e

echo "🚀 Starting Ultra AI Backend initialization..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
while ! nc -z postgres 5432; do
  sleep 1
done
echo "✅ PostgreSQL is ready"

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready..."
while ! nc -z redis 6379; do
  sleep 1
done
echo "✅ Redis is ready"

# Run Prisma migrations
echo "📦 Running database migrations..."
cd platform/backend/core-api
npx prisma migrate deploy --skip-generate
npx prisma generate
echo "✅ Migrations completed"

# Seed database if in development
if [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Seeding database..."
  npx prisma db seed 2>/dev/null || echo "⚠️  No seed script found"
fi

echo "✅ Initialization completed successfully!"
echo "🎯 Starting application..."

# Execute the main command
exec "$@"
