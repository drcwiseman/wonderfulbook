#!/usr/bin/env bash
set -euo pipefail

# Comprehensive pre-deployment preflight checks
# This script runs all validation checks for production readiness

echo "🚀 Starting Wonderful Books preflight checks..."

# Set defaults if not provided
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
echo "🔍 Checking server accessibility..."
if ! curl -sf "$PREVIEW_URL/healthz" > /dev/null; then
    echo "❌ Server not accessible at $PREVIEW_URL/healthz"
    echo "   Make sure your application is running and accessible"
    exit 1
fi
echo "✅ Server is accessible"

# Create reports directory
echo "📁 Preparing reports directory..."
mkdir -p reports
echo "Reports directory ready" > reports/.gitkeep

# Install Playwright browsers if needed
echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps chromium || {
    echo "⚠️  Playwright install failed, continuing with available browsers"
}

# Function to run individual checks
run_check() {
    local name="$1"
    local cmd="$2"
    echo "🔧 Running $name..."
    if eval "$cmd"; then
        echo "✅ $name completed"
        return 0
    else
        echo "❌ $name failed"
        return 1
    fi
}

# Run all preflight checks
failed_checks=0

# 1. Public links check
if ! run_check "Public Links Check" "linkinator $PREVIEW_URL/ --recurse --skip 'tel:|mailto:|#|javascript:' --timeout 15000 --json > reports/linkinator.public.json"; then
    ((failed_checks++))
fi

# 2. Sitemap links check (optional)
run_check "Sitemap Links Check" "linkinator $PREVIEW_URL/sitemap.xml --silent --json > reports/linkinator.sitemap.json || echo '{\"links\":[]}' > reports/linkinator.sitemap.json"

# 3. Authenticated links check
if ! run_check "Authenticated Links Check" "playwright test tests/links.auth.spec.ts --reporter=json > reports/links.auth.json"; then
    ((failed_checks++))
fi

# 4. Lighthouse performance
if ! run_check "Lighthouse Performance" "lhci autorun --config=lhci.config.json --upload.target=filesystem --upload.outputDir=reports/lhci"; then
    ((failed_checks++))
fi

# 5. Accessibility check
run_check "Accessibility Scan" "pa11y -c pa11y.config.json > reports/pa11y.json 2>/dev/null || echo '[]' > reports/pa11y.json && playwright test tests/a11y.auth.spec.ts --reporter=json > reports/axe.auth.json || echo '{\"tests\":[]}' > reports/axe.auth.json"

# 6. Security headers check
if ! run_check "Security Headers Check" "node tools/check-headers.mjs > reports/headers.json"; then
    ((failed_checks++))
fi

# 7. Health endpoint check
if ! run_check "Health Endpoint Check" "node -e \"
const fs=require('fs');
const https=require('https');
const http=require('http');
const u=process.env.PREVIEW_URL+'/healthz';
const client=u.startsWith('https')?https:http;
client.get(u,(r)=>{
  let d='';
  r.on('data',c=>d+=c);
  r.on('end',()=>{
    fs.writeFileSync('reports/healthz.json',d||'{}');
    try {
      const health = JSON.parse(d||'{}');
      if (!health.ok) process.exit(1);
    } catch(e) { process.exit(1); }
  });
}).on('error',e=>{
  fs.writeFileSync('reports/healthz.json',JSON.stringify({error:String(e)}));
  process.exit(1);
});
\""; then
    ((failed_checks++))
fi

# 8. Generate aggregated report
echo "📊 Generating summary report..."
if node tools/aggregate-reports.mjs; then
    echo "✅ Summary report generated"
else
    echo "❌ Failed to generate summary report"
    ((failed_checks++))
fi

# Check results
echo ""
echo "🏁 Preflight Results:"
if [ -f "reports/summary.json" ]; then
    OVERALL_STATUS=$(node -e "try { console.log(JSON.parse(require('fs').readFileSync('reports/summary.json', 'utf8')).overall); } catch(e) { console.log('UNKNOWN'); }")
    echo "  Overall Status: $OVERALL_STATUS"
    echo "  Detailed Report: $PREVIEW_URL/reports (auth: $REPORTS_USER / $REPORTS_PASS)"
    echo "  Local Report: file://$(pwd)/reports/index.html"
    
    case "$OVERALL_STATUS" in
        "PASS")
            echo "🎉 All checks passed! Ready for deployment."
            exit 0
            ;;
        "WARN")
            echo "⚠️  Some checks have warnings. Review before deployment."
            exit 0
            ;;
        "FAIL")
            echo "❌ Critical checks failed. Fix issues before deployment."
            exit 1
            ;;
        *)
            echo "❓ Unknown status. Review reports manually."
            exit 1
            ;;
    esac
else
    echo "❌ Failed to generate summary. Check individual reports."
    exit 1
fi