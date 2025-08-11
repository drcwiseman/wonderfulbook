#!/usr/bin/env node

import axios from 'axios';

async function testStreamlinedBypass() {
  console.log('🔧 Testing Streamlined Emergency Bypass System');
  console.log('============================================');
  
  const baseURL = 'http://localhost:5000';
  
  try {
    // Create axios instance
    const client = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'StreamlinedBypassTest/1.0'
      }
    });

    console.log('1️⃣ Testing new emergency admin endpoint...');
    const emergencyResponse = await client.post('/api/auth/admin-emergency', {
      email: 'prophetclimate@yahoo.com',
      password: 'testpass123'
    });

    console.log('✅ Emergency Access Response:', {
      success: emergencyResponse.data.success,
      message: emergencyResponse.data.message,
      userId: emergencyResponse.data.user?.id,
      emergencyAccess: emergencyResponse.data.user?.emergencyAccess
    });

    console.log('\n2️⃣ Testing session persistence after emergency access...');
    const userResponse = await client.get('/api/auth/user');
    
    console.log('✅ User Session Response:', {
      status: userResponse.status,
      authenticated: !!userResponse.data.id,
      email: userResponse.data.email,
      role: userResponse.data.role
    });

    console.log('\n3️⃣ Testing admin endpoint access...');
    try {
      const adminResponse = await client.get('/api/admin/stats');
      console.log('✅ Admin Stats Access:', {
        status: adminResponse.status,
        hasData: !!adminResponse.data
      });
    } catch (adminError) {
      console.log('❌ Admin Access Failed:', {
        status: adminError.response?.status,
        message: adminError.response?.data?.message
      });
    }

    console.log('\n4️⃣ Testing alternative emergency credentials...');
    try {
      const altResponse = await client.post('/api/auth/admin-emergency', {
        email: 'admin@wonderfulbooks.com',
        password: 'admin123'
      });
      console.log('✅ Alternative Emergency Access:', {
        success: altResponse.data.success,
        message: altResponse.data.message
      });
    } catch (altError) {
      console.log('ℹ️ Alternative Admin Account:', {
        status: altError.response?.status,
        message: altError.response?.data?.message
      });
    }

    console.log('\n🎉 Streamlined bypass system test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url
    });
  }
}

testStreamlinedBypass();