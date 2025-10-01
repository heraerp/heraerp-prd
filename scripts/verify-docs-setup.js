#!/usr/bin/env node

/**
 * Script to verify developer portal setup
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

console.log('\n=== HERA Developer Portal Setup Verification ===\n');

// Check environment variables
const passwordHash = process.env.DOCS_PASSWORD_HASH;
const jwtSecret = process.env.DOCS_JWT_SECRET;

if (!passwordHash) {
  console.error('❌ DOCS_PASSWORD_HASH not found in environment');
  console.error('   Please add it to your .env.local file\n');
} else {
  console.log('✅ DOCS_PASSWORD_HASH configured');
  
  // Test password verification
  const testPassword = 'HeraDocsSecure2024!';
  const isValid = bcrypt.compareSync(testPassword, passwordHash.replace(/"/g, ''));
  
  if (isValid) {
    console.log('✅ Default password verified successfully');
    console.log('   Password: ' + testPassword);
  } else {
    console.log('⚠️  Default password does not match hash');
    console.log('   You may have set a custom password');
  }
}

if (!jwtSecret) {
  console.error('❌ DOCS_JWT_SECRET not found in environment');
  console.error('   Please add it to your .env.local file\n');
} else {
  console.log('✅ DOCS_JWT_SECRET configured');
  
  // Test JWT generation
  try {
    const token = jwt.sign({ test: true }, jwtSecret.replace(/"/g, ''), { expiresIn: '1m' });
    jwt.verify(token, jwtSecret.replace(/"/g, ''));
    console.log('✅ JWT generation and verification working');
  } catch (error) {
    console.error('❌ JWT error:', error.message);
  }
}

console.log('\n=== Access Information ===\n');
console.log('Portal URL: http://localhost:3000/docs/developer');
console.log('Login URL:  http://localhost:3000/docs/login');
console.log('\nDefault Credentials:');
console.log('Password: HeraDocsSecure2024!');
console.log('\n⚠️  Remember to change the password in production!');
console.log('\n=========================================\n');