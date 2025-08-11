import fetch from 'node-fetch';

console.log('🔍 Testing admin login directly...');

async function testAdminLogin() {
    const baseUrl = 'https://wonderful27-books-drcwiseman.replit.app';
    
    try {
        // Test 1: Regular login
        console.log('1. Testing regular login endpoint...');
        const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'prophetclimate@yahoo.com',
                password: 'testpass123'
            })
        });
        
        console.log('Login response status:', loginResponse.status);
        const loginText = await loginResponse.text();
        console.log('Login response:', loginText.substring(0, 200));
        
        if (loginResponse.ok) {
            const sessionCookie = loginResponse.headers.get('set-cookie');
            console.log('✅ Login successful! Session cookie:', sessionCookie);
            
            // Test 2: Check user session
            console.log('\n2. Testing user session...');
            const userResponse = await fetch(`${baseUrl}/api/auth/user`, {
                headers: {
                    'Cookie': sessionCookie
                }
            });
            
            const userData = await userResponse.json();
            console.log('User data:', JSON.stringify(userData, null, 2));
            
            // Test 3: Check admin access
            console.log('\n3. Testing admin panel access...');
            const adminResponse = await fetch(`${baseUrl}/admin`, {
                headers: {
                    'Cookie': sessionCookie
                }
            });
            
            console.log('Admin panel status:', adminResponse.status);
            if (adminResponse.ok) {
                console.log('✅ ADMIN ACCESS SUCCESSFUL!');
            } else {
                console.log('❌ Admin access denied');
            }
        } else {
            console.log('❌ Login failed');
        }
        
        // Test 4: Check if admin-test.html is accessible
        console.log('\n4. Testing admin-test.html access...');
        const testPageResponse = await fetch(`${baseUrl}/admin-test.html`);
        console.log('Admin test page status:', testPageResponse.status);
        
        if (testPageResponse.ok) {
            const content = await testPageResponse.text();
            console.log('✅ Admin test page accessible!');
            console.log('Page contains "Admin Access Verification":', content.includes('Admin Access Verification'));
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAdminLogin();