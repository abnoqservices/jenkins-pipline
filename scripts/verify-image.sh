#!/bin/bash
# Verify Docker image contains correct API URL

set -e

IMAGE_NAME="${1:-engagelatest:latest}"

echo "=== Verifying Docker Image: ${IMAGE_NAME} ==="

# Check if image exists
if ! docker image inspect "${IMAGE_NAME}" > /dev/null 2>&1; then
    echo "ERROR: Image ${IMAGE_NAME} not found"
    exit 1
fi

echo "1. Checking for .env files in image..."
docker run --rm "${IMAGE_NAME}" sh -c 'find /app -name ".env*" -type f 2>/dev/null || echo "No .env files found"'

echo ""
echo "2. Checking environment variables in image..."
docker run --rm "${IMAGE_NAME}" sh -c 'env | grep -i "api\|env" || echo "No API env vars found"'

echo ""
echo "3. Checking built bundle for API URL..."
echo "Searching for api.pexifly.com:"
docker run --rm "${IMAGE_NAME}" sh -c 'grep -r "api.pexifly.com" /app/.next/static/chunks/ 2>/dev/null | head -3 || echo "Not found"'

echo ""
echo "Searching for 127.0.0.1:8000:"
docker run --rm "${IMAGE_NAME}" sh -c 'grep -r "127.0.0.1:8000" /app/.next/static/chunks/ 2>/dev/null | head -3 || echo "Not found"'

echo ""
echo "Searching for localhost:8000:"
docker run --rm "${IMAGE_NAME}" sh -c 'grep -r "localhost:8000" /app/.next/static/chunks/ 2>/dev/null | head -3 || echo "Not found"'

echo ""
echo "=== Verification Complete ==="

