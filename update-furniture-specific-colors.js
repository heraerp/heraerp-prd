#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Color mapping for specific UI elements
const colorMappings = {
  // Side panel - Dark Blue #050a30
  sidePanel: {
    patterns: [
      // Sidebar background colors
      /bg-\[#000c66\]/g,
      /bg-gray-900/g,
      /bg-slate-900/g,
      /bg-gray-800/g,
      /bg-slate-800/g,
      /bg-black/g
    ],
    replacement: 'bg-[#050a30]',
    context: ['sidebar', 'navigation', 'nav', 'menu']
  },
  
  // Components - Navy Blue #000c66
  components: {
    patterns: [
      // Card and component backgrounds
      /bg-\[#7ec8e3\]\/10/g,
      /bg-\[#7ec8e3\]\/20/g,
      /bg-blue-500\/10/g,
      /bg-blue-500\/20/g,
      /bg-blue-600\/10/g,
      /bg-blue-600\/20/g,
      /bg-cyan-500\/10/g,
      /bg-cyan-500\/20/g
    ],
    replacement: 'bg-[#000c66]/20',
    additionalPatterns: [
      // Text colors for components
      { pattern: /text-\[#7ec8e3\]/g, replacement: 'text-[#000c66]' },
      { pattern: /text-blue-500/g, replacement: 'text-[#000c66]' },
      { pattern: /text-blue-600/g, replacement: 'text-[#000c66]' },
      { pattern: /text-cyan-500/g, replacement: 'text-[#000c66]' },
      { pattern: /text-cyan-600/g, replacement: 'text-[#000c66]' }
    ]
  },
  
  // Buttons - Baby Blue #7ec8e3
  buttons: {
    patterns: [
      // Primary button backgrounds
      /bg-blue-500(?!\/)(?!\/)/g,
      /bg-blue-600(?!\/)(?!\/)/g,
      /bg-primary(?!\/)(?!\/)/g,
      /bg-cyan-500(?!\/)(?!\/)/g,
      /bg-cyan-600(?!\/)(?!\/)/g
    ],
    replacement: 'bg-[#7ec8e3]',
    hoverPatterns: [
      { pattern: /hover:bg-blue-600/g, replacement: 'hover:bg-[#7ec8e3]/80' },
      { pattern: /hover:bg-blue-700/g, replacement: 'hover:bg-[#7ec8e3]/80' },
      { pattern: /hover:bg-cyan-600/g, replacement: 'hover:bg-[#7ec8e3]/80' },
      { pattern: /hover:bg-cyan-700/g, replacement: 'hover:bg-[#7ec8e3]/80' }
    ],
    buttonTextPatterns: [
      { pattern: /text-white(?=.*Button)/g, replacement: 'text-[#050a30]' }
    ]
  },
  
  // Accents - Blue #0000ff
  accents: {
    patterns: [
      // Active states, links, highlights
      /text-blue-400/g,
      /text-cyan-400/g,
      /border-blue-500/g,
      /border-cyan-500/g,
      /ring-blue-500/g,
      /ring-cyan-500/g
    ],
    replacements: {
      'text-blue-400': 'text-[#0000ff]',
      'text-cyan-400': 'text-[#0000ff]',
      'border-blue-500': 'border-[#0000ff]',
      'border-cyan-500': 'border-[#0000ff]',
      'ring-blue-500': 'ring-[#0000ff]',
      'ring-cyan-500': 'ring-[#0000ff]'
    }
  }
};

async function updateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    const originalContent = content;
    
    // Check if this is a sidebar/navigation file
    const isSidebarFile = filePath.includes('Sidebar') || filePath.includes('sidebar') || 
                         filePath.includes('Navigation') || filePath.includes('navigation') ||
                         filePath.includes('Layout') || filePath.includes('layout');
    
    // Check if this is a button component
    const hasButton = content.includes('Button') || content.includes('button');
    
    // Apply side panel colors
    if (isSidebarFile) {
      colorMappings.sidePanel.patterns.forEach(pattern => {
        if (content.match(pattern)) {
          content = content.replace(pattern, colorMappings.sidePanel.replacement);
          updated = true;
        }
      });
    }
    
    // Apply component colors
    colorMappings.components.patterns.forEach(pattern => {
      if (content.match(pattern)) {
        content = content.replace(pattern, colorMappings.components.replacement);
        updated = true;
      }
    });
    
    colorMappings.components.additionalPatterns.forEach(({ pattern, replacement }) => {
      if (content.match(pattern)) {
        content = content.replace(pattern, replacement);
        updated = true;
      }
    });
    
    // Apply button colors
    if (hasButton) {
      colorMappings.buttons.patterns.forEach(pattern => {
        if (content.match(pattern)) {
          content = content.replace(pattern, colorMappings.buttons.replacement);
          updated = true;
        }
      });
      
      colorMappings.buttons.hoverPatterns.forEach(({ pattern, replacement }) => {
        if (content.match(pattern)) {
          content = content.replace(pattern, replacement);
          updated = true;
        }
      });
      
      // Update button text color for better contrast
      if (content.includes('bg-[#7ec8e3]')) {
        content = content.replace(/(<Button[^>]*className="[^"]*bg-\[#7ec8e3\][^"]*"[^>]*>)/g, (match) => {
          if (!match.includes('text-')) {
            return match.replace('className="', 'className="text-[#050a30] ');
          }
          return match;
        });
        updated = true;
      }
    }
    
    // Apply accent colors
    Object.entries(colorMappings.accents.replacements).forEach(([pattern, replacement]) => {
      const regex = new RegExp(pattern, 'g');
      if (content.match(regex)) {
        content = content.replace(regex, replacement);
        updated = true;
      }
    });
    
    // Additional specific updates for furniture module
    // Update stat card colors
    content = content.replace(/text-blue-500(?=.*stat)/gi, 'text-[#0000ff]');
    content = content.replace(/text-cyan-500(?=.*stat)/gi, 'text-[#000c66]');
    
    // Update icon colors
    content = content.replace(/text-blue-500(?=.*Icon)/g, 'text-[#000c66]');
    content = content.replace(/text-cyan-500(?=.*Icon)/g, 'text-[#000c66]');
    
    // Update badge colors
    content = content.replace(/bg-blue-500\/10(?=.*Badge)/g, 'bg-[#000c66]/10');
    content = content.replace(/text-blue-400(?=.*Badge)/g, 'text-[#0000ff]');
    
    if (content !== originalContent) {
      await fs.writeFile(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating file ${filePath}:`, error.message);
    return false;
  }
}

async function findFiles(dir, fileList = []) {
  const files = await fs.readdir(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other non-source directories
      if (!file.includes('node_modules') && !file.startsWith('.')) {
        await findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function main() {
  console.log('Updating furniture module with specific color assignments...');
  console.log('- Side panels: #050a30 (Dark Blue)');
  console.log('- Components: #000c66 (Navy Blue)');
  console.log('- Buttons: #7ec8e3 (Baby Blue)');
  console.log('- Accents: #0000ff (Blue)');
  console.log('');
  
  // Find all furniture-related files
  const furnitureDirs = [
    './src/app/furniture',
    './src/components/furniture'
  ];
  
  let allFiles = [];
  for (const dir of furnitureDirs) {
    try {
      const files = await findFiles(dir);
      allFiles = allFiles.concat(files);
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }
  }
  
  console.log(`Found ${allFiles.length} furniture files to process...`);
  
  let updatedCount = 0;
  const updatedFiles = [];
  
  for (const file of allFiles) {
    const updated = await updateFile(file);
    if (updated) {
      updatedCount++;
      updatedFiles.push(file);
      console.log(`✓ Updated: ${file}`);
    }
  }
  
  console.log(`\nCompleted! Updated ${updatedCount} files.`);
  
  if (updatedFiles.length > 0) {
    console.log('\nUpdated files:');
    updatedFiles.forEach(file => {
      console.log(`  - ${file}`);
    });
  }
}

main().catch(console.error);