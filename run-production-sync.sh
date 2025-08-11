#!/bin/bash
# Production Database Sync Script
# This script connects to production database and runs the sync

echo "=== PRODUCTION DATABASE SYNC ==="
echo "Current Status:"
echo "- Development featured books: $(curl -s 'http://localhost:5000/api/books?featured=true' | jq '. | length')"
echo "- Production featured books: $(curl -s 'https://wonderful-books-drcwiseman.replit.app/api/books?featured=true' | jq '. | length')"
echo ""
echo "SQL to run on PRODUCTION database:"
echo "=================================="
cat << 'EOF'
UPDATE books SET is_featured = true WHERE id IN (
  '25eade19-d8ab-4c25-b9e9-7f2fc63d6808',
  '39a430b3-9bfd-4d3d-a848-2b450f4cfe13', 
  'b9ad5b9d-2437-4ed8-be2b-6bb517ecd1aa',
  'deba8249-6ec8-4771-adc4-aa450387bd1a',
  '82f9671f-5e8c-41dc-a8b0-22f1852e8532',
  '2c38e9b8-a06c-40fa-a055-f55ebaef7edc'
);
EOF
echo ""
echo "Access your production database:"
echo "1. Go to https://replit.com/@drcwiseman/wonderful-books"
echo "2. Click 'Database' tab"
echo "3. Run the SQL above"
echo "4. Verify with: SELECT COUNT(*) FROM books WHERE is_featured = true;"