#!/bin/bash
# Ensure uploads directory exists in production builds

echo "Creating uploads directory if it doesn't exist..."
mkdir -p uploads
chmod 755 uploads

# Copy uploads from build context if they exist
if [ -d "./client/uploads" ]; then
    echo "Copying uploads from client build..."
    cp -r ./client/uploads/* ./uploads/ 2>/dev/null || true
fi

if [ -d "./server/uploads" ]; then
    echo "Copying uploads from server build..."
    cp -r ./server/uploads/* ./uploads/ 2>/dev/null || true
fi

echo "Uploads directory setup complete"
ls -la uploads/ | head -5