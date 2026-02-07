#!/bin/bash

# betterMind Setup Script
# This script helps you set up the development environment

set -e  # Exit on error

echo "🚀 betterMind Setup Script"
echo "=========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed${NC}"
    echo "Please install pnpm: npm install -g pnpm"
    exit 1
fi
echo -e "${GREEN}✅ pnpm is installed${NC}"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed${NC}"
    echo "Please install Docker: https://docs.docker.com/get-docker/"
    exit 1
fi
echo -e "${GREEN}✅ Docker is installed${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed${NC}"
    echo "Please install Docker Compose: https://docs.docker.com/compose/install/"
    exit 1
fi
echo -e "${GREEN}✅ Docker Compose is installed${NC}"

echo ""
echo "📦 Installing dependencies..."
pnpm install

echo ""
echo "🔧 Setting up environment files..."

# API .env
if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example apps/api/.env
    echo -e "${YELLOW}⚠️  Created apps/api/.env - Please add your API keys${NC}"
else
    echo -e "${GREEN}✅ apps/api/.env already exists${NC}"
fi

# Web .env.local
if [ ! -f "apps/web/.env.local" ]; then
    cp apps/web/.env.example apps/web/.env.local
    echo -e "${YELLOW}⚠️  Created apps/web/.env.local - Please add your API keys${NC}"
else
    echo -e "${GREEN}✅ apps/web/.env.local already exists${NC}"
fi

# Mobile .env
if [ ! -f "apps/mobile/.env" ]; then
    cp apps/mobile/.env.example apps/mobile/.env
    echo -e "${YELLOW}⚠️  Created apps/mobile/.env - Please add your API keys${NC}"
else
    echo -e "${GREEN}✅ apps/mobile/.env already exists${NC}"
fi

echo ""
echo "🐳 Starting PostgreSQL with Docker..."
docker-compose up -d

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Check if PostgreSQL is running
if docker ps | grep -q bettermind-postgres; then
    echo -e "${GREEN}✅ PostgreSQL is running${NC}"
else
    echo -e "${RED}❌ PostgreSQL failed to start${NC}"
    echo "Check logs with: docker-compose logs postgres"
    exit 1
fi

echo ""
echo "🏗️  Building shared package..."
cd packages/shared
pnpm run build
cd ../..

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "📝 Next steps:"
echo "1. Add your API keys to the .env files:"
echo "   - apps/api/.env"
echo "   - apps/web/.env.local"
echo "   - apps/mobile/.env"
echo ""
echo "2. Start the development servers:"
echo "   pnpm run dev"
echo ""
echo "3. Visit the applications:"
echo "   - API: http://localhost:3001"
echo "   - Web: http://localhost:3000"
echo ""
echo "📚 For more information, see:"
echo "   - SETUP.md - Detailed setup instructions"
echo "   - PROJECT_SUMMARY.md - Project overview"
echo "   - INTERVIEW_PREP.md - Interview preparation guide"
echo ""
echo "🎉 Happy coding!"
