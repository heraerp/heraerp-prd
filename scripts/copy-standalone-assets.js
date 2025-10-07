const fs = require('fs');
const path = require('path');

console.log('📦 Copying assets to standalone directory...');

try {
  // Copy .next/static to .next/standalone/.next/static
  const staticSource = path.join(process.cwd(), '.next/static');
  const staticDest = path.join(process.cwd(), '.next/standalone/.next/static');
  
  if (fs.existsSync(staticSource)) {
    fs.cpSync(staticSource, staticDest, { recursive: true });
    console.log('✅ Static files copied');
  }

  // Copy public to .next/standalone/public
  const publicSource = path.join(process.cwd(), 'public');
  const publicDest = path.join(process.cwd(), '.next/standalone/public');
  
  if (fs.existsSync(publicSource)) {
    fs.cpSync(publicSource, publicDest, { recursive: true });
    console.log('✅ Public files copied');
  }

  console.log('✅ Standalone build ready for deployment!');
} catch (error) {
  console.error('❌ Error copying assets:', error);
  process.exit(1);
}
