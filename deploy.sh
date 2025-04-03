#!/bin/bash

# Configuration
SERVER_USER="link"
SERVER_HOST="nuc.lan.linklabs.net"
SERVER_PATH="/data/docker/vattenkraft-scraper"
LOCAL_PATH="$(pwd)"

echo "🚀 Deploying vattenkraft-scraper..."

# Check if zstd is installed
if ! command -v zstd &> /dev/null; then
    echo "❌ zstd is not installed. Please install it first."
    echo "   On Ubuntu/Debian: sudo apt install zstd"
    echo "   On Alpine: apk add zstd"
    echo "   On macOS: brew install zstd"
    exit 1
fi

# Build the image locally
echo "📦 Building Docker image..."
docker build -t vattenkraft-scraper:latest .
# Check if the build was successful
if [ $? -ne 0 ]; then
    echo "❌ Docker build failed. Exiting..."
    exit 1
fi

# Save and compress the image using zstd
echo "💾 Saving and compressing Docker image with zstd..."
docker save vattenkraft-scraper:latest | zstd -T0 > vattenkraft-scraper-image.tar.zst
if [ $? -ne 0 ]; then
    echo "❌ Failed to save and compress the Docker image. Exiting..."
    rm -f vattenkraft-scraper-image.tar.zst
    exit 1
fi

# Ensure the directory exists on the server
ssh $SERVER_USER@$SERVER_HOST "mkdir -p $SERVER_PATH"

# Copy the compressed Docker image and docker-compose.yml
echo "📤 Transferring files to server..."
scp vattenkraft-scraper-image.tar.zst docker-compose.yml .env $SERVER_USER@$SERVER_HOST:$SERVER_PATH/

# Deploy on the server with cleanup
echo "🔄 Deploying on server..."
ssh $SERVER_USER@$SERVER_HOST "cd $SERVER_PATH && \
  if ! command -v zstd &> /dev/null; then echo '❌ zstd not found on server!'; exit 1; fi && \
  
  # Stream decompressed image directly to docker load
  zstd -d -c vattenkraft-scraper-image.tar.zst | docker load && \
  
  # Remove the compressed image to save space
  rm vattenkraft-scraper-image.tar.zst && \
  
  # Stop and start the container with the new image
  docker compose down && \
  docker compose up -d && \
  
  # Clean up dangling images (images without tags)
  echo '🧹 Cleaning up dangling images...' && \
  docker image prune -f && \
  
  # Show remaining images for this project
  echo '📊 Current images:' && \
  docker images | grep vattenkraft-scraper"

# Clean up local temporary files
echo "🧹 Cleaning up local files..."
rm vattenkraft-scraper-image.tar.zst

echo "✅ Deployment completed successfully!"
