// Direct browser console test for admin access
// Copy and paste this into your browser console at https://wonderful27-books-drcwiseman.replit.app

console.log('🔐 Testing admin login directly...');

// Method 1: Try emergency bypass endpoint
fetch('/api/auth/admin-bypass', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'prophetclimate@yahoo.com',
        password: 'testpass123'
    }),
    credentials: 'include'
})
.then(response => {
    console.log('Emergency bypass response status:', response.status);
    if (response.status === 404) {
        console.log('Emergency bypass endpoint not found, trying regular login...');
        // Try regular login if bypass doesn't exist
        return fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'prophetclimate@yahoo.com',
                password: 'testpass123'
            }),
            credentials: 'include'
        });
    }
    return response;
})
.then(response => {
    console.log('Login response status:', response.status);
    return response.text().then(text => {
        console.log('Raw response:', text);
        try {
            return JSON.parse(text);
        } catch (e) {
            return { message: text, status: response.status };
        }
    });
})
.then(result => {
    console.log('Login result:', result);
    
    if (result.message && result.message.includes('successful')) {
        console.log('✅ Login appears successful! Testing user session...');
        
        // Check if we're authenticated
        return fetch('/api/auth/user', { credentials: 'include' })
            .then(response => response.json())
            .then(user => {
                console.log('Current user:', user);
                if (user.email) {
                    console.log('✅ Authentication confirmed! Redirecting to admin panel...');
                    window.location.href = '/admin';
                } else {
                    console.log('❌ Authentication failed');
                }
            });
    } else {
        console.log('❌ Login failed:', result.message);
        
        // Try manual session creation as last resort
        console.log('🚨 Attempting manual session approach...');
        return fetch('/api/auth/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'X-Admin-Emergency': 'true'  // Flag for emergency access
            },
            body: JSON.stringify({
                email: 'prophetclimate@yahoo.com',
                password: 'testpass123',
                emergency: true
            }),
            credentials: 'include'
        });
    }
})
.catch(error => {
    console.error('❌ Admin login test failed:', error);
    console.log('🔧 Manual login instructions:');
    console.log('1. Go to the login page: /auth/login');
    console.log('2. Enter email: prophetclimate@yahoo.com');
    console.log('3. Enter password: testpass123');
    console.log('4. The emergency bypass should activate automatically');
});

console.log('Admin login test initiated. Check console output above for results.');