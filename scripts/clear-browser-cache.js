#!/usr/bin/env node

/**
 * Clear Browser Cache Script
 * Forces browsers to reload fresh content by updating cache busting parameters
 */

const fs = require('fs');
const path = require('path');

// Update the service worker version
const updateServiceWorker = () => {
  const swPath = path.join(__dirname, '..', 'public', 'sw.js');
  const swV2Path = path.join(__dirname, '..', 'public', 'sw-v2.js');
  const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').substring(0, 14);
  
  // Update sw.js
  if (fs.existsSync(swPath)) {
    let content = fs.readFileSync(swPath, 'utf8');
    
    // Update CACHE_NAME
    content = content.replace(
      /const CACHE_NAME = 'hera-cache-v\d+'/,
      `const CACHE_NAME = 'hera-cache-v${timestamp}'`
    );
    
    // Update APP_VERSION
    content = content.replace(
      /const APP_VERSION = '\d+'/,
      `const APP_VERSION = '${timestamp}'`
    );
    
    fs.writeFileSync(swPath, content);
    console.log(`✅ Updated service worker version to: ${timestamp}`);
  }
  
  // Update sw-v2.js
  if (fs.existsSync(swV2Path)) {
    let content = fs.readFileSync(swV2Path, 'utf8');
    
    // Update CACHE_NAME
    content = content.replace(
      /const CACHE_NAME = 'hera-cache-v\d+'/,
      `const CACHE_NAME = 'hera-cache-v${timestamp}'`
    );
    
    // Update APP_VERSION
    content = content.replace(
      /const APP_VERSION = '\d+'/,
      `const APP_VERSION = '${timestamp}'`
    );
    
    fs.writeFileSync(swV2Path, content);
    console.log(`✅ Updated service worker v2 version to: ${timestamp}`);
  }
};

// Update manifest.json with cache busting
const updateManifest = () => {
  const manifestPath = path.join(__dirname, '..', 'public', 'manifest.json');
  const timestamp = Date.now();
  
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Add version query parameter to start_url
    if (manifest.start_url) {
      const baseUrl = manifest.start_url.split('?')[0];
      manifest.start_url = `${baseUrl}?v=${timestamp}`;
    }
    
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`✅ Updated manifest.json with cache busting`);
  }
};

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
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate"
          },
          {
            key: "Service-Worker-Allowed",
            value: "/"
          }
        ]
      },
      {
        source: "/sw-v2.js",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate"
          },
          {
            key: "Service-Worker-Allowed",
            value: "/"
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
updateServiceWorker();
updateManifest();
updateVercelConfig();
console.log('✨ Cache clearing complete!');