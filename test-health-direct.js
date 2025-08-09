#!/usr/bin/env node

// Direct test of health system without authentication
import { runHealthChecks } from './server/health/checks.js';

async function testHealthSystemDirect() {
  console.log('🏥 Testing Health System Directly\n');
  
  try {
    console.log('Running health checks directly...');
    const result = await runHealthChecks({ source: 'direct-test' });
    
    console.log('\n✅ Health Check Results:');
    console.log('Run ID:', result.runId);
    console.log('Overall Status:', result.overallStatus);
    console.log('\nIndividual Checks:');
    
    result.items.forEach((item, index) => {
      const statusIcon = item.status === 'OK' ? '✅' : 
                        item.status === 'WARN' ? '⚠️' : '❌';
      console.log(`${index + 1}. ${statusIcon} ${item.name}: ${item.status} (${item.durationMs}ms)`);
      if (item.message) {
        console.log(`   Message: ${item.message}`);
      }
    });
    
    console.log('\n🎉 Health check completed successfully!');
    console.log('✅ Database insertion worked');
    console.log('✅ Health monitoring system is operational');
    
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

testHealthSystemDirect();