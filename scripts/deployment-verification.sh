#!/usr/bin/env bash
set -euo pipefail

echo "🔍 Deployment Verification Suite"
echo "================================"
echo ""

# Configuration
DEPLOYMENT_URL="${DEPLOYMENT_URL:-}"
LOCAL_PORT="${LOCAL_PORT:-5000}"
LOCAL_URL="http://localhost:$LOCAL_PORT"

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "❌ Error: DEPLOYMENT_URL environment variable not set"
    echo "Usage: DEPLOYMENT_URL=https://your-deployed-app.com ./scripts/deployment-verification.sh"
    exit 1
fi

echo "📋 Comparing local development vs deployed production"
echo "Local:      $LOCAL_URL"
echo "Deployed:   $DEPLOYMENT_URL"
echo ""

# Create verification report
REPORT_FILE="reports/deployment-verification-$(date +%Y%m%d_%H%M%S).json"
mkdir -p reports

echo "🔍 Running deployment verification checks..."

# 1. File Structure Verification
echo "1. Verifying file structure..."
FILES_CRITICAL=(
    "package.json"
    "server/index.ts"
    "client/src/App.tsx"
    "shared/schema.ts"
    "vite.config.ts"
    "drizzle.config.ts"
)

FILES_MISSING=()
for file in "${FILES_CRITICAL[@]}"; do
    if [ ! -f "$file" ]; then
        FILES_MISSING+=("$file")
    fi
done

# 2. Dependencies Verification
echo "2. Checking dependencies..."
if [ -f "package.json" ]; then
    DEP_COUNT=$(jq '.dependencies | length' package.json)
    DEVDEP_COUNT=$(jq '.devDependencies | length' package.json)
    echo "   Dependencies: $DEP_COUNT production, $DEVDEP_COUNT development"
else
    DEP_COUNT=0
    DEVDEP_COUNT=0
fi

# 3. Environment Variables Check
echo "3. Verifying environment variables..."
ENV_VARS_REQUIRED=(
    "DATABASE_URL"
    "SESSION_SECRET"
    "STRIPE_SECRET_KEY"
    "VITE_STRIPE_PUBLIC_KEY"
)

ENV_MISSING=()
for var in "${ENV_VARS_REQUIRED[@]}"; do
    if [ -z "${!var:-}" ]; then
        ENV_MISSING+=("$var")
    fi
done

# 4. Health Endpoint Comparison
echo "4. Comparing health endpoints..."
LOCAL_HEALTH=""
DEPLOYED_HEALTH=""

if curl -sf "$LOCAL_URL/healthz" >/dev/null 2>&1; then
    LOCAL_HEALTH=$(curl -s "$LOCAL_URL/healthz" 2>/dev/null || echo '{"error":"local_unavailable"}')
else
    LOCAL_HEALTH='{"error":"local_server_not_running"}'
fi

if curl -sf "$DEPLOYMENT_URL/healthz" >/dev/null 2>&1; then
    DEPLOYED_HEALTH=$(curl -s "$DEPLOYMENT_URL/healthz" 2>/dev/null || echo '{"error":"deployed_unavailable"}')
else
    DEPLOYED_HEALTH='{"error":"deployed_server_not_responding"}'
fi

# 5. Critical Routes Verification
echo "5. Testing critical routes..."
ROUTES_TO_TEST=(
    "/"
    "/login"
    "/api/auth/user"
    "/api/books"
    "/admin"
    "/healthz"
)

ROUTES_LOCAL_STATUS=()
ROUTES_DEPLOYED_STATUS=()

for route in "${ROUTES_TO_TEST[@]}"; do
    # Test local
    LOCAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$LOCAL_URL$route" 2>/dev/null || echo "000")
    ROUTES_LOCAL_STATUS+=("$route:$LOCAL_STATUS")
    
    # Test deployed
    DEPLOYED_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$route" 2>/dev/null || echo "000")
    ROUTES_DEPLOYED_STATUS+=("$route:$DEPLOYED_STATUS")
    
    echo "   $route: Local=$LOCAL_STATUS, Deployed=$DEPLOYED_STATUS"
done

# 6. Database Schema Verification
echo "6. Checking database schema..."
DB_TABLES_COUNT=""
if [ -n "${DATABASE_URL:-}" ]; then
    DB_TABLES_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs || echo "unknown")
else
    DB_TABLES_COUNT="no_database_url"
fi

# 7. Static Assets Verification
echo "7. Verifying static assets..."
STATIC_ASSETS=(
    "/assets/index.css"
    "/assets/index.js"
    "/favicon.ico"
)

ASSETS_STATUS=()
for asset in "${STATIC_ASSETS[@]}"; do
    ASSET_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL$asset" 2>/dev/null || echo "000")
    ASSETS_STATUS+=("$asset:$ASSET_STATUS")
done

# 8. Build Verification
echo "8. Checking build artifacts..."
BUILD_DIRS=("dist" "client/dist" "public/assets")
BUILD_PRESENT=()

for dir in "${BUILD_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        FILE_COUNT=$(find "$dir" -type f | wc -l)
        BUILD_PRESENT+=("$dir:$FILE_COUNT files")
    else
        BUILD_PRESENT+=("$dir:missing")
    fi
done

# Generate verification report
echo "9. Generating verification report..."

cat > "$REPORT_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "verification_type": "deployment_comparison",
  "local_url": "$LOCAL_URL",
  "deployed_url": "$DEPLOYMENT_URL",
  "results": {
    "files": {
      "critical_files_missing": $(printf '%s\n' "${FILES_MISSING[@]}" | jq -R -s 'split("\n")[:-1]' 2>/dev/null || echo '[]'),
      "total_critical": ${#FILES_CRITICAL[@]},
      "missing_count": ${#FILES_MISSING[@]}
    },
    "dependencies": {
      "production_count": $DEP_COUNT,
      "development_count": $DEVDEP_COUNT
    },
    "environment": {
      "missing_variables": $(printf '%s\n' "${ENV_MISSING[@]}" | jq -R -s 'split("\n")[:-1]' 2>/dev/null || echo '[]'),
      "required_count": ${#ENV_VARS_REQUIRED[@]},
      "missing_count": ${#ENV_MISSING[@]}
    },
    "health_check": {
      "local": $LOCAL_HEALTH,
      "deployed": $DEPLOYED_HEALTH
    },
    "routes": {
      "local": $(printf '%s\n' "${ROUTES_LOCAL_STATUS[@]}" | jq -R -s 'split("\n")[:-1]' 2>/dev/null || echo '[]'),
      "deployed": $(printf '%s\n' "${ROUTES_DEPLOYED_STATUS[@]}" | jq -R -s 'split("\n")[:-1]' 2>/dev/null || echo '[]')
    },
    "database": {
      "tables_count": "$DB_TABLES_COUNT"
    },
    "static_assets": $(printf '%s\n' "${ASSETS_STATUS[@]}" | jq -R -s 'split("\n")[:-1]' 2>/dev/null || echo '[]'),
    "build_artifacts": $(printf '%s\n' "${BUILD_PRESENT[@]}" | jq -R -s 'split("\n")[:-1]' 2>/dev/null || echo '[]')
  }
}
EOF

# Analysis and recommendations
echo ""
echo "📊 DEPLOYMENT VERIFICATION RESULTS"
echo "=================================="

OVERALL_STATUS="PASS"

if [ ${#FILES_MISSING[@]} -gt 0 ]; then
    echo "❌ Missing critical files: ${FILES_MISSING[*]}"
    OVERALL_STATUS="FAIL"
fi

if [ ${#ENV_MISSING[@]} -gt 0 ]; then
    echo "⚠️  Missing environment variables: ${ENV_MISSING[*]}"
    OVERALL_STATUS="WARN"
fi

if [ "$LOCAL_HEALTH" != "$DEPLOYED_HEALTH" ]; then
    echo "⚠️  Health check mismatch between local and deployed"
    echo "     Local: $LOCAL_HEALTH"
    echo "     Deployed: $DEPLOYED_HEALTH"
    OVERALL_STATUS="WARN"
fi

# Route comparison
ROUTE_MISMATCHES=0
for i in "${!ROUTES_LOCAL_STATUS[@]}"; do
    LOCAL_ROUTE="${ROUTES_LOCAL_STATUS[$i]}"
    DEPLOYED_ROUTE="${ROUTES_DEPLOYED_STATUS[$i]}"
    if [ "$LOCAL_ROUTE" != "$DEPLOYED_ROUTE" ]; then
        ROUTE_MISMATCHES=$((ROUTE_MISMATCHES + 1))
    fi
done

if [ $ROUTE_MISMATCHES -gt 0 ]; then
    echo "⚠️  $ROUTE_MISMATCHES route(s) have different responses between local and deployed"
    OVERALL_STATUS="WARN"
fi

echo ""
echo "Overall Status: $OVERALL_STATUS"
echo "Report saved to: $REPORT_FILE"

# Recommendations
echo ""
echo "🚀 DEPLOYMENT RECOMMENDATIONS"
echo "============================"

if [ ${#FILES_MISSING[@]} -gt 0 ]; then
    echo "• Ensure all critical files are committed to version control"
    echo "• Run 'git status' to check for uncommitted changes"
    echo "• Verify .gitignore doesn't exclude necessary files"
fi

if [ ${#ENV_MISSING[@]} -gt 0 ]; then
    echo "• Set missing environment variables in deployment environment"
    echo "• Use Replit Secrets for sensitive values"
    echo "• Update .env.example with all required variables"
fi

if [ "$OVERALL_STATUS" != "PASS" ]; then
    echo "• Review the verification report: $REPORT_FILE"
    echo "• Fix identified issues before deployment"
    echo "• Re-run verification after fixes"
else
    echo "✅ Deployment verification passed!"
    echo "• Local and deployed versions are consistent"
    echo "• All critical components verified"
fi

exit $([ "$OVERALL_STATUS" = "PASS" ] && echo 0 || echo 1)