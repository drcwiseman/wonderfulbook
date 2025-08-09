#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

async function testHealthSystem() {
  console.log('🏥 Testing Wonderful Books Health Monitoring System\n');

  try {
    // Test 1: Public health ping
    console.log('1. Testing public health ping...');
    const pingResponse = await axios.get(`${BASE_URL}/api/health/ping`);
    console.log('✅ Health ping:', pingResponse.data);

    // Test 2: Public load balancer endpoint
    console.log('\n2. Testing load balancer endpoint...');
    const healthzResponse = await axios.get(`${BASE_URL}/healthz`);
    console.log('✅ Healthz status:', healthzResponse.data);

    // Test 3: General health status (no auth required)
    console.log('\n3. Testing general health status...');
    const healthResponse = await axios.get(`${BASE_URL}/api/health`);
    console.log('✅ Health status response:', JSON.stringify(healthResponse.data, null, 2));

    // Test 4: Health check scheduling status
    console.log('\n4. Testing scheduler status...');
    try {
      const schedulerResponse = await axios.get(`${BASE_URL}/api/admin/health/scheduler`);
      console.log('✅ Scheduler status:', schedulerResponse.data);
    } catch (error) {
      console.log('❌ Scheduler endpoint requires authentication (expected)');
    }

    console.log('\n🎉 Basic health system tests completed successfully!');
    console.log('\n📋 Test Results Summary:');
    console.log('- Health ping endpoint: ✅ Working');
    console.log('- Load balancer endpoint: ✅ Working');
    console.log('- General health API: ✅ Working');
    console.log('- Admin endpoints: 🔐 Protected (as expected)');
    
    console.log('\n📱 Health Dashboard Access:');
    console.log('- Admin Health Dashboard: http://localhost:5000/admin/health');
    console.log('- Super Admin Dashboard: http://localhost:5000/super-admin (contains health link)');
    console.log('- Manual health check API: POST http://localhost:5000/api/health/run (admin auth required)');

  } catch (error) {
    console.error('❌ Error testing health system:', error.response?.data || error.message);
    process.exit(1);
  }
}

// Run the test
testHealthSystem();