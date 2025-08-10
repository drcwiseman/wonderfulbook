# Pre-deployment Preflight Checks

This document describes the comprehensive pre-deployment check suite for Wonderful Books platform. The suite validates production readiness by testing links, performance, accessibility, security headers, and health endpoints.

## Quick Start

### On Replit

1. Set environment variables in Secrets:
```bash
PREVIEW_URL=https://your-repl-preview-url.replit.dev
TEST_EMAIL=test@example.com
TEST_PASSWORD=test123
REPORTS_USER=checks
REPORTS_PASS=your_strong_password
```

2. Run in Replit Shell:
```bash
npx playwright install --with-deps
npm run preflight:all
```

3. View results at `https://your-repl-url.replit.dev/reports` (requires basic auth)

### On VPS

1. Clone and setup your application
2. Set environment variables:
```bash
export PREVIEW_URL="https://your-domain.com"
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="test123"
export REPORTS_USER="checks"
export REPORTS_PASS="your_strong_password"
```

3. Run preflight script:
```bash
chmod +x scripts/run-preflight.sh
./scripts/run-preflight.sh
```

## Environment Variables

### Required
- `PREVIEW_URL` - The URL to test (your staging/preview environment)
- `TEST_EMAIL` - Valid test account email
- `TEST_PASSWORD` - Valid test account password

### Optional
- `LH_MIN_PERF` - Lighthouse performance threshold (default: 90)
- `LH_MIN_BP` - Lighthouse best practices threshold (default: 90)
- `LH_MIN_SEO` - Lighthouse SEO threshold (default: 90)
- `LH_MIN_PWA` - Lighthouse PWA threshold (default: 100)
- `REPORTS_USER` - Basic auth username for /reports (default: "checks")
- `REPORTS_PASS` - Basic auth password for /reports (default: "change_me_strong")

## What Gets Tested

### 🔗 Link Validation
- **Public pages**: Crawls from homepage, checks all internal links
- **Authenticated pages**: Logs in and validates links from dashboard, library, etc.
- **Criteria**: All links must return status < 400

### 🚀 Lighthouse Performance
- **Pages tested**: Homepage and library page
- **Metrics**: Performance, accessibility, best practices, SEO, PWA
- **Runs**: 2 runs per page for consistent results
- **Criteria**: Scores must meet configured thresholds

### ♿ Accessibility
- **Public pages**: pa11y scan for WCAG 2.1 AA compliance
- **Authenticated pages**: Axe-core scan of dashboard after login
- **Criteria**: Reports violations for review (non-blocking)

### 🔒 Security Headers
- **Headers checked**:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `X-Frame-Options`
  - `X-Content-Type-Options`
  - `Referrer-Policy`
- **Criteria**: All required headers must be present

### 💚 Health Check
- **Endpoint**: `/healthz`
- **Tests**: Database connectivity, response time
- **Criteria**: Must return `{ "ok": true, "db": "up" }`

## Report Structure

### Online Reports
Access at `https://your-domain/reports` with basic auth:
- **Dashboard**: `reports/index.html` - Visual summary with status badges
- **Raw data**: JSON files for detailed analysis

### Report Files
Generated in `reports/` directory:
- `index.html` - Main dashboard
- `summary.json` - Aggregated results
- `linkinator.public.json` - Public link validation
- `links.auth.json` - Authenticated link validation
- `lhci/` - Lighthouse reports
- `axe.auth.json` - Accessibility scan results
- `headers.json` - Security headers check
- `healthz.json` - Health endpoint response

## Failure Criteria

The suite fails if:
- ❌ Any internal link returns 4xx/5xx status
- ❌ Lighthouse scores below configured thresholds
- ❌ Required security headers missing
- ❌ Health endpoint returns `"ok": false` or database down

## NPM Scripts

Individual check commands:
```bash
npm run preflight:prepare        # Create reports directory
npm run preflight:links:public   # Check public page links
npm run preflight:links:auth     # Check authenticated page links
npm run preflight:lighthouse     # Run Lighthouse audits
npm run preflight:accessibility  # Run accessibility scans
npm run preflight:headers        # Check security headers
npm run preflight:healthz        # Test health endpoint
npm run preflight:aggregate      # Generate summary report
npm run preflight:all           # Run all checks
```

## Integration with CI/CD

### Replit Deployments
Add to your deployment workflow:
```bash
# Before promoting to production
PREVIEW_URL="$REPLIT_DEV_DOMAIN" npm run preflight:all
```

### VPS Deployment
Use the preflight script as a pre-deployment gate:
```bash
./scripts/run-preflight.sh && deploy_to_production.sh
```

### GitHub Actions Example
```yaml
- name: Run preflight checks
  env:
    PREVIEW_URL: https://staging.yourapp.com
    TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
    TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
  run: |
    npx playwright install --with-deps
    npm run preflight:all
```

## Troubleshooting

### Common Issues

**Playwright browser installation fails**:
```bash
# Install with system dependencies
npx playwright install --with-deps chromium
```

**Test login fails**:
- Verify TEST_EMAIL and TEST_PASSWORD are valid
- Check login form selectors in test files
- Ensure test account exists and is verified

**Lighthouse thresholds too strict**:
- Adjust thresholds via environment variables
- Review Lighthouse suggestions for improvements

**Security headers missing**:
- Ensure helmet middleware is configured
- Check CSP policies for Stripe/PDF.js compatibility

**Health check fails**:
- Verify database connection
- Check /healthz endpoint accessibility
- Review server logs for errors

### Support

For issues with the preflight suite:
1. Check `reports/summary.json` for detailed error information
2. Review individual report files for specific failures
3. Ensure all dependencies are installed: `npm install`
4. Verify environment variables are set correctly

## Best Practices

1. **Run before every deployment** - Catch issues early
2. **Monitor trends** - Track performance scores over time
3. **Fix failures promptly** - Don't ignore failed checks
4. **Review accessibility** - Address violations for better UX
5. **Secure reports** - Use strong passwords for /reports access
6. **Regular updates** - Keep thresholds challenging but achievable