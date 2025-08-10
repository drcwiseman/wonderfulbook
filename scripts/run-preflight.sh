#!/usr/bin/env bash
set -euo pipefail

# Pre-deployment preflight checks for VPS deployment
# This script can be run on any Linux VPS to validate the application

echo "🚀 Starting pre-deployment preflight checks..."

# Set default environment variables
export PREVIEW_URL=${PREVIEW_URL:-"http://localhost:5000"}
export TEST_EMAIL=${TEST_EMAIL:-"test@example.com"}
export TEST_PASSWORD=${TEST_PASSWORD:-"test123"}
export LH_MIN_PERF=${LH_MIN_PERF:-90}
export LH_MIN_BP=${LH_MIN_BP:-90}
export LH_MIN_SEO=${LH_MIN_SEO:-90}
export LH_MIN_PWA=${LH_MIN_PWA:-100}
export REPORTS_USER=${REPORTS_USER:-"checks"}
export REPORTS_PASS=${REPORTS_PASS:-"change_me_strong"}

echo "📋 Configuration:"
echo "  Preview URL: $PREVIEW_URL"
echo "  Test Email: $TEST_EMAIL"
echo "  Lighthouse Thresholds: Perf=$LH_MIN_PERF, BP=$LH_MIN_BP, SEO=$LH_MIN_SEO, PWA=$LH_MIN_PWA"
echo ""

# Check if server is running
echo "🔍 Checking if server is accessible..."
if ! curl -s "$PREVIEW_URL/healthz" > /dev/null; then
    echo "❌ Server not accessible at $PREVIEW_URL"
    echo "   Make sure your application is running and accessible"
    exit 1
fi
echo "✅ Server is accessible"

# Install Playwright browsers if needed
echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps chromium

# Run all preflight checks
echo "🔧 Running preflight checks..."
npm run preflight:all

# Check overall status
if [ -f "reports/summary.json" ]; then
    OVERALL_STATUS=$(node -e "console.log(JSON.parse(require('fs').readFileSync('reports/summary.json', 'utf8')).overall)")
    echo ""
    echo "📊 Preflight Results Summary:"
    echo "  Overall Status: $OVERALL_STATUS"
    echo "  Reports available at: $PREVIEW_URL/reports"
    echo "  Local reports: ./reports/index.html"
    
    if [ "$OVERALL_STATUS" = "PASS" ]; then
        echo "✅ All checks passed! Ready for deployment."
        exit 0
    elif [ "$OVERALL_STATUS" = "WARN" ]; then
        echo "⚠️  Some checks have warnings. Review reports before deployment."
        exit 0
    else
        echo "❌ Some checks failed. Review reports before deployment."
        exit 1
    fi
else
    echo "❌ Failed to generate summary report"
    exit 1
fi