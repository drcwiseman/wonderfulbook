# Health Dashboard Access Guide

## Issue Resolution
The health dashboard at `/admin/health` requires proper admin authentication. The system uses session-based authentication with specific emergency bypass credentials.

## Access Methods

### Method 1: Emergency Login API
```bash
# Step 1: Get admin session
curl -X POST "http://localhost:5000/api/auth/emergency-login" \
  -H "Content-Type: application/json" \
  -d '{"email":"prophetclimate@yahoo.com","password":"testpass123"}' \
  -c admin_session.txt

# Step 2: Access health dashboard
curl "http://localhost:5000/admin/health" -b admin_session.txt
```

### Method 2: Browser Access
1. Navigate to the admin panel: `/admin`
2. Login with emergency credentials:
   - Email: `prophetclimate@yahoo.com` 
   - Password: Use emergency bypass (automatic in development)
3. Access health dashboard at: `/admin/health`

### Method 3: Direct API Access
```bash
# Get health status via API (no auth required)
curl "http://localhost:5000/api/health"

# Get detailed health info (admin required)
curl "http://localhost:5000/api/health/detailed" -b admin_session.txt
```

## Authentication Flow
- The system uses Express sessions with PostgreSQL session store
- Emergency bypass is enabled for development environment
- Session cookies must be properly maintained across requests
- Admin routes require valid session with admin/super_admin role

## Troubleshooting
- Ensure cookies are properly set and sent with requests
- Session data persists in PostgreSQL sessions table
- Check console logs for authentication debug information
- Verify admin user exists and has correct role in database

## Health Dashboard Features
- Real-time system status monitoring
- Database connectivity checks
- SMTP email service status
- Stripe payment integration status
- External API health monitoring
- Performance metrics and alerts