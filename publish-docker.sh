#!/bin/bash
# ==========================================
# Docker Hub Publishing Script
# ==========================================
# Usage: ./publish-docker.sh <docker-username> <version>
# Example: ./publish-docker.sh myuser 1.0.0

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Arguments
DOCKER_USERNAME=${1:?"Usage: $0 <docker-username> <version>"}
VERSION=${2:?"Usage: $0 <docker-username> <version>"}

# Image names
FRONTEND_IMAGE="$DOCKER_USERNAME/fileshare-frontend"
BACKEND_IMAGE="$DOCKER_USERNAME/fileshare-backend"

echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   FileShare Docker Hub Publishing        ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Docker Username:${NC} $DOCKER_USERNAME"
echo -e "${YELLOW}Version:${NC} $VERSION"
echo ""

# Check if logged in to Docker Hub
echo -e "${BLUE}[1/6] Checking Docker login...${NC}"
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running${NC}"
    exit 1
fi

if ! docker pull hello-world > /dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Not logged in to Docker Hub${NC}"
    echo "Please run: docker login"
    docker login
fi
echo -e "${GREEN}✓ Docker is ready${NC}"
echo ""

# Build frontend image
echo -e "${BLUE}[2/6] Building frontend image...${NC}"
docker build -t $FRONTEND_IMAGE:$VERSION -f Dockerfile.frontend .
docker tag $FRONTEND_IMAGE:$VERSION $FRONTEND_IMAGE:latest
echo -e "${GREEN}✓ Frontend image built${NC}"
echo ""

# Build backend image
echo -e "${BLUE}[3/6] Building backend image...${NC}"
docker build -t $BACKEND_IMAGE:$VERSION -f Dockerfile.backend .
docker tag $BACKEND_IMAGE:$VERSION $BACKEND_IMAGE:latest
echo -e "${GREEN}✓ Backend image built${NC}"
echo ""

# Push frontend images
echo -e "${BLUE}[4/6] Pushing frontend to Docker Hub...${NC}"
docker push $FRONTEND_IMAGE:$VERSION
docker push $FRONTEND_IMAGE:latest
echo -e "${GREEN}✓ Frontend pushed${NC}"
echo ""

# Push backend images
echo -e "${BLUE}[5/6] Pushing backend to Docker Hub...${NC}"
docker push $BACKEND_IMAGE:$VERSION
docker push $BACKEND_IMAGE:latest
echo -e "${GREEN}✓ Backend pushed${NC}"
echo ""

# Show summary
echo -e "${BLUE}[6/6] Summary${NC}"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   ✅ Published Successfully!             ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Images:${NC}"
echo "  • $FRONTEND_IMAGE:$VERSION"
echo "  • $FRONTEND_IMAGE:latest"
echo "  • $BACKEND_IMAGE:$VERSION"
echo "  • $BACKEND_IMAGE:latest"
echo ""
echo -e "${YELLOW}Pull commands:${NC}"
echo "  docker pull $FRONTEND_IMAGE:$VERSION"
echo "  docker pull $BACKEND_IMAGE:$VERSION"
echo ""
echo -e "${YELLOW}View on Docker Hub:${NC}"
echo "  https://hub.docker.com/r/$DOCKER_USERNAME/fileshare-frontend"
echo "  https://hub.docker.com/r/$DOCKER_USERNAME/fileshare-backend"
echo ""
