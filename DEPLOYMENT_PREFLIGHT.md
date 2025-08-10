# Deployment Preflight Checklist

## 🚀 Quick Start

### For Replit Deployment

```bash
# 1. Set environment variables in Secrets
PREVIEW_URL=https://your-repl-preview-url.replit.dev
TEST_EMAIL=test@example.com
TEST_PASSWORD=test123
REPORTS_USER=checks
REPORTS_PASS=strong_password_here

# 2. Install Playwright and run checks
npx playwright install --with-deps
./scripts/preflight.sh

# 3. View results
# Visit: https://your-repl-url.replit.dev/reports
# Username: checks
# Password: strong_password_here
```

### For VPS Deployment

```bash
# 1. Set environment variables
export PREVIEW_URL="https://your-domain.com"
export TEST_EMAIL="test@example.com"
export TEST_PASSWORD="test123"
export REPORTS_USER="checks"
export REPORTS_PASS="strong_password_here"

# 2. Run preflight checks
./scripts/run-preflight.sh

# 3. View results at /reports endpoint
```

## 🔍 What Gets Tested

| Check | Description | Failure Criteria |
|-------|-------------|-------------------|
| **🔗 Links** | Public + authenticated page links | Any 4xx/5xx responses |
| **🚀 Performance** | Lighthouse scores for key pages | Below configured thresholds |
| **♿ Accessibility** | WCAG 2.1 AA compliance | Critical violations |
| **🔒 Security** | Required HTTP headers | Missing security headers |
| **💚 Health** | Database connectivity | `/healthz` returns not OK |

## 📊 Understanding Results

### Overall Status
- **PASS**: ✅ Ready for deployment
- **WARN**: ⚠️ Minor issues, review recommended
- **FAIL**: ❌ Critical issues, fix before deployment

### Individual Reports
- `reports/index.html` - Visual dashboard
- `reports/summary.json` - Aggregated results
- `reports/linkinator.public.json` - Public link validation
- `reports/links.auth.json` - Authenticated link validation
- `reports/lhci/` - Lighthouse performance reports
- `reports/axe.auth.json` - Accessibility scan results
- `reports/headers.json` - Security headers check
- `reports/healthz.json` - Health endpoint response

## ⚙️ Configuration

### Required Environment Variables
```bash
PREVIEW_URL=https://your-staging-url.com
TEST_EMAIL=test@example.com
TEST_PASSWORD=test123
```

### Optional Thresholds
```bash
LH_MIN_PERF=90     # Lighthouse Performance
LH_MIN_BP=90       # Best Practices
LH_MIN_SEO=90      # SEO Score
LH_MIN_PWA=100     # PWA Score
```

### Reports Access
```bash
REPORTS_USER=checks
REPORTS_PASS=your_secure_password
```

## 🛠️ Troubleshooting

### Common Issues

**Server Not Accessible**
```bash
# Check if server is running
curl $PREVIEW_URL/healthz
```

**Test Login Fails**
- Verify TEST_EMAIL and TEST_PASSWORD are valid
- Ensure test account exists and is verified
- Check login form selectors in test files

**Lighthouse Scores Low**
- Review Lighthouse suggestions in reports
- Optimize images, CSS, JavaScript
- Check Core Web Vitals

**Missing Security Headers**
- Ensure helmet middleware is configured
- Check CSP policies for third-party services
- Verify HTTPS in production

**Accessibility Violations**
- Review axe-core reports for specific issues
- Test with screen readers
- Verify color contrast ratios

## 📋 Pre-deployment Checklist

- [ ] All environment variables configured
- [ ] Test account credentials valid
- [ ] Server accessible at PREVIEW_URL
- [ ] Database connection healthy
- [ ] Stripe integration working
- [ ] Email service configured
- [ ] SSL certificate valid (production)
- [ ] Content Security Policy configured
- [ ] Error monitoring active
- [ ] Backup strategy in place

## 🔄 Integration with CI/CD

### GitHub Actions Example
```yaml
name: Preflight Checks
on: [push, pull_request]
jobs:
  preflight:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - env:
          PREVIEW_URL: ${{ secrets.PREVIEW_URL }}
          TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
          TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
        run: ./scripts/preflight.sh
```

### Pre-deployment Gate
```bash
# Only deploy if preflight passes
./scripts/preflight.sh && deploy_to_production.sh
```

## 📈 Monitoring After Deployment

1. **Performance**: Monitor Core Web Vitals
2. **Errors**: Track 4xx/5xx responses
3. **Accessibility**: Regular audits
4. **Security**: Monitor security headers
5. **Health**: Automated health checks

## 🔧 Maintenance

### Regular Tasks
- Update Lighthouse thresholds as performance improves
- Review accessibility reports monthly
- Update security headers as standards evolve
- Refresh test credentials periodically
- Monitor and update dependencies

### When to Run Preflight
- Before every deployment
- After major feature changes
- When dependencies are updated
- During performance optimization
- After security updates