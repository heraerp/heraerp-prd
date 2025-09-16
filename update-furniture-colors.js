const fs = require('fs');
const path = require('path');

// Color replacements mapping
const colorReplacements = {
  // Gradient replacements
  'from-purple-600 to-pink-600': 'from-[#050a30] to-[#000c66]',
  'from-purple-700 to-pink-700': 'from-[#000c66] to-[#0000ff]',
  'from-purple-500 to-pink-500': 'from-[#000c66] to-[#7ec8e3]',
  'from-purple-600/90 to-pink-600/90': 'from-[#050a30]/90 to-[#000c66]/90',
  
  // Background colors
  'bg-purple-600': 'bg-[#050a30]',
  'bg-purple-700': 'bg-[#000c66]',
  'bg-purple-500': 'bg-[#000c66]',
  'bg-purple-400': 'bg-[#0000ff]',
  'bg-purple-500/10': 'bg-[#000c66]/10',
  'bg-purple-500/20': 'bg-[#000c66]/20',
  'bg-purple-600/10': 'bg-[#050a30]/10',
  'bg-purple-600/20': 'bg-[#050a30]/20',
  'bg-purple-900/20': 'bg-[#050a30]/20',
  
  // Text colors
  'text-purple-600': 'text-[#050a30]',
  'text-purple-500': 'text-[#000c66]',
  'text-purple-400': 'text-[#0000ff]',
  'text-purple-300': 'text-[#7ec8e3]',
  
  // Border colors
  'border-purple-600': 'border-[#050a30]',
  'border-purple-500': 'border-[#000c66]',
  'border-purple-400': 'border-[#0000ff]',
  'border-purple-500/50': 'border-[#000c66]/50',
  
  // Hover states
  'hover:bg-purple-700': 'hover:bg-[#000c66]',
  'hover:bg-purple-600': 'hover:bg-[#050a30]',
  'hover:bg-purple-500/10': 'hover:bg-[#000c66]/10',
  'hover:text-purple-400': 'hover:text-[#0000ff]',
  'hover:border-purple-400': 'hover:border-[#0000ff]',
  
  // Focus states
  'focus:border-purple-400': 'focus:border-[#0000ff]',
  'focus:ring-purple-400/20': 'focus:ring-[#0000ff]/20',
  
  // Gradient with rgba (for glassmorphism effects)
  'rgba(147, 51, 234,': 'rgba(5, 10, 48,',  // purple-600 to dark blue
  'rgba(219, 39, 119,': 'rgba(0, 12, 102,', // pink-600 to navy blue
};

// Function to update colors in a file
function updateColorsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply all color replacements
    for (const [oldColor, newColor] of Object.entries(colorReplacements)) {
      const regex = new RegExp(oldColor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldColor)) {
        content = content.replace(regex, newColor);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated colors in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and update files
function updateColorsInDirectory(dir) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (file !== 'node_modules' && file !== '.next') {
        updatedCount += updateColorsInDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (updateColorsInFile(filePath)) {
        updatedCount++;
      }
    }
  });
  
  return updatedCount;
}

// Main execution
console.log('🎨 Updating furniture module colors to dark blue theme...\n');

// Update furniture app directory
const furnitureAppDir = path.join(__dirname, 'src/app/furniture');
const appCount = updateColorsInDirectory(furnitureAppDir);

// Update furniture components directory
const furnitureComponentsDir = path.join(__dirname, 'src/components/furniture');
const componentsCount = updateColorsInDirectory(furnitureComponentsDir);

console.log('\n✨ Color update complete!');
console.log(`📁 Updated ${appCount} files in app/furniture`);
console.log(`📁 Updated ${componentsCount} files in components/furniture`);
console.log('\n🎨 New color scheme:');
console.log('   Dark Blue: #050a30');
console.log('   Navy Blue: #000c66');
console.log('   Blue: #0000ff');
console.log('   Baby Blue: #7ec8e3');