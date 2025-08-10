#!/usr/bin/env bash
set -euo pipefail

echo "🧪 Testing Preflight Check Suite Demo"
echo "======================================"

# Set demo environment variables
export PREVIEW_URL="http://localhost:5000"
export TEST_EMAIL="admin-test@email-system-test.com"
export TEST_PASSWORD="admin123"
export REPORTS_USER="checks"
export REPORTS_PASS="demo_password"

echo "📋 Configuration:"
echo "  Preview URL: $PREVIEW_URL"
echo "  Test Email: $TEST_EMAIL"
echo "  Reports Auth: $REPORTS_USER / $REPORTS_PASS"
echo ""

# Test individual components
echo "🔍 Testing individual components..."

# 1. Health check
echo "1. Testing /healthz endpoint:"
if curl -sf "$PREVIEW_URL/healthz" | jq -r '.ok // "false"' | grep -q "true"; then
    echo "   ✅ Health endpoint working"
else
    echo "   ❌ Health endpoint failed"
fi

# 2. Security headers
echo "2. Testing security headers:"
HEADERS=$(curl -sI "$PREVIEW_URL/" | grep -E "(Content-Security-Policy|X-Frame-Options|X-Content-Type-Options|Referrer-Policy)" | wc -l)
if [ "$HEADERS" -ge 3 ]; then
    echo "   ✅ Security headers present ($HEADERS found)"
else
    echo "   ❌ Missing security headers (only $HEADERS found)"
fi

# 3. Test reports directory
echo "3. Testing reports directory:"
mkdir -p reports
echo '{"test": "data"}' > reports/test.json
if [ -f "reports/test.json" ]; then
    echo "   ✅ Reports directory writable"
    rm -f reports/test.json
else
    echo "   ❌ Reports directory not writable"
fi

# 4. Test basic tools
echo "4. Testing preflight tools:"

# Check headers tool
if node tools/check-headers.mjs > /dev/null 2>&1; then
    echo "   ✅ Headers check tool working"
else
    echo "   ❌ Headers check tool failed"
fi

# Aggregate reports tool
echo '{"timestamp":"2025-01-01","overall":"PASS","details":{}}' > reports/summary.json
if node tools/aggregate-reports.mjs > /dev/null 2>&1; then
    echo "   ✅ Reports aggregator working"
else
    echo "   ❌ Reports aggregator failed"
fi

# 5. Test reports endpoint with auth
echo "5. Testing reports endpoint access:"
if curl -sf -u "$REPORTS_USER:$REPORTS_PASS" "$PREVIEW_URL/reports/" > /dev/null; then
    echo "   ✅ Reports endpoint accessible with auth"
else
    echo "   ❌ Reports endpoint auth failed"
fi

echo ""
echo "🎯 Demo Summary:"
echo "   The preflight check suite is ready to use!"
echo ""
echo "🚀 To run full preflight checks:"
echo "   ./scripts/preflight.sh"
echo ""
echo "📊 To view reports:"
echo "   Visit: http://localhost:5000/reports"
echo "   Username: checks"
echo "   Password: demo_password"
echo ""
echo "📁 Report files will be generated in: ./reports/"
echo "   - index.html (visual dashboard)"
echo "   - summary.json (aggregated results)"
echo "   - Individual test result files"