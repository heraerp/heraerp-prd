#!/usr/bin/env node

// ================================================================================
// CLOUDFLARE WILDCARD SSL VERIFICATION
// Verifies that wildcard SSL is properly configured for HERA ERP subdomains
// ================================================================================

const https = require('https');
const { execSync } = require('child_process');

class WildcardSSLVerifier {
  constructor(domain = 'heraerp.com') {
    this.domain = domain;
    this.testSubdomains = [
      'test-salon',
      'demo-restaurant', 
      'sample-clinic',
      'example-store'
    ];
  }

  /**
   * Check SSL certificate for a domain
   */
  async checkSSL(hostname) {
    return new Promise((resolve) => {
      const options = {
        hostname: hostname,
        port: 443,
        path: '/',
        method: 'GET',
        rejectUnauthorized: true, // This will fail if SSL is invalid
        timeout: 10000
      };

      const req = https.request(options, (res) => {
        const cert = res.socket.getPeerCertificate();
        resolve({
          success: true,
          hostname: hostname,
          status: res.statusCode,
          ssl: {
            valid: true,
            issuer: cert.issuer?.CN || 'Unknown',
            subject: cert.subject?.CN || 'Unknown',
            validFrom: cert.valid_from,
            validTo: cert.valid_to,
            fingerprint: cert.fingerprint
          }
        });
      });

      req.on('error', (error) => {
        resolve({
          success: false,
          hostname: hostname,
          error: error.message,
          ssl: { valid: false }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          hostname: hostname,
          error: 'Connection timeout',
          ssl: { valid: false }
        });
      });

      req.end();
    });
  }

  /**
   * Test DNS resolution for subdomain
   */
  testDNS(subdomain) {
    try {
      const hostname = `${subdomain}.${this.domain}`;
      const result = execSync(`nslookup ${hostname}`, { encoding: 'utf8', timeout: 5000 });
      return {
        success: true,
        hostname: hostname,
        resolved: result.includes('Address:') || result.includes('answer:'),
        details: result.trim()
      };
    } catch (error) {
      return {
        success: false,
        hostname: `${subdomain}.${this.domain}`,
        error: error.message
      };
    }
  }

  /**
   * Check Cloudflare Universal SSL status via API
   */
  async checkCloudflareSSL(zoneId, apiToken) {
    if (!zoneId || !apiToken) {
      return { success: false, error: 'Missing Cloudflare credentials' };
    }

    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/zones/${zoneId}/ssl/universal/settings`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json'
      }
    };

    return new Promise((resolve) => {
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve({
              success: response.success,
              enabled: response.result?.enabled,
              certificate_authority: response.result?.certificate_authority
            });
          } catch (error) {
            resolve({ success: false, error: 'Failed to parse response' });
          }
        });
      });

      req.on('error', (error) => {
        resolve({ success: false, error: error.message });
      });

      req.end();
    });
  }

  /**
   * Run complete verification
   */
  async runVerification() {
    console.log('🔍 WILDCARD SSL VERIFICATION FOR HERA ERP');
    console.log('========================================\n');

    console.log(`🌐 Testing domain: ${this.domain}`);
    console.log(`🎯 Wildcard pattern: *.${this.domain}\n`);

    // Test main domain SSL
    console.log('📋 Step 1: Main Domain SSL Check');
    console.log('--------------------------------');
    const mainSSL = await this.checkSSL(this.domain);
    if (mainSSL.success) {
      console.log(`✅ ${this.domain}: SSL Valid`);
      console.log(`   Issuer: ${mainSSL.ssl.issuer}`);
      console.log(`   Valid until: ${mainSSL.ssl.validTo}`);
    } else {
      console.log(`❌ ${this.domain}: SSL Failed - ${mainSSL.error}`);
    }
    console.log('');

    // Test wildcard subdomains
    console.log('📋 Step 2: Wildcard Subdomain SSL Tests');
    console.log('--------------------------------------');
    let wildcardSuccess = 0;
    let wildcardTotal = this.testSubdomains.length;

    for (const subdomain of this.testSubdomains) {
      const hostname = `${subdomain}.${this.domain}`;
      
      // Test DNS first
      const dns = this.testDNS(subdomain);
      if (!dns.success || !dns.resolved) {
        console.log(`❌ ${hostname}: DNS resolution failed`);
        continue;
      }

      // Test SSL
      const ssl = await this.checkSSL(hostname);
      if (ssl.success && ssl.ssl.valid) {
        console.log(`✅ ${hostname}: SSL Valid`);
        wildcardSuccess++;
      } else {
        console.log(`❌ ${hostname}: SSL Failed - ${ssl.error || 'Invalid certificate'}`);
      }
    }
    console.log('');

    // Summary
    console.log('📊 VERIFICATION SUMMARY');
    console.log('=====================');
    console.log(`Main domain SSL: ${mainSSL.success ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Wildcard SSL: ${wildcardSuccess}/${wildcardTotal} subdomains valid`);
    
    const wildcardPercentage = Math.round((wildcardSuccess / wildcardTotal) * 100);
    console.log(`Success rate: ${wildcardPercentage}%`);

    if (wildcardSuccess === wildcardTotal && mainSSL.success) {
      console.log('\n🎉 WILDCARD SSL FULLY CONFIGURED!');
      console.log('✅ All subdomains will have valid SSL certificates');
      console.log('✅ HERA ERP businesses can use secure subdomains');
      console.log('✅ Ready for production salon deployments');
    } else {
      console.log('\n🚨 WILDCARD SSL NEEDS ATTENTION');
      console.log('Please check:');
      console.log('1. Cloudflare Universal SSL is enabled');
      console.log('2. _acme-challenge records are NOT proxied');
      console.log('3. SSL/TLS mode is set to "Full (strict)"');
      console.log('4. Wait 5-15 minutes for certificate generation');
    }

    // Cloudflare API check if credentials provided
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;
    
    if (zoneId && apiToken) {
      console.log('\n📋 Step 3: Cloudflare Universal SSL Status');
      console.log('------------------------------------------');
      const cfSSL = await this.checkCloudflareSSL(zoneId, apiToken);
      if (cfSSL.success) {
        console.log(`✅ Universal SSL: ${cfSSL.enabled ? 'Enabled' : 'Disabled'}`);
        console.log(`   Certificate Authority: ${cfSSL.certificate_authority || 'Unknown'}`);
      } else {
        console.log(`❌ Cloudflare API check failed: ${cfSSL.error}`);
      }
    } else {
      console.log('\n💡 TIP: Set CLOUDFLARE_ZONE_ID and CLOUDFLARE_API_TOKEN');
      console.log('   to check Universal SSL status via API');
    }

    console.log('\n' + '='.repeat(50));
    return {
      mainDomainSSL: mainSSL.success,
      wildcardSSL: wildcardSuccess === wildcardTotal,
      overallSuccess: mainSSL.success && wildcardSuccess === wildcardTotal
    };
  }
}

// CLI execution
if (require.main === module) {
  const domain = process.argv[2] || 'heraerp.com';
  const verifier = new WildcardSSLVerifier(domain);
  
  verifier.runVerification()
    .then((results) => {
      process.exit(results.overallSuccess ? 0 : 1);
    })
    .catch((error) => {
      console.error('❌ Verification failed:', error.message);
      process.exit(1);
    });
}

module.exports = WildcardSSLVerifier;