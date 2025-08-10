#!/usr/bin/env bash
set -euo pipefail

echo "📋 Pre-deployment Checklist"
echo "==========================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0
WARNINGS_FOUND=0

check_pass() {
    echo -e "${GREEN}✅ $1${NC}"
}

check_warn() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS_FOUND=$((WARNINGS_FOUND + 1))
}

check_fail() {
    echo -e "${RED}❌ $1${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
}

echo "🔍 CRITICAL FILES VERIFICATION"
echo "=============================="

# Check critical application files
CRITICAL_FILES=(
    "package.json:Application dependencies"
    "server/index.ts:Server entry point"
    "client/src/App.tsx:Frontend application"
    "shared/schema.ts:Database schema"
    "vite.config.ts:Build configuration"
    "drizzle.config.ts:Database migrations"
    ".env.example:Environment template"
)

for entry in "${CRITICAL_FILES[@]}"; do
    file="${entry%%:*}"
    description="${entry##*:}"
    
    if [ -f "$file" ]; then
        check_pass "$description ($file)"
    else
        check_fail "Missing $description ($file)"
    fi
done

echo ""
echo "🔧 BUILD SYSTEM VERIFICATION"
echo "==========================="

# Check if build succeeds
if npm run build >/dev/null 2>&1; then
    check_pass "Application builds successfully"
    
    # Check build outputs
    if [ -d "dist" ] || [ -d "client/dist" ]; then
        check_pass "Build artifacts generated"
        
        # Count build files
        BUILD_FILES=$(find dist client/dist -name "*.js" -o -name "*.css" 2>/dev/null | wc -l)
        if [ "$BUILD_FILES" -gt 0 ]; then
            check_pass "Build contains $BUILD_FILES JS/CSS files"
        else
            check_warn "Build directory exists but contains no JS/CSS files"
        fi
    else
        check_fail "No build artifacts found (dist/ or client/dist/)"
    fi
else
    check_fail "Application build fails"
fi

echo ""
echo "📦 DEPENDENCIES VERIFICATION"
echo "============================"

# Check package.json
if [ -f "package.json" ]; then
    PROD_DEPS=$(jq '.dependencies | length' package.json 2>/dev/null || echo 0)
    DEV_DEPS=$(jq '.devDependencies | length' package.json 2>/dev/null || echo 0)
    
    check_pass "Package.json exists with $PROD_DEPS production and $DEV_DEPS development dependencies"
    
    # Check for potential issues
    if jq -e '.dependencies | has("nodemon")' package.json >/dev/null 2>&1; then
        check_warn "nodemon should be in devDependencies, not dependencies"
    fi
    
    if jq -e '.dependencies | has("typescript")' package.json >/dev/null 2>&1; then
        check_warn "typescript should be in devDependencies, not dependencies"
    fi
else
    check_fail "Missing package.json file"
fi

# Check node_modules
if [ -d "node_modules" ]; then
    NODE_MODULES_SIZE=$(du -sh node_modules 2>/dev/null | cut -f1)
    check_pass "Node modules installed ($NODE_MODULES_SIZE)"
else
    check_fail "Node modules not installed - run 'npm install'"
fi

echo ""
echo "🔒 ENVIRONMENT VARIABLES"
echo "======================="

# Check environment variables
REQUIRED_VARS=(
    "DATABASE_URL:Database connection"
    "SESSION_SECRET:Session security"
    "STRIPE_SECRET_KEY:Payment processing"
    "VITE_STRIPE_PUBLIC_KEY:Frontend payments"
)

MISSING_VARS=()
for entry in "${REQUIRED_VARS[@]}"; do
    var="${entry%%:*}"
    description="${entry##*:}"
    
    if [ -n "${!var:-}" ]; then
        check_pass "$description ($var)"
    else
        check_fail "Missing $description ($var)"
        MISSING_VARS+=("$var")
    fi
done

# Check .env.example exists
if [ -f ".env.example" ]; then
    check_pass "Environment template file exists"
else
    check_warn "Missing .env.example file"
fi

echo ""
echo "🗄️  DATABASE VERIFICATION"
echo "======================="

if [ -n "${DATABASE_URL:-}" ]; then
    if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        check_pass "Database connection successful"
        
        # Check table count
        TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
        if [ "$TABLE_COUNT" -gt 0 ]; then
            check_pass "Database has $TABLE_COUNT tables"
        else
            check_warn "Database connected but no tables found - run migrations"
        fi
    else
        check_fail "Cannot connect to database"
    fi
else
    check_fail "DATABASE_URL not set"
fi

echo ""
echo "🔐 SECURITY CONFIGURATION"
echo "======================="

# Check security headers
if curl -sI http://localhost:5000/ 2>/dev/null | grep -q "Content-Security-Policy"; then
    check_pass "Content Security Policy configured"
else
    check_warn "Content Security Policy not detected"
fi

if curl -sI http://localhost:5000/ 2>/dev/null | grep -q "X-Frame-Options"; then
    check_pass "Frame protection configured"
else
    check_warn "X-Frame-Options not detected"
fi

# Check session secret strength
if [ -n "${SESSION_SECRET:-}" ]; then
    if [ ${#SESSION_SECRET} -ge 32 ]; then
        check_pass "Session secret is sufficiently long"
    else
        check_warn "Session secret should be at least 32 characters"
    fi
fi

echo ""
echo "💳 PAYMENT SYSTEM"
echo "==============="

if [ -n "${STRIPE_SECRET_KEY:-}" ] && [ -n "${VITE_STRIPE_PUBLIC_KEY:-}" ]; then
    # Check Stripe key format
    if [[ "$STRIPE_SECRET_KEY" == sk_* ]]; then
        check_pass "Stripe secret key format valid"
    else
        check_fail "Stripe secret key format invalid (should start with sk_)"
    fi
    
    if [[ "$VITE_STRIPE_PUBLIC_KEY" == pk_* ]]; then
        check_pass "Stripe public key format valid"
    else
        check_fail "Stripe public key format invalid (should start with pk_)"
    fi
    
    # Test Stripe connectivity
    if curl -s -u "$STRIPE_SECRET_KEY:" https://api.stripe.com/v1/balance >/dev/null 2>&1; then
        check_pass "Stripe API connectivity verified"
    else
        check_warn "Cannot verify Stripe API connectivity"
    fi
else
    check_fail "Stripe keys not configured"
fi

echo ""
echo "📨 EMAIL SYSTEM"
echo "=============="

EMAIL_VARS=("SMTP_HOST" "SMTP_PORT" "SMTP_USER" "SMTP_PASS")
EMAIL_CONFIGURED=true

for var in "${EMAIL_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        EMAIL_CONFIGURED=false
        break
    fi
done

if [ "$EMAIL_CONFIGURED" = true ]; then
    check_pass "Email configuration present"
else
    check_warn "Email system not fully configured"
fi

echo ""
echo "🚀 SERVER VERIFICATION"
echo "====================="

# Check if server starts
if curl -sf http://localhost:5000/healthz >/dev/null 2>&1; then
    check_pass "Server is running and health endpoint responds"
    
    # Check critical routes
    ROUTES=("/" "/login" "/api/auth/user")
    for route in "${ROUTES[@]}"; do
        STATUS=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:5000$route" 2>/dev/null)
        if [ "$STATUS" != "000" ]; then
            check_pass "Route $route responds (HTTP $STATUS)"
        else
            check_warn "Route $route not responding"
        fi
    done
else
    check_fail "Server not running or health endpoint not responding"
fi

echo ""
echo "📋 DEPLOYMENT READINESS SUMMARY"
echo "==============================="

if [ $ISSUES_FOUND -eq 0 ] && [ $WARNINGS_FOUND -eq 0 ]; then
    echo -e "${GREEN}🎉 READY FOR DEPLOYMENT!${NC}"
    echo "All checks passed. Your application is ready for production deployment."
elif [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${YELLOW}⚠️  DEPLOYMENT READY WITH WARNINGS${NC}"
    echo "Critical checks passed but $WARNINGS_FOUND warning(s) found."
    echo "Review warnings and consider addressing them before deployment."
else
    echo -e "${RED}❌ NOT READY FOR DEPLOYMENT${NC}"
    echo "Found $ISSUES_FOUND critical issue(s) and $WARNINGS_FOUND warning(s)."
    echo "Fix all critical issues before deployment."
fi

echo ""
echo "🔧 NEXT STEPS"
echo "============"

if [ $ISSUES_FOUND -gt 0 ]; then
    echo "1. Fix the critical issues listed above"
    echo "2. Re-run this checklist: ./scripts/pre-deployment-checklist.sh"
    echo "3. Once all issues are resolved, proceed with deployment"
fi

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "Missing environment variables to set:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   export $var=\"your_value_here\""
    done
fi

echo ""
echo "📖 For complete deployment guide, see: PRODUCTION_DEPLOYMENT_GUIDE.md"

exit $([ $ISSUES_FOUND -eq 0 ] && echo 0 || echo 1)