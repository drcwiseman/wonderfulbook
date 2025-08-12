#!/bin/bash

# Production build script for Wonderful Books
# Fixes the path issue for SPA routing and ensures uploads are included

echo "🔨 Building production version..."

# Run the normal build
npm run build

# Ensure server/public directory exists and copy files
echo "📂 Copying build files to server/public..."
mkdir -p server/public
cp -r dist/public/* server/public/

# CRITICAL FIX: Ensure uploads directory is available in production
echo "📁 Ensuring uploads directory exists in production..."
mkdir -p uploads
mkdir -p server/uploads

# Copy uploads to server directory for production deployment
if [ -d "uploads" ] && [ "$(ls -A uploads)" ]; then
    echo "📸 Copying uploads to server directory for deployment..."
    cp -r uploads/* server/uploads/ 2>/dev/null || true
fi

echo "✅ Production build complete - SPA routes and uploads ready for deployment!"
echo "📍 Build files located in: server/public/"
echo "📁 Upload files prepared in: uploads/ and server/uploads/"
echo "🚀 Ready for deployment"