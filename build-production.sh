#!/bin/bash

# Production build script for Wonderful Books
# Fixes the path issue for SPA routing

echo "🔨 Building production version..."

# Run the normal build
npm run build

# Ensure server/public directory exists and copy files
echo "📂 Copying build files to server/public..."
mkdir -p server/public
cp -r dist/public/* server/public/

echo "✅ Production build complete - SPA routes ready for deployment!"
echo "📍 Build files located in: server/public/"
echo "🚀 Ready for deployment"