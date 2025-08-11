// Test script to verify admin access through browser simulation
console.log('Testing admin access...');

// Method 1: Test the emergency bypass endpoint
fetch('https://wonderful27-books-drcwiseman.replit.app/api/auth/admin-bypass', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
    body: JSON.stringify({
        email: 'prophetclimate@yahoo.com',
        password: 'testpass123'
    }),
    credentials: 'include'
})
.then(response => {
    console.log('Admin bypass response status:', response.status);
    return response.json();
})
.then(data => {
    console.log('Admin bypass result:', data);
    if (data.success) {
        console.log('✅ Admin bypass successful!');
        
        // Test authenticated endpoint
        return fetch('https://wonderful27-books-drcwiseman.replit.app/api/auth/user', {
            credentials: 'include'
        });
    } else {
        throw new Error('Admin bypass failed');
    }
})
.then(response => response.json())
.then(user => {
    console.log('✅ User session verified:', user);
    console.log('Admin role:', user.role);
    
    // Test admin panel access
    return fetch('https://wonderful27-books-drcwiseman.replit.app/admin', {
        credentials: 'include'
    });
})
.then(response => {
    console.log('✅ Admin panel status:', response.status);
    if (response.status === 200) {
        console.log('🎉 ADMIN ACCESS SUCCESSFUL!');
    } else {
        console.log('❌ Admin panel access failed');
    }
})
.catch(error => {
    console.error('❌ Admin access test failed:', error);
    
    // Alternative test - try regular login endpoint
    console.log('Testing regular login endpoint...');
    return fetch('https://wonderful27-books-drcwiseman.replit.app/api/auth/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: 'prophetclimate@yahoo.com',
            password: 'testpass123'
        }),
        credentials: 'include'
    });
});