#!/bin/bash
set -e

# Remove any .env files that might interfere
echo "Removing .env files..."
find . -maxdepth 1 -name ".env*" -type f -delete 2>/dev/null || true
rm -f .env .env.local .env.development .env.production .env.*.local 2>/dev/null || true

# Verify environment variable is set
echo "NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}"

# Verify no .env files exist
if [ -f .env ] || [ -f .env.local ] || [ -f .env.production ]; then
  echo "ERROR: .env files still exist!"
  exit 1
fi

echo "Building Next.js application..."
npm run build

