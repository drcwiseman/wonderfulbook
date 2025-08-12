# PDF Reader Access Troubleshooting - clearwiseman@gmail.com

## Issue Summary
User `clearwiseman@gmail.com` exists in production database but cannot access PDF reader when clicking "Start Reading" from book detail pages.

## Authentication Flow Analysis
The reader page (`/reader/{bookId}`) has these authentication checks:

1. **useAuth Hook Check**: Verifies authentication state
2. **Session Validation**: Checks for valid session cookies
3. **Subscription Status**: Validates access permissions
4. **Automatic Redirect**: Redirects to `/auth/login` if unauthorized

## Troubleshooting Steps for User

### Step 1: Clear Browser Data
1. Clear browser cookies and cache
2. Close all browser tabs
3. Restart browser

### Step 2: Re-login Process
1. Go to platform login page: `/auth/login`
2. Enter credentials: `clearwiseman@gmail.com`
3. Complete login process
4. Verify authentication status

### Step 3: Test Access Flow
1. After successful login, go to bookstore
2. Click on any book to view details
3. Look for "Start Reading" button (should appear if authenticated)
4. Click "Start Reading" to access PDF reader

### Step 4: Session Verification
If still not working, check:
- Browser developer tools → Application → Cookies
- Look for `connect.sid` cookie
- Ensure session cookie is present and valid

## Technical Debugging

### For Admin/Developer:
Check user status in production:
```sql
SELECT id, email, subscription_tier, subscription_status, 
       free_trial_ended_at, created_at 
FROM users 
WHERE email = 'clearwiseman@gmail.com';
```

### Authentication API Test:
```bash
# Test authentication endpoint
curl -s "https://mywonderfulbooks.com/api/auth/user" \
  -H "Cookie: connect.sid=USER_SESSION_ID"
```

## Common Causes & Solutions

### 1. Expired Session
**Cause**: Session cookie expired
**Solution**: User needs to log out and log back in

### 2. Cookie Issues
**Cause**: Browser blocking cookies or CORS issues
**Solution**: Enable cookies, check CORS settings

### 3. Subscription Status
**Cause**: User account lacks active subscription/trial
**Solution**: Verify subscription status, start free trial if needed

### 4. Cache Issues
**Cause**: Stale authentication state in browser
**Solution**: Hard refresh (Ctrl+F5) or clear cache

## Expected Behavior
After successful authentication:
- Book detail page shows "Start Reading" button
- Clicking button opens PDF reader immediately
- No redirect to login page
- Full access to book content

## Verification Steps
1. User can successfully login
2. Authentication status persists across page refreshes  
3. "Start Reading" button appears on book detail pages
4. PDF reader opens without authentication errors
5. Reading progress and bookmarks work properly

If issue persists after these steps, may need admin intervention to check user account status in production database.