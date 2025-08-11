#!/usr/bin/env node

import axios from 'axios';

async function testProductionSessionConfig() {
  console.log('🔧 Testing Production Session Configuration');
  console.log('==========================================');
  
  const baseURL = 'http://localhost:5000';
  
  try {
    // Create axios instance with cookie jar
    const client = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ProductionSessionTest/1.0'
      }
    });

    console.log('1️⃣ Testing emergency bypass login...');
    const loginResponse = await client.post('/api/auth/login', {
      email: 'prophetclimate@yahoo.com',
      password: 'testpass123'
    });

    console.log('✅ Login Response:', {
      status: loginResponse.status,
      message: loginResponse.data.message,
      userId: loginResponse.data.user?.id
    });

    // Extract cookies from response
    const cookies = loginResponse.headers['set-cookie'];
    if (cookies) {
      console.log('🍪 Cookies set:', cookies.length, 'cookies');
      cookies.forEach((cookie, index) => {
        console.log(`   Cookie ${index + 1}:`, cookie.split(';')[0]);
      });
    }

    console.log('\n2️⃣ Testing session persistence...');
    const userResponse = await client.get('/api/auth/user');
    
    console.log('✅ User Session Response:', {
      status: userResponse.status,
      authenticated: !!userResponse.data.id,
      email: userResponse.data.email,
      role: userResponse.data.role
    });

    console.log('\n3️⃣ Testing admin route access...');
    try {
      const adminResponse = await client.get('/api/admin/stats');
      console.log('✅ Admin Access:', {
        status: adminResponse.status,
        hasStats: !!adminResponse.data
      });
    } catch (adminError) {
      console.log('❌ Admin Access Failed:', {
        status: adminError.response?.status,
        message: adminError.response?.data?.message
      });
    }

    console.log('\n🎉 Session configuration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
  }
}

testProductionSessionConfig();