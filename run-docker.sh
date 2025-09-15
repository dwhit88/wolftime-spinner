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

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating with default values...${NC}"
    echo "# Wolftime Spinner Configuration" > .env
    echo "PORT=3000" >> .env
    echo "NODE_ENV=development" >> .env
    echo "" >> .env
    echo "# Google Sheets Configuration" >> .env
    echo "GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here" >> .env
    echo "GOOGLE_SHEET_RANGE=Sheet1!A:H" >> .env
    echo "GOOGLE_SERVICE_ACCOUNT_KEY=your_service_account_key_here" >> .env
    echo "" >> .env
    echo -e "${YELLOW}⚠️  Please update the .env file with your Google Sheets configuration before running the app.${NC}"
    echo -e "${YELLOW}   See env.example for detailed instructions.${NC}"
fi

# Check if Google Sheets configuration is set
if [ -f ".env" ]; then
    if ! grep -q "GOOGLE_SPREADSHEET_ID=" .env || grep -q "GOOGLE_SPREADSHEET_ID=your_spreadsheet_id_here" .env; then
        echo -e "${YELLOW}⚠️  Google Sheets configuration not found or incomplete in .env file${NC}"
        echo -e "${YELLOW}   Please configure GOOGLE_SPREADSHEET_ID and GOOGLE_SERVICE_ACCOUNT_KEY${NC}"
        echo -e "${YELLOW}   See env.example for detailed instructions.${NC}"
    else
        echo -e "${GREEN}✅ Google Sheets configuration found${NC}"
    fi
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