#!/usr/bin/env node

// Manual test using Resend SDK directly
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;

if (!RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY not found in environment variables');
  process.exit(1);
}

console.log('📧 Testing Resend Email Service Directly');
console.log('==========================================');
console.log(`API Key: ${RESEND_API_KEY.substring(0, 6)}...`);
console.log();

async function sendTestEmail() {
  try {
    const resend = new Resend(RESEND_API_KEY);

    console.log('📧 Sending test email to snarayana@hanaset.com...');
    
    const result = await resend.emails.send({
      from: 'HERA System <noreply@heraerp.com>',
      to: ['snarayana@hanaset.com'],
      subject: 'HERA Multi-Tenant Email Test - Direct SDK Test 🚀',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
            🎉 HERA Multi-Tenant Email Test
          </h1>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #059669; margin-top: 0;">✅ Direct SDK Test Successful!</h2>
            <p>This email was sent directly using the Resend SDK to validate the API key works.</p>
          </div>
          
          <h3 style="color: #374151;">🔧 Test Details:</h3>
          <ul style="background: #ffffff; padding: 15px; border-left: 4px solid #3b82f6;">
            <li><strong>Method:</strong> Direct Resend SDK</li>
            <li><strong>API Key:</strong> ${RESEND_API_KEY.substring(0, 6)}...</li>
            <li><strong>Organization:</strong> CivicFlow Demo Organization</li>
            <li><strong>Timestamp:</strong> ${new Date().toISOString()}</li>
          </ul>
          
          <h3 style="color: #374151;">🧬 Next Steps:</h3>
          <div style="background: #f0f9ff; padding: 15px; border-radius: 8px;">
            <p>Now that the direct SDK test works, we'll integrate this into the HERA Multi-Tenant system:</p>
            <ul>
              <li>✅ <strong>API Key Validation</strong> - Confirmed working</li>
              <li>🔄 <strong>Multi-Tenant Integration</strong> - In progress</li>
              <li>🔄 <strong>Encrypted Storage</strong> - In progress</li>
              <li>🔄 <strong>Organization Isolation</strong> - In progress</li>
            </ul>
          </div>
          
          <div style="margin-top: 30px; padding: 20px; background: #065f46; color: white; border-radius: 8px;">
            <h3 style="color: white; margin-top: 0;">🧬 HERA DNA System</h3>
            <p>This test validates that the Resend API key is working properly. The next step is to complete the multi-tenant integration.</p>
            <p><strong>6 Tables. Infinite Business Complexity. Zero Schema Changes.</strong></p>
          </div>
          
          <footer style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>Direct SDK Test via HERA Development</p>
            <p>Generated on: ${new Date().toLocaleString()}</p>
          </footer>
        </div>
      `,
      text: `HERA Multi-Tenant Email Test - Direct SDK Test

This email was sent directly using the Resend SDK to validate the API key works.

Test Details:
- Method: Direct Resend SDK  
- API Key: ${RESEND_API_KEY.substring(0, 6)}...
- Organization: CivicFlow Demo Organization
- Timestamp: ${new Date().toISOString()}

Next Steps:
✅ API Key Validation - Confirmed working
🔄 Multi-Tenant Integration - In progress
🔄 Encrypted Storage - In progress  
🔄 Organization Isolation - In progress

HERA DNA System: 6 Tables. Infinite Business Complexity. Zero Schema Changes.

Generated on: ${new Date().toLocaleString()}
      `,
      tags: [
        { name: 'test_type', value: 'direct_sdk' },
        { name: 'system', value: 'hera_development' },
        { name: 'feature', value: 'email_validation' }
      ]
    });

    if (result.error) {
      console.error('❌ Email sending failed:', result.error.message);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log(`   Message ID: ${result.data?.id}`);
    console.log(`   From: HERA System <noreply@heraerp.com>`);
    console.log(`   To: snarayana@hanaset.com`);
    console.log();
    console.log('🎉 Direct SDK email test completed successfully!');
    console.log('📧 Check snarayana@hanaset.com for the test email');
    console.log();
    console.log('📋 Next Steps:');
    console.log('   1. Fix the multi-tenant API integration');
    console.log('   2. Complete encrypted storage implementation');  
    console.log('   3. Test organization-specific email sending');

  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    if (error.message.includes('API key')) {
      console.error('🔑 Please check that your Resend API key is valid');
    }
  }
}

sendTestEmail();