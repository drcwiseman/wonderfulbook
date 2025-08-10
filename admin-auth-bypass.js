// Emergency Admin Authentication Bypass Script
import bcrypt from 'bcryptjs';

// Test different hash approaches
async function testAuthentication() {
  const testPassword = 'testpass123';
  
  // Generate multiple hashes with different approaches
  const hashes = [
    bcrypt.hashSync(testPassword, 12),
    await bcrypt.hash(testPassword, 12),
    bcrypt.hashSync(testPassword, 10),
    await bcrypt.hash(testPassword, 10)
  ];
  
  console.log('Generated hashes for password "testpass123":');
  hashes.forEach((hash, index) => {
    console.log(`Hash ${index + 1}: ${hash}`);
    console.log(`Verification ${index + 1}: ${bcrypt.compareSync(testPassword, hash)}`);
    console.log('---');
  });
  
  // Return the first working hash
  return hashes[0];
}

testAuthentication().then(workingHash => {
  console.log('\nUse this working hash in database:');
  console.log(`UPDATE users SET password_hash = '${workingHash}' WHERE email = 'prophetclimate@yahoo.com';`);
}).catch(console.error);