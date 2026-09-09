#!/bin/bash
# ==========================================
# Docker Hub Publishing Script
# ==========================================
# Usage: ./publish-docker.sh <docker-username> <version>
# Example: ./publish-docker.sh myuser 1.0.0

set -e

# Arguments
DOCKER_USERNAME=${1:?"Usage: $0 <docker-username> <version>"}
VERSION=${2:?"Usage: $0 <docker-username> <version>"}

# Image names
FRONTEND_IMAGE="$DOCKER_USERNAME/fileshare-frontend"
BACKEND_IMAGE="$DOCKER_USERNAME/fileshare-backend"

echo "╔══════════════════════════════════════════╗"
echo "║   FileShare Docker Hub Publishing        ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Docker Username: $DOCKER_USERNAME"
echo "Version: $VERSION"
echo ""

# Check if logged in to Docker Hub
echo "[1/6] Checking Docker login..."
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running"
    exit 1
fi

if ! docker pull hello-world > /dev/null 2>&1; then
    echo "Warning: Not logged in to Docker Hub"
    echo "Please run: docker login"
    docker login
fi
echo "✓ Docker is ready"
echo ""

# Build frontend image
echo "[2/6] Building frontend image..."
docker build -t $FRONTEND_IMAGE:$VERSION -f Dockerfile.frontend .
docker tag $FRONTEND_IMAGE:$VERSION $FRONTEND_IMAGE:latest
echo "✓ Frontend image built"
echo ""

# Build backend image
echo "[3/6] Building backend image..."
docker build -t $BACKEND_IMAGE:$VERSION -f Dockerfile.backend .
docker tag $BACKEND_IMAGE:$VERSION $BACKEND_IMAGE:latest
echo "✓ Backend image built"
echo ""

# Push frontend images
echo "[4/6] Pushing frontend to Docker Hub..."
docker push $FRONTEND_IMAGE:$VERSION
docker push $FRONTEND_IMAGE:latest
echo "✓ Frontend pushed"
echo ""

# Push backend images
echo "[5/6] Pushing backend to Docker Hub..."
docker push $BACKEND_IMAGE:$VERSION
docker push $BACKEND_IMAGE:latest
echo "✓ Backend pushed"
echo ""

# Show summary
echo "[6/6] Summary"
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║   ✅ Published Successfully!             ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "Images:"
echo "  • $FRONTEND_IMAGE:$VERSION"
echo "  • $FRONTEND_IMAGE:latest"
echo "  • $BACKEND_IMAGE:$VERSION"
echo "  • $BACKEND_IMAGE:latest"
echo ""
echo "Pull commands:"
echo "  docker pull $FRONTEND_IMAGE:$VERSION"
echo "  docker pull $BACKEND_IMAGE:$VERSION"
echo ""
echo "View on Docker Hub:"
echo "  https://hub.docker.com/r/$DOCKER_USERNAME/fileshare-frontend"
echo "  https://hub.docker.com/r/$DOCKER_USERNAME/fileshare-backend"
echo ""
