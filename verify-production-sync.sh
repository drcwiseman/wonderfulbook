#!/bin/bash
# Production User Sync Verification Script

echo "=== PRODUCTION USER SYNC VERIFICATION ==="
echo ""

echo "📊 CURRENT STATUS CHECK:"
echo ""

echo "Development users (for comparison):"
curl -s 'http://localhost:5000/api/books' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Development server: Online"
else
    echo "❌ Development server: Offline"
fi

echo ""
echo "Production server test:"
curl -s 'https://wonderful-books-drcwiseman.replit.app/api/books' > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ Production server: Online"
else
    echo "❌ Production server: Offline"
fi

echo ""
echo "🔍 USER SYNC TEST:"
echo ""

echo "Testing if synced user can login to production..."
LOGIN_RESULT=$(curl -s -X POST "https://wonderful-books-drcwiseman.replit.app/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "prophetclimate@yahoo.com", "password": "password"}')

echo "Login response: $LOGIN_RESULT"

if echo "$LOGIN_RESULT" | grep -q "success\|token\|user"; then
    echo "✅ USER SYNC SUCCESSFUL - Login works!"
    echo "Both environments now have synchronized users"
elif echo "$LOGIN_RESULT" | grep -q "Invalid email or password"; then
    echo "❌ USER SYNC NOT COMPLETED"
    echo ""
    echo "📋 NEXT STEPS:"
    echo "1. Go to: https://replit.com/@drcwiseman/wonderful-books"
    echo "2. Click 'Database' tab" 
    echo "3. Run the SQL from sync-production-users.sql"
    echo ""
    echo "The SQL commands are:"
    echo "=================================="
    cat sync-production-users.sql | grep "^INSERT" | head -3
else
    echo "⚠️  UNKNOWN RESPONSE - Check manually"
    echo "Response: $LOGIN_RESULT"
fi

echo ""
echo "=== END VERIFICATION ==="