#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

/**
 * Apply enterprise styling classes to furniture pages
 */

// Style class mappings for enterprise look
const enterpriseClasses = {
  // Card upgrades
  'className="bg-muted rounded-lg p-': 'className="furniture-card rounded-lg p-',
  'className="bg-muted/50 rounded-lg p-': 'className="furniture-card rounded-lg p-',
  'className="rounded-lg border bg-card': 'className="furniture-card rounded-lg',
  'className="border rounded-lg p-': 'className="furniture-card rounded-lg p-',
  
  // Stat card upgrades
  'className="bg-muted rounded-lg p-6"': 'className="furniture-stat-card rounded-lg p-6"',
  'className="bg-muted rounded-lg p-4"': 'className="furniture-stat-card rounded-lg p-4"',
  'className="bg-muted/50 rounded-lg p-6"': 'className="furniture-stat-card rounded-lg p-6"',
  'className="bg-muted/50 rounded-lg p-4"': 'className="furniture-stat-card rounded-lg p-4"',
  
  // Table upgrades
  '<table className="min-w-full': '<table className="furniture-table min-w-full',
  '<table className="w-full': '<table className="furniture-table w-full',
  'className="overflow-x-auto"': 'className="overflow-x-auto furniture-scrollbar"',
  
  // Button upgrades for primary actions
  'variant="default"': 'variant="default" className="furniture-btn-premium"',
  
  // Floating elements
  'className="fixed bottom-4 right-4': 'className="furniture-floating fixed bottom-4 right-4',
  
  // Modal upgrades
  'className="fixed inset-0 z-50 flex items-center justify-center': 'className="fixed inset-0 z-50 flex items-center justify-center furniture-modal-glass"',
};

// Special handling for specific patterns
const specialPatterns = [
  {
    // Grid stat cards
    pattern: /<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">\s*{\s*stats\.map/g,
    replacement: '<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">\n        {stats.map',
    followUp: (content) => {
      // Find stat card divs within this grid and add furniture-stat-card class
      return content.replace(
        /(<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">[\s\S]*?stats\.map[\s\S]*?)className="bg-muted rounded-lg p-6"/g,
        '$1className="furniture-stat-card rounded-lg p-6"'
      );
    }
  },
  {
    // Add glow effects to important numbers
    pattern: /<p className="text-3xl font-bold text-orange-500">/g,
    replacement: '<p className="text-3xl font-bold text-orange-500 furniture-glow-amber">',
  },
  {
    // Add glow to purple accents
    pattern: /<p className="text-3xl font-bold text-purple-500">/g,
    replacement: '<p className="text-3xl font-bold text-purple-500 furniture-glow-purple">',
  }
];

async function processFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let modified = false;
    const originalContent = content;

    // Apply basic class replacements
    for (const [search, replace] of Object.entries(enterpriseClasses)) {
      if (content.includes(search)) {
        content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), replace);
        modified = true;
      }
    }

    // Apply special patterns
    for (const special of specialPatterns) {
      if (special.pattern.test(content)) {
        content = content.replace(special.pattern, special.replacement);
        if (special.followUp) {
          content = special.followUp(content);
        }
        modified = true;
      }
    }

    // Save if modified
    if (modified) {
      await fs.writeFile(filePath, content);
      console.log(`✅ Updated: ${path.basename(filePath)}`);
      
      // Show some changes
      const changes = [];
      if (originalContent.includes('bg-muted rounded-lg')) changes.push('cards → furniture-card');
      if (originalContent.includes('<table className="')) changes.push('tables → furniture-table');
      if (originalContent.includes('variant="default"')) changes.push('buttons → premium style');
      
      if (changes.length > 0) {
        console.log(`   Changes: ${changes.join(', ')}`);
      }
    } else {
      console.log(`⏭️  Skipped: ${path.basename(filePath)} (no changes needed)`);
    }

    return modified;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Applying Enterprise Styling to Furniture Module\n');

  // Get all furniture page files
  const furnitureDir = path.join(process.cwd(), 'src/app/furniture');
  const componentDir = path.join(process.cwd(), 'src/components/furniture');
  
  const directories = [furnitureDir, componentDir];
  let totalFiles = 0;
  let updatedFiles = 0;

  for (const dir of directories) {
    console.log(`\n📁 Processing ${path.relative(process.cwd(), dir)}:`);
    
    try {
      const files = await fs.readdir(dir, { recursive: true });
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile() && (file.endsWith('.tsx') || file.endsWith('.jsx'))) {
          totalFiles++;
          if (await processFile(filePath)) {
            updatedFiles++;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error reading directory ${dir}:`, error.message);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✨ Enterprise Styling Applied!`);
  console.log(`📊 Updated ${updatedFiles} out of ${totalFiles} files`);
  console.log('='.repeat(60));
  
  console.log('\n💡 Enterprise features added:');
  console.log('   • Glass morphism cards with depth');
  console.log('   • Multi-layered shadows');
  console.log('   • Gradient backgrounds');
  console.log('   • Premium button styles');
  console.log('   • Enhanced table styling');
  console.log('   • Glow effects on key metrics');
  console.log('   • Subtle grid pattern overlay');
}

main().catch(console.error);