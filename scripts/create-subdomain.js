#!/usr/bin/env node

// ================================================================================
// CLOUDFLARE SUBDOMAIN CREATOR FOR HERA ERP
// Automatically creates subdomains for new business deployments
// ================================================================================

const https = require('https');

class CloudflareSubdomainManager {
  constructor(config) {
    this.zoneId = config.zoneId || process.env.CLOUDFLARE_ZONE_ID;
    this.apiToken = config.apiToken || process.env.CLOUDFLARE_API_TOKEN;
    this.domain = config.domain || 'heraerp.com';
    this.target = config.target || 'heraerp-production.up.railway.app';
  }

  /**
   * Create a new subdomain for a business
   * @param {string} subdomain - The subdomain name (e.g., 'marinas-salon')
   * @returns {Promise<Object>} Cloudflare API response
   */
  async createSubdomain(subdomain) {
    const data = JSON.stringify({
      type: 'CNAME',
      name: subdomain,
      content: this.target,
      ttl: 1, // Auto
      proxied: true // Enable Cloudflare proxy
    });

    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/zones/${this.zoneId}/dns_records`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Length': data.length
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          const response = JSON.parse(responseData);
          if (response.success) {
            console.log(`✅ Subdomain created: ${subdomain}.${this.domain}`);
            resolve(response);
          } else {
            console.error(`❌ Failed to create subdomain: ${response.errors}`);
            reject(response);
          }
        });
      });

      req.on('error', (error) => {
        console.error(`❌ Request failed: ${error.message}`);
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  /**
   * Create wildcard subdomain for all businesses
   * @returns {Promise<Object>} Cloudflare API response
   */
  async createWildcardSubdomain() {
    return this.createSubdomain('*');
  }

  /**
   * List all existing subdomains
   * @returns {Promise<Array>} List of DNS records
   */
  async listSubdomains() {
    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/zones/${this.zoneId}/dns_records?type=CNAME`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`
      }
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          const response = JSON.parse(responseData);
          if (response.success) {
            console.log(`📋 Found ${response.result.length} subdomains`);
            response.result.forEach(record => {
              console.log(`  - ${record.name}`);
            });
            resolve(response.result);
          } else {
            reject(response);
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  /**
   * Generate subdomain from business name
   * @param {string} businessName - The business name
   * @returns {string} Valid subdomain
   */
  generateSubdomain(businessName) {
    return businessName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 20);
  }
}

// ================================================================================
// CLI Usage
// ================================================================================

if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0];
  
  // Initialize manager
  const manager = new CloudflareSubdomainManager({
    zoneId: process.env.CLOUDFLARE_ZONE_ID,
    apiToken: process.env.CLOUDFLARE_API_TOKEN
  });

  switch (command) {
    case 'create':
      const businessName = args[1];
      if (!businessName) {
        console.error('❌ Please provide a business name');
        process.exit(1);
      }
      const subdomain = manager.generateSubdomain(businessName);
      manager.createSubdomain(subdomain)
        .then(() => {
          console.log(`🌐 URL: https://${subdomain}.heraerp.com`);
        })
        .catch(console.error);
      break;

    case 'wildcard':
      manager.createWildcardSubdomain()
        .then(() => {
          console.log('🌐 Wildcard subdomain created: *.heraerp.com');
        })
        .catch(console.error);
      break;

    case 'list':
      manager.listSubdomains()
        .catch(console.error);
      break;

    default:
      console.log(`
HERA ERP Subdomain Manager
==========================

Usage:
  node create-subdomain.js create "Business Name"  - Create subdomain for business
  node create-subdomain.js wildcard               - Create wildcard subdomain
  node create-subdomain.js list                   - List all subdomains

Environment Variables Required:
  CLOUDFLARE_ZONE_ID    - Your Cloudflare Zone ID
  CLOUDFLARE_API_TOKEN  - Your Cloudflare API Token

Examples:
  node create-subdomain.js create "Marina's Salon"
  # Creates: marinas-salon.heraerp.com

  node create-subdomain.js wildcard
  # Creates: *.heraerp.com (handles all subdomains)
      `);
  }
}

module.exports = CloudflareSubdomainManager;