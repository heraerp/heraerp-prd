const fs = require('fs');
const path = require('path');

// Hover state replacements
const hoverReplacements = {
  // Gradient hover states
  'hover:from-purple-700 hover:to-pink-700': 'hover:from-[#000c66] hover:to-[#0000ff]',
  'hover:from-purple-600 hover:to-pink-600': 'hover:from-[#050a30] hover:to-[#000c66]',
  'hover:from-purple-500 hover:to-pink-500': 'hover:from-[#000c66] hover:to-[#7ec8e3]',
  
  // Any remaining purple references
  'from-purple': 'from-[#000c66]',
  'to-pink': 'to-[#0000ff]',
  'bg-purple': 'bg-[#000c66]',
  'text-purple': 'text-[#000c66]',
  'border-purple': 'border-[#000c66]',
  
  // Specific remaining cases
  'hover:from-amber-700 hover:to-orange-700': 'hover:from-[#050a30] hover:to-[#000c66]',
  'from-amber-600 to-orange-600': 'from-[#050a30] to-[#000c66]',
};

// Function to update hover states in a file
function updateHoverStatesInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply all replacements
    for (const [oldState, newState] of Object.entries(hoverReplacements)) {
      const regex = new RegExp(oldState.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      if (content.includes(oldState)) {
        content = content.replace(regex, newState);
        updated = true;
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Updated hover states in: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

// Function to recursively find and update files
function updateHoverStatesInDirectory(dir) {
  const files = fs.readdirSync(dir);
  let updatedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and .next directories
      if (file !== 'node_modules' && file !== '.next') {
        updatedCount += updateHoverStatesInDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      if (updateHoverStatesInFile(filePath)) {
        updatedCount++;
      }
    }
  });
  
  return updatedCount;
}

// Main execution
console.log('🎨 Updating furniture module hover states to blue theme...\n');

// Update furniture app directory
const furnitureAppDir = path.join(__dirname, 'src/app/furniture');
const appCount = updateHoverStatesInDirectory(furnitureAppDir);

// Update furniture components directory
const furnitureComponentsDir = path.join(__dirname, 'src/components/furniture');
const componentsCount = updateHoverStatesInDirectory(furnitureComponentsDir);

console.log('\n✨ Hover state update complete!');
console.log(`📁 Updated ${appCount} files in app/furniture`);
console.log(`📁 Updated ${componentsCount} files in components/furniture`);
console.log('\n🎨 All hover states now use the blue theme!');