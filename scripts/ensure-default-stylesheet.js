const fs = require('fs');
const path = require('path');

const dir = path.join('.next','browser');
const css = path.join(dir, 'default-stylesheet.css');

try {
  fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(css)) {
    fs.writeFileSync(css, `/* fallback stylesheet injected to satisfy docs collector */\n`);
  }
  console.log('✅ Ensured', css);
} catch (e) {
  console.error('⚠️ Could not ensure default-stylesheet.css:', e);
  process.exit(0); // don't fail the build if this is flaky
}