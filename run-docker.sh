#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🐳 Wolftime Spinner Docker Setup${NC}"
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed. Please install Docker first.${NC}"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ Docker Compose is not installed. Please install Docker Compose first.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker and Docker Compose are installed${NC}"

# Check if CSV file exists
if [ ! -f "standup_scoreboard.csv" ]; then
    echo -e "${YELLOW}⚠️  standup_scoreboard.csv not found. Creating a default one...${NC}"
    echo "Id,Name,isDev,questionsAsked,questionsMissed,questionsAnsweredCorrectly,points,isRemoved" > standup_scoreboard.csv
    echo "1,Example Person,TRUE,0,0,0,0,FALSE" >> standup_scoreboard.csv
fi

echo -e "${GREEN}✅ CSV file ready${NC}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating with default values...${NC}"
    echo "PASSPHRASE=wolftime2024" > .env
    echo "PORT=3000" >> .env
    echo "NODE_ENV=development" >> .env
fi

echo -e "${GREEN}✅ Environment configuration ready${NC}"

# Build and run the container
echo -e "${YELLOW}🔨 Building Docker image...${NC}"
docker-compose build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Image built successfully${NC}"
    
    echo -e "${YELLOW}🚀 Starting the application...${NC}"
    echo -e "${GREEN}🌐 The app will be available at: http://localhost:3000${NC}"
    echo -e "${YELLOW}⏹️  Press Ctrl+C to stop the container${NC}"
    echo ""
    
    # Run the container
    docker-compose up
else
    echo -e "${RED}❌ Failed to build Docker image${NC}"
    exit 1
fi 