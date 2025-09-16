#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Color scheme
const COLORS = {
  sidebar: '#44444E',
  body: '#37353E',
  components: '#37353E',
  buttonIcon: '#37353E',
  text: '#5a5864', // Lighter shade of #37353E
  textLight: '#6b6975', // Even lighter for muted text
  textDark: '#2a282f' // Darker for emphasis
};

async function updateCSS(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    
    // Update sidebar background
    if (content.includes('.furniture-sidebar {')) {
      content = content.replace(
        /\.furniture-sidebar\s*{\s*background:\s*linear-gradient\([^}]+\)/,
        `.furniture-sidebar {
  background: linear-gradient(180deg, 
    ${COLORS.sidebar} 0%, 
    ${COLORS.sidebar} 100%
  )`
      );
      updated = true;
    }
    
    // Update main background
    if (content.includes('.furniture-main-bg {')) {
      content = content.replace(
        /\.furniture-main-bg\s*{\s*position:\s*relative;\s*background:\s*#[0-9a-fA-F]+;/,
        `.furniture-main-bg {
  position: relative;
  background: ${COLORS.body};`
      );
      updated = true;
    }
    
    if (updated) {
      await fs.writeFile(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error updating CSS file ${filePath}:`, error.message);
    return false;
  }
}

async function updateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    const originalContent = content;
    
    // Update background colors
    // Replace dark backgrounds with body color
    content = content.replace(/bg-background(?!\/)/g, `bg-[${COLORS.body}]`);
    content = content.replace(/bg-muted(?!-)/g, `bg-[${COLORS.components}]`);
    content = content.replace(/bg-card/g, `bg-[${COLORS.components}]`);
    
    // Update text colors to lighter shades
    content = content.replace(/text-foreground/g, `text-[${COLORS.text}]`);
    content = content.replace(/text-muted-foreground/g, `text-[${COLORS.textLight}]`);
    
    // Update button colors
    // Remove blue button colors and make them gray
    content = content.replace(/bg-\[#7ec8e3\]/g, `bg-[${COLORS.components}]`);
    content = content.replace(/hover:bg-\[#7ec8e3\]\/80/g, `hover:bg-[${COLORS.sidebar}]`);
    
    // Update icon colors in buttons to buttonIcon color
    content = content.replace(/className="h-[0-9]+ w-[0-9]+ text-\[#[0-9a-fA-F]+\]"/g, (match) => {
      if (match.includes('text-')) {
        return match.replace(/text-\[#[0-9a-fA-F]+\]/, `text-[${COLORS.buttonIcon}]`);
      }
      return match;
    });
    
    // Update navy blue components to gray
    content = content.replace(/bg-\[#000c66\]\/20/g, `bg-[${COLORS.components}]/20`);
    content = content.replace(/bg-\[#000c66\]\/10/g, `bg-[${COLORS.components}]/10`);
    content = content.replace(/text-\[#000c66\]/g, `text-[${COLORS.text}]`);
    
    // Update blue accents to gray
    content = content.replace(/text-\[#0000ff\]/g, `text-[${COLORS.textLight}]`);
    content = content.replace(/border-\[#0000ff\]/g, `border-[${COLORS.textLight}]`);
    
    // Update any remaining blue colors to gray theme
    content = content.replace(/text-blue-[0-9]+/g, `text-[${COLORS.text}]`);
    content = content.replace(/bg-blue-[0-9]+/g, `bg-[${COLORS.components}]`);
    content = content.replace(/border-blue-[0-9]+/g, `border-[${COLORS.textLight}]`);
    
    // Update cyan colors to gray
    content = content.replace(/text-cyan-[0-9]+/g, `text-[${COLORS.text}]`);
    content = content.replace(/bg-cyan-[0-9]+/g, `bg-[${COLORS.components}]`);
    
    // Update specific UI elements
    // Cards and surfaces
    content = content.replace(/bg-muted\/50/g, `bg-[${COLORS.components}]/50`);
    content = content.replace(/bg-muted\/70/g, `bg-[${COLORS.components}]/70`);
    content = content.replace(/bg-background\/70/g, `bg-[${COLORS.body}]/70`);
    content = content.replace(/bg-background\/50/g, `bg-[${COLORS.body}]/50`);
    
    // Borders
    content = content.replace(/border-border/g, `border-[${COLORS.textLight}]/20`);
    
    // Hover states
    content = content.replace(/hover:bg-muted-foreground\/10/g, `hover:bg-[${COLORS.sidebar}]/30`);
    content = content.replace(/hover:text-foreground/g, `hover:text-[${COLORS.textLight}]`);
    
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
      if (!file.includes('node_modules') && !file.startsWith('.')) {
        await findFiles(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    } else if (file.endsWith('.css')) {
      fileList.push(filePath);
    }
  }
  
  return fileList;
}

async function main() {
  console.log('Updating furniture module to gray theme...');
  console.log('- Sidebar: ' + COLORS.sidebar);
  console.log('- Body: ' + COLORS.body);
  console.log('- Components: ' + COLORS.components);
  console.log('- Button Icons: ' + COLORS.buttonIcon);
  console.log('- Text: ' + COLORS.text);
  console.log('- Light Text: ' + COLORS.textLight);
  console.log('');
  
  // Update CSS file first
  console.log('Updating CSS files...');
  const cssUpdated = await updateCSS('./src/styles/furniture-enterprise.css');
  if (cssUpdated) {
    console.log('✓ Updated: ./src/styles/furniture-enterprise.css');
  }
  
  // Find all furniture-related files
  const furnitureDirs = [
    './src/app/furniture',
    './src/components/furniture'
  ];
  
  let allFiles = [];
  for (const dir of furnitureDirs) {
    try {
      const files = await findFiles(dir);
      allFiles = allFiles.concat(files.filter(f => f.endsWith('.tsx') || f.endsWith('.ts')));
    } catch (error) {
      console.error(`Error reading directory ${dir}:`, error.message);
    }
  }
  
  console.log(`\nFound ${allFiles.length} furniture files to process...`);
  
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
  
  console.log(`\nCompleted! Updated ${updatedCount + (cssUpdated ? 1 : 0)} files total.`);
}

main().catch(console.error);