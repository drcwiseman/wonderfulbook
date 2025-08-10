# Production Deployment Guide - Wonderful Books

## Quick Start for Production Deployment

### 1. Pre-deployment Validation
```bash
# Set your production URL
export PREVIEW_URL="https://your-production-domain.com"
export TEST_EMAIL="test@yourdomain.com"
export TEST_PASSWORD="your_test_password"

# Run comprehensive validation
./scripts/preflight.sh

# View results
# Visit: https://your-domain.com/reports
# Username: checks
# Password: your_secure_password
```

### 2. Required Environment Variables
```bash
# Core Application
DATABASE_URL="postgresql://user:pass@host:5432/wonderfulbooks"
SESSION_SECRET="your-super-secure-session-secret"
NODE_ENV="production"

# Stripe Payment Processing
STRIPE_SECRET_KEY="sk_live_your_live_key"
VITE_STRIPE_PUBLIC_KEY="pk_live_your_public_key"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret"

# Email Service (SMTP)
SMTP_HOST="your-smtp-host.com"
SMTP_PORT="587"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-smtp-password"

# Security & Monitoring
REPORTS_USER="checks"
REPORTS_PASS="strong_unique_password"
```

### 3. Deployment Checklist

#### Pre-deployment Validation
- [ ] All preflight checks pass
- [ ] Security headers configured
- [ ] Health endpoint responding
- [ ] Database connectivity verified
- [ ] Stripe integration working
- [ ] Email service configured

#### Security Configuration
- [ ] HTTPS enabled with valid SSL certificate
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] Content Security Policy configured
- [ ] Rate limiting active

#### Performance & Monitoring
- [ ] Lighthouse scores meet thresholds
- [ ] Health monitoring active
- [ ] Error tracking configured
- [ ] Backup strategy implemented
- [ ] CDN configured (if applicable)

#### Accessibility & SEO
- [ ] WCAG 2.1 AA compliance verified
- [ ] Meta descriptions and titles set
- [ ] Open Graph tags configured
- [ ] Sitemap generated

## Production Validation Commands

### Full System Check
```bash
# Run all validation tests
./scripts/preflight.sh

# Check specific components
node tools/check-headers.mjs
curl https://your-domain.com/healthz
```

### Monitoring & Health
```bash
# Health endpoint
curl https://your-domain.com/healthz

# Security headers
curl -I https://your-domain.com/

# Database connectivity
psql $DATABASE_URL -c "SELECT 1;"
```

## Post-deployment Monitoring

### Automated Health Checks
The system includes built-in health monitoring:
- Database connectivity checks every 5 minutes
- Performance metrics tracking
- Error rate monitoring
- Stripe API connectivity verification

### Reports Dashboard
Access deployment status at:
- URL: `https://your-domain.com/reports`
- Protected with basic authentication
- Real-time status updates
- Historical trend tracking

### Key Metrics to Monitor
1. **Response Times**: Health endpoint < 100ms
2. **Error Rates**: < 1% 4xx/5xx responses
3. **Database Performance**: Connection time < 50ms
4. **Payment Processing**: Stripe webhook delivery
5. **Email Delivery**: SMTP success rates

## Troubleshooting Production Issues

### Common Deployment Problems

**SSL Certificate Issues**
```bash
# Verify certificate
curl -I https://your-domain.com/
# Check expiration
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

**Database Connection Problems**
```bash
# Test connection
psql $DATABASE_URL -c "SELECT current_timestamp;"
# Check pool status
curl https://your-domain.com/healthz
```

**Payment Processing Issues**
```bash
# Verify Stripe keys
curl -u $STRIPE_SECRET_KEY: https://api.stripe.com/v1/balance
# Check webhook endpoints
stripe listen --forward-to https://your-domain.com/api/stripe/webhook
```

**Email Service Problems**
```bash
# Test SMTP connection
telnet $SMTP_HOST $SMTP_PORT
# Check email logs in application
```

### Emergency Procedures

**Immediate Rollback**
1. Revert to previous deployment
2. Check health endpoints
3. Verify critical functionality
4. Notify users if necessary

**Database Issues**
1. Check connection pool status
2. Verify database server health
3. Review recent migrations
4. Contact database provider support

**Payment System Outage**
1. Check Stripe status page
2. Verify webhook delivery
3. Review transaction logs
4. Implement fallback messaging

## Success Metrics

### Performance Targets
- Page load time: < 2 seconds
- Time to interactive: < 3 seconds
- Core Web Vitals: All green
- Uptime: > 99.9%

### User Experience
- Accessibility compliance: WCAG 2.1 AA
- Mobile responsiveness: All screen sizes
- Cross-browser compatibility: Modern browsers
- Payment success rate: > 98%

### Security Standards
- All security headers present
- Regular security scans
- Dependency updates monthly
- Incident response plan active

## Maintenance Schedule

### Weekly Tasks
- Review health monitoring reports
- Check error logs and performance
- Verify backup integrity
- Update security patches

### Monthly Tasks
- Dependency security updates
- Performance optimization review
- Accessibility audit
- Payment processing reconciliation

### Quarterly Tasks
- Full security assessment
- Disaster recovery testing
- Performance benchmark review
- User experience evaluation

## Support & Documentation

### Key Resources
- Health Dashboard: `/reports`
- API Documentation: `/api/docs`
- Admin Interface: `/admin`
- Super Admin: `/super-admin`

### Emergency Contacts
- System Administrator: [contact info]
- Database Support: [contact info]
- Payment Provider: Stripe Support
- Hosting Provider: [contact info]

This production deployment guide ensures your Wonderful Books platform is deployed securely, monitored effectively, and maintained properly for optimal user experience.