#!/bin/bash
set -e

DOCKER_USER="huyls"
IMAGE_NAME="fe"
TAG="latest"
DOCKER_TOKEN="your_docker_token_here"  # không hardcode tốt lắm

# Login bằng token
echo "$DOCKER_TOKEN" | docker login --username "$DOCKER_USER" --password-stdin

echo "=== Building FE image locally ==="
docker build -t $DOCKER_USER/$IMAGE_NAME:$TAG -f docker/fe/Dockerfile .

echo "=== Pushing FE image to Docker Hub ==="
docker push $DOCKER_USER/$IMAGE_NAME:$TAG

echo "=== Done! Image available at $DOCKER_USER/$IMAGE_NAME:$TAG ==="
