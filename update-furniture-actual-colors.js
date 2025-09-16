const fs = require('fs');
const path = require('path');

// Actual color replacements needed - amber/orange to blue
const colorReplacements = {
  // Gradient replacements
  'from-amber-600/20 to-orange-600/20': 'from-[#050a30]/20 to-[#000c66]/20',
  'from-amber-600 to-orange-600': 'from-[#050a30] to-[#000c66]',
  'from-amber-700 to-orange-700': 'from-[#000c66] to-[#0000ff]',
  'from-amber-500 to-orange-500': 'from-[#000c66] to-[#7ec8e3]',
  
  // Background colors
  'bg-amber-600': 'bg-[#050a30]',
  'bg-amber-500': 'bg-[#000c66]',
  'bg-amber-400': 'bg-[#0000ff]',
  'bg-amber-500/10': 'bg-[#000c66]/10',
  'bg-amber-500/20': 'bg-[#000c66]/20',
  'bg-amber-600/10': 'bg-[#050a30]/10',
  'bg-amber-600/20': 'bg-[#050a30]/20',
  
  // Text colors
  'text-amber-600': 'text-[#050a30]',
  'text-amber-500': 'text-[#000c66]',
  'text-amber-400': 'text-[#0000ff]',
  'text-amber-300': 'text-[#7ec8e3]',
  
  // Border colors
  'border-amber-600': 'border-[#050a30]',
  'border-amber-500': 'border-[#000c66]',
  'border-amber-400': 'border-[#0000ff]',
  'border-amber-500/50': 'border-[#000c66]/50',
  
  // Hover states
  'hover:text-amber-400': 'hover:text-[#0000ff]',
  'hover:bg-amber-500': 'hover:bg-[#000c66]',
  'hover:bg-amber-600': 'hover:bg-[#050a30]',
  'hover:from-amber-700': 'hover:from-[#000c66]',
  'hover:to-orange-700': 'hover:to-[#0000ff]',
  
  // Focus states
  'focus:border-amber-400': 'focus:border-[#0000ff]',
  'focus:ring-amber-400/20': 'focus:ring-[#0000ff]/20',
  
  // Group hover states
  'group-hover:text-amber-400': 'group-hover:text-[#0000ff]',
  
  // Orange colors
  'text-orange-600': 'text-[#000c66]',
  'bg-orange-600': 'bg-[#000c66]',
  'border-orange-600': 'border-[#000c66]',
  
  // Additional specific cases
  'hover:border-amber-500/50': 'hover:border-[#000c66]/50',
  'text-foreground lg:text-amber-400': 'text-foreground lg:text-[#0000ff]',
  'text-amber-400 opacity-90': 'text-[#0000ff] opacity-90',
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
console.log('🎨 Updating furniture module colors from amber/orange to blue theme...\n');

// Update furniture app directory
const furnitureAppDir = path.join(__dirname, 'src/app/furniture');
const appCount = updateColorsInDirectory(furnitureAppDir);

// Update furniture components directory
const furnitureComponentsDir = path.join(__dirname, 'src/components/furniture');
const componentsCount = updateColorsInDirectory(furnitureComponentsDir);

console.log('\n✨ Color update complete!');
console.log(`📁 Updated ${appCount} files in app/furniture`);
console.log(`📁 Updated ${componentsCount} files in components/furniture`);
console.log('\n🎨 New color scheme applied:');
console.log('   Dark Blue: #050a30');
console.log('   Navy Blue: #000c66');
console.log('   Blue: #0000ff');
console.log('   Baby Blue: #7ec8e3');