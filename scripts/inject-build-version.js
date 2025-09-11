const fs = require('fs');
const path = require('path');

// Generate build version based on timestamp
const buildVersion = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
const buildDate = new Date().toISOString().split('T')[0];

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