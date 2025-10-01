#!/usr/bin/env node

/**
 * Script to generate bcrypt hash for developer portal password
 * Usage: node scripts/generate-docs-password.js "your-secure-password"
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2];

if (!password) {
  console.error('\nUsage: node scripts/generate-docs-password.js "your-secure-password"\n');
  console.error('Example: node scripts/generate-docs-password.js "MySecurePassword123!"\n');
  process.exit(1);
}

// Generate salt and hash
const saltRounds = 12;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('\n=== HERA Developer Portal Password Hash ===\n');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nAdd this to your .env.local file:');
console.log(`DOCS_PASSWORD_HASH="${hash}"`);
console.log('\nOptional: Add JWT secret (recommended for production):');
console.log(`DOCS_JWT_SECRET="${require('crypto').randomBytes(32).toString('hex')}"`);
console.log('\nOptional: Add IP whitelist (comma-separated):');
console.log('DOCS_ALLOWED_IPS="123.456.789.0,987.654.321.0"');
console.log('\n===========================================\n');