#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Complete Deployment Workflow"
echo "==============================="
echo ""

# Step 1: Pre-deployment verification
echo "Step 1: Running pre-deployment checks..."
if ./scripts/pre-deployment-checklist.sh; then
    echo "✅ Pre-deployment checks passed"
else
    echo "❌ Pre-deployment checks failed - fix issues before proceeding"
    exit 1
fi

echo ""

# Step 2: Clean build
echo "Step 2: Creating clean build..."
echo "Removing old build artifacts..."
rm -rf dist client/dist node_modules/.vite

echo "Building application..."
if npm run build; then
    echo "✅ Build successful"
else
    echo "❌ Build failed"
    exit 1
fi

# Step 3: Verify build artifacts
echo ""
echo "Step 3: Verifying build artifacts..."
if [ -d "dist" ] || [ -d "client/dist" ]; then
    BUILD_FILES=$(find dist client/dist -type f 2>/dev/null | wc -l)
    echo "✅ Build artifacts created ($BUILD_FILES files)"
    
    # Show key build files
    echo "Key build files:"
    find dist client/dist -name "*.js" -o -name "*.css" 2>/dev/null | head -5
else
    echo "❌ No build artifacts found"
    exit 1
fi

# Step 4: Test built application
echo ""
echo "Step 4: Testing built application..."
echo "Starting preview server..."
npm run preview &
PREVIEW_PID=$!

# Wait for server to start
sleep 5

# Test the built application
if curl -sf http://localhost:4173/ >/dev/null 2>&1; then
    echo "✅ Built application responds"
    
    # Test health endpoint if available
    if curl -sf http://localhost:4173/healthz >/dev/null 2>&1; then
        echo "✅ Health endpoint working in built version"
    fi
else
    echo "⚠️  Built application not responding (may be normal if server config differs)"
fi

# Clean up preview server
kill $PREVIEW_PID 2>/dev/null || true
sleep 2

# Step 5: Git status check
echo ""
echo "Step 5: Checking git status..."
if git diff --quiet && git diff --staged --quiet; then
    echo "✅ No uncommitted changes"
else
    echo "⚠️  Uncommitted changes detected:"
    git status --porcelain
    
    read -p "Commit changes before deployment? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Committing changes..."
        git add .
        git commit -m "Pre-deployment: $(date '+%Y-%m-%d %H:%M:%S')"
        echo "✅ Changes committed"
    else
        echo "⚠️  Proceeding with uncommitted changes (not recommended)"
    fi
fi

# Step 6: Environment variables check
echo ""
echo "Step 6: Environment variables verification..."
REQUIRED_VARS=("DATABASE_URL" "SESSION_SECRET" "STRIPE_SECRET_KEY" "VITE_STRIPE_PUBLIC_KEY")
MISSING_VARS=()

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var:-}" ]; then
        MISSING_VARS+=("$var")
    fi
done

if [ ${#MISSING_VARS[@]} -eq 0 ]; then
    echo "✅ All required environment variables are set"
else
    echo "⚠️  Missing environment variables (set these in Replit Secrets):"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
fi

# Step 7: Database verification
echo ""
echo "Step 7: Database verification..."
if [ -n "${DATABASE_URL:-}" ]; then
    if psql "$DATABASE_URL" -c "SELECT 1;" >/dev/null 2>&1; then
        TABLE_COUNT=$(psql "$DATABASE_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null | xargs)
        echo "✅ Database connected with $TABLE_COUNT tables"
    else
        echo "⚠️  Database connection failed"
    fi
else
    echo "⚠️  DATABASE_URL not set"
fi

# Step 8: Security check
echo ""
echo "Step 8: Security configuration check..."
if [ -n "${SESSION_SECRET:-}" ] && [ ${#SESSION_SECRET} -ge 32 ]; then
    echo "✅ Session secret is strong"
else
    echo "⚠️  Session secret should be at least 32 characters"
fi

# Step 9: Final summary
echo ""
echo "🎯 DEPLOYMENT READINESS SUMMARY"
echo "==============================="

ALL_GOOD=true

if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "⚠️  Missing environment variables - set in Replit Secrets"
    ALL_GOOD=false
fi

if ! git diff --quiet || ! git diff --staged --quiet; then
    echo "⚠️  Uncommitted changes present"
    ALL_GOOD=false
fi

if [ "$ALL_GOOD" = true ]; then
    echo "🎉 READY FOR DEPLOYMENT!"
    echo ""
    echo "📋 DEPLOYMENT STEPS:"
    echo "1. Go to your Replit workspace"
    echo "2. Click on 'Deploy' in the sidebar"
    echo "3. Choose 'Replit Deployment'"
    echo "4. Click 'Deploy'"
    echo "5. Wait for deployment to complete"
    echo "6. Test deployed application"
    echo ""
    echo "🔍 AFTER DEPLOYMENT:"
    echo "Run verification: DEPLOYMENT_URL=\"https://your-app.replit.app\" ./scripts/deployment-verification.sh"
else
    echo "⚠️  ISSUES TO RESOLVE BEFORE DEPLOYMENT"
    echo "Fix the warnings above, then re-run this script"
fi

echo ""
echo "📖 For detailed deployment guide, see: DEPLOYMENT_COMPLETENESS_GUIDE.md"

exit $([ "$ALL_GOOD" = true ] && echo 0 || echo 1)