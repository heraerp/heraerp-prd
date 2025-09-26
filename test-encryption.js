#!/usr/bin/env node

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { encryptedConfigService } from './src/lib/security/encrypted-config-service.js';

const ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';
const TEST_API_KEY = 're_eEPoU337_86S6iddy6fZCJAi31Qh2wAWp';

async function testEncryption() {
  try {
    console.log('🔐 Testing encryption service...');
    console.log(`Organization ID: ${ORG_ID}`);
    console.log(`API Key: ${TEST_API_KEY.substring(0, 6)}...`);
    
    // Test storing the API key
    console.log('\n📝 Storing encrypted API key...');
    await encryptedConfigService.storeResendApiKey(ORG_ID, TEST_API_KEY);
    console.log('✅ API key stored successfully');
    
    // Test retrieving the API key
    console.log('\n📖 Retrieving encrypted API key...');
    const retrievedKey = await encryptedConfigService.getResendApiKey(ORG_ID);
    console.log(`✅ API key retrieved: ${retrievedKey?.substring(0, 6)}...`);
    
    // Verify they match
    if (retrievedKey === TEST_API_KEY) {
      console.log('✅ Encryption/decryption test passed!');
    } else {
      console.log('❌ Encryption/decryption test failed!');
      console.log(`Expected: ${TEST_API_KEY}`);
      console.log(`Got: ${retrievedKey}`);
    }
    
  } catch (error) {
    console.error('❌ Encryption test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testEncryption();