#!/usr/bin/env node

/**
 * Clear Browser Cache Script
 * Forces browsers to reload fresh content by updating cache busting parameters
 */

const fs = require('fs');
const path = require('path');

// Add cache headers to vercel.json
const updateVercelConfig = () => {
  const vercelPath = path.join(__dirname, '..', 'vercel.json');
  
  const config = {
    headers: [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate"
          },
          {
            key: "Pragma",
            value: "no-cache"
          },
          {
            key: "Expires",
            value: "0"
          }
        ]
      }
    ]
  };
  
  // Merge with existing config if it exists
  if (fs.existsSync(vercelPath)) {
    const existing = JSON.parse(fs.readFileSync(vercelPath, 'utf8'));
    Object.assign(config, existing);
  }
  
  fs.writeFileSync(vercelPath, JSON.stringify(config, null, 2));
  console.log(`✅ Updated vercel.json with cache headers`);
};

// Run all updates
console.log('🔄 Clearing browser cache configurations...');
updateVercelConfig();
console.log('✨ Cache clearing complete!');