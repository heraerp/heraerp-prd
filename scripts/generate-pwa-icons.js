// Script to generate PWA icons placeholder
// In production, use a tool like sharp or pwa-asset-generator

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create placeholder SVG icon
const createPlaceholderIcon = (size) => {
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="url(#grad${size})"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.3}px" font-weight="bold" fill="white" text-anchor="middle" dy=".3em">H</text>
</svg>`;
};

// Generate icons
iconSizes.forEach(size => {
  const svgContent = createPlaceholderIcon(size);
  const outputPath = path.join(__dirname, '..', 'public', 'icons', `icon-${size}x${size}.svg`);
  
  fs.writeFileSync(outputPath, svgContent);
  console.log(`Generated icon: icon-${size}x${size}.svg`);
});

// Create special icons
const specialIcons = {
  'badge-72x72.svg': createPlaceholderIcon(72),
  'dashboard.svg': createPlaceholderIcon(96),
  'entities.svg': createPlaceholderIcon(96),
  'transactions.svg': createPlaceholderIcon(96),
  'checkmark.svg': createPlaceholderIcon(48),
  'xmark.svg': createPlaceholderIcon(48),
};

Object.entries(specialIcons).forEach(([filename, content]) => {
  const outputPath = path.join(__dirname, '..', 'public', 'icons', filename);
  fs.writeFileSync(outputPath, content);
  console.log(`Generated special icon: ${filename}`);
});

console.log('\nNote: These are placeholder SVG icons. For production, convert to PNG format using a tool like:');
console.log('- sharp (npm install sharp)');
console.log('- pwa-asset-generator (npm install -g pwa-asset-generator)');
console.log('\nExample command:');
console.log('pwa-asset-generator logo.png ./public/icons/');