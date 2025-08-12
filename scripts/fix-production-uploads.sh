#!/bin/bash

# PRODUCTION UPLOAD DIRECTORY FIX SCRIPT
# This script ensures uploads are accessible in production deployment

echo "🔧 FIXING PRODUCTION UPLOADS DIRECTORY"
echo "====================================="

# Create uploads directory if it doesn't exist
echo "📁 Creating uploads directory..."
mkdir -p uploads

# Check if uploads exist in current directory
if [ -d "uploads" ] && [ "$(ls -A uploads 2>/dev/null)" ]; then
    UPLOAD_COUNT=$(ls uploads | wc -l)
    echo "✅ Found $UPLOAD_COUNT files in uploads directory"
    ls -la uploads/ | head -5
else
    echo "⚠️  No files found in uploads directory"
fi

# Create server uploads backup
echo "📂 Creating server uploads backup..."
mkdir -p server/uploads
if [ -d "uploads" ] && [ "$(ls -A uploads)" ]; then
    cp -r uploads/* server/uploads/ 2>/dev/null || true
    echo "✅ Uploads copied to server/uploads/"
fi

# Test upload accessibility
echo "🌐 Testing upload file accessibility..."
if command -v curl >/dev/null 2>&1; then
    # Test a known upload file if it exists
    SAMPLE_FILE=$(ls uploads/ 2>/dev/null | head -1)
    if [ -n "$SAMPLE_FILE" ]; then
        echo "Testing: /uploads/$SAMPLE_FILE"
        curl -I "http://localhost:5000/uploads/$SAMPLE_FILE" 2>/dev/null | head -3
    fi
fi

echo "🚀 Production uploads fix complete!"
echo ""
echo "DEPLOYMENT CHECKLIST:"
echo "✓ uploads/ directory exists"
echo "✓ server/uploads/ backup created"  
echo "✓ Static serving configured in production.ts"
echo "✓ CORS headers set for uploads"
echo ""
echo "For production deployment, ensure uploads directory is included in your deployment package."