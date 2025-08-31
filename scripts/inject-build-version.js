const fs = require('fs');
const path = require('path');

// Generate build version based on timestamp
const buildVersion = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const buildDate = new Date().toISOString().split('T')[0];

// Update service worker
const swPath = path.join(__dirname, '..', 'public', 'sw.js');
let swContent = fs.readFileSync(swPath, 'utf8');

// Replace version in service worker
swContent = swContent.replace(
  /const CACHE_NAME = 'hera-cache-v[\d.]+'/,
  `const CACHE_NAME = 'hera-cache-v${buildVersion}'`
);
swContent = swContent.replace(
  /const APP_VERSION = '[\d.]+'/,
  `const APP_VERSION = '${buildVersion}'`
);

fs.writeFileSync(swPath, swContent);

// Also update sw-v2.js
const swV2Path = path.join(__dirname, '..', 'public', 'sw-v2.js');
if (fs.existsSync(swV2Path)) {
  let swV2Content = fs.readFileSync(swV2Path, 'utf8');
  swV2Content = swV2Content.replace(
    /const CACHE_NAME = 'hera-cache-v[\d.]+'/,
    `const CACHE_NAME = 'hera-cache-v${buildVersion}'`
  );
  swV2Content = swV2Content.replace(
    /const APP_VERSION = '[\d.]+'/,
    `const APP_VERSION = '${buildVersion}'`
  );
  fs.writeFileSync(swV2Path, swV2Content);
}

// Update version constants
const versionPath = path.join(__dirname, '..', 'src', 'lib', 'constants', 'version.ts');
let versionContent = fs.readFileSync(versionPath, 'utf8');

versionContent = versionContent.replace(
  /build: '[\d]+'/,
  `build: '${buildVersion}'`
);
versionContent = versionContent.replace(
  /releaseDate: '[\d-]+'/,
  `releaseDate: '${buildDate}'`
);

fs.writeFileSync(versionPath, versionContent);

console.log(`✅ Build version injected: ${buildVersion}`);
console.log(`✅ Release date: ${buildDate}`);