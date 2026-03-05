#!/bin/bash

# Ultra AI Platform - Setup Script
# This script sets up the development environment

set -e

echo "🚀 Setting up Ultra AI Platform..."

# Check Node.js version
echo "📦 Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js 20 or higher is required. Current version: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check Docker
echo "🐳 Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi
echo "✅ Docker version: $(docker --version)"

# Install dependencies
echo "📥 Installing dependencies..."
npm install

# Setup environment file
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOL
# Database
DATABASE_URL=postgresql://ultra_ai_user:ultra_ai_dev_password@localhost:5432/ultra_ai_db
MONGODB_URL=mongodb://ultra_ai_user:ultra_ai_dev_password@localhost:27017/ultra_ai_db
REDIS_URL=redis://:ultra_ai_dev_password@localhost:6379

# API Keys (Add your keys here)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d

# App
NODE_ENV=development
PORT=3000
API_PORT=4000

# Blockchain
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/YOUR-PROJECT-ID
PRIVATE_KEY=
CONTRACT_ADDRESS=

# IPFS
IPFS_API_URL=http://localhost:5001
IPFS_GATEWAY_URL=http://localhost:8080
EOL
    echo "✅ .env file created"
else
    echo "ℹ️  .env file already exists"
fi

# Start Docker containers
echo "🐳 Starting Docker containers..."
docker-compose up -d

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
sleep 10

# Run database migrations (when available)
# echo "🗄️  Running database migrations..."
# npm run db:migrate

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📝 Next steps:"
echo "   1. Add your API keys to .env file"
echo "   2. Run 'npm run dev' to start development"
echo "   3. Visit http://localhost:3000"
echo ""
echo "🔗 Useful commands:"
echo "   npm run dev          - Start development server"
echo "   npm run test         - Run tests"
echo "   npm run lint         - Check code quality"
echo "   docker-compose logs  - View database logs"
echo ""
