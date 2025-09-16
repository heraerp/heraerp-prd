#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Design token color mapping
const COLOR_TOKENS = {
  // Core surfaces
  body: '#37353E',
  sidebar: '#44444E',
  surfaceRaised: '#42404B',
  border: '#504E59',
  
  // Text & Icons
  textPrimary: '#E6E6EB',
  textSecondary: '#BAB9CA',
  textDisabled: '#8A889C',
  
  // Buttons
  buttonBg: '#575463',
  buttonText: '#FFFFFF',
  buttonHover: '#6B6975',
  
  // Interactive States
  hover: '#3D3B45',
  active: '#2F2D36',
  focusRing: '#BAB9CA',
  
  // Optional Accent
  accent: '#7A6FF0',
  accentText: '#FFFFFF',
  accentHover: '#6B60E6'
};

// First, let's create the CSS variables file
async function createCSSVariables() {
  const cssContent = `/* ================================
   FURNITURE MODULE - DARK THEME COLOR TOKENS
   ================================ */

/* ---- Base Layout ---- */
:root {
  /* Core surfaces */
  --color-body: ${COLOR_TOKENS.body};          /* App background */
  --color-sidebar: ${COLOR_TOKENS.sidebar};       /* Sidebar, slightly lighter */
  --color-surface-raised: ${COLOR_TOKENS.surfaceRaised}; /* Cards, modals, components */
  --color-border: ${COLOR_TOKENS.border};        /* Subtle separators */

  /* Text & Icons */
  --color-text-primary: ${COLOR_TOKENS.textPrimary};   /* Main text, headings, icons */
  --color-text-secondary: ${COLOR_TOKENS.textSecondary}; /* Muted text */
  --color-text-disabled: ${COLOR_TOKENS.textDisabled};  /* Disabled/placeholder text */

  /* Buttons */
  --color-button-bg: ${COLOR_TOKENS.buttonBg};     /* Neutral solid button background */
  --color-button-text: ${COLOR_TOKENS.buttonText};   /* Button text/icons */
  --color-button-hover: ${COLOR_TOKENS.buttonHover};  /* Hover state background */

  /* Interactive States */
  --color-hover: ${COLOR_TOKENS.hover};         /* General hover for backgrounds */
  --color-active: ${COLOR_TOKENS.active};        /* Pressed state */
  --color-focus-ring: ${COLOR_TOKENS.focusRing};    /* Focus outline */

  /* Optional Accent (e.g., CTA) */
  --color-accent: ${COLOR_TOKENS.accent};        /* Indigo accent */
  --color-accent-text: ${COLOR_TOKENS.accentText};
  --color-accent-hover: ${COLOR_TOKENS.accentHover};
}

/* Furniture-specific overrides */
.furniture-theme {
  background-color: var(--color-body);
  color: var(--color-text-primary);
}
`;
  
  await fs.writeFile('./src/styles/furniture-theme-tokens.css', cssContent, 'utf8');
  console.log('✓ Created: ./src/styles/furniture-theme-tokens.css');
}

async function updateFurnitureCSS() {
  const filePath = './src/styles/furniture-enterprise.css';
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Add import for CSS variables at the top
    if (!content.includes('@import')) {
      content = `@import './furniture-theme-tokens.css';\n\n` + content;
    }
    
    // Update sidebar to use CSS variable
    content = content.replace(
      /\.furniture-sidebar\s*{\s*background:\s*linear-gradient\([^}]+\)/,
      `.furniture-sidebar {
  background: var(--color-sidebar)`
    );
    
    // Update main background to use CSS variable
    content = content.replace(
      /\.furniture-main-bg\s*{\s*position:\s*relative;\s*background:\s*#[0-9a-fA-F]+;/,
      `.furniture-main-bg {
  position: relative;
  background: var(--color-body);`
    );
    
    // Update card styles
    content = content.replace(
      /\.furniture-card\s*{[^}]+}/,
      `.furniture-card {
  background: var(--color-surface-raised);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  box-shadow: 
    0 4px 24px rgba(0, 0, 0, 0.2),
    0 1px 2px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}`
    );
    
    await fs.writeFile(filePath, content, 'utf8');
    console.log('✓ Updated: ./src/styles/furniture-enterprise.css');
  } catch (error) {
    console.error(`Error updating CSS: ${error.message}`);
  }
}

async function updateFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let updated = false;
    const originalContent = content;
    
    // === BACKGROUND COLORS ===
    // Body/main background
    content = content.replace(/bg-\[#37353E\]/g, 'bg-[var(--color-body)]');
    content = content.replace(/bg-background(?!\/)/g, 'bg-[var(--color-body)]');
    
    // Sidebar
    content = content.replace(/bg-\[#44444E\]/g, 'bg-[var(--color-sidebar)]');
    
    // Cards/components/raised surfaces
    content = content.replace(/bg-\[#42404B\]/g, 'bg-[var(--color-surface-raised)]');
    content = content.replace(/bg-muted(?!-)/g, 'bg-[var(--color-surface-raised)]');
    content = content.replace(/bg-card/g, 'bg-[var(--color-surface-raised)]');
    
    // === TEXT COLORS ===
    // Primary text
    content = content.replace(/text-\[#E6E6EB\]/g, 'text-[var(--color-text-primary)]');
    content = content.replace(/text-\[#5a5864\]/g, 'text-[var(--color-text-primary)]');
    content = content.replace(/text-foreground/g, 'text-[var(--color-text-primary)]');
    
    // Secondary/muted text
    content = content.replace(/text-\[#BAB9CA\]/g, 'text-[var(--color-text-secondary)]');
    content = content.replace(/text-\[#6b6975\]/g, 'text-[var(--color-text-secondary)]');
    content = content.replace(/text-muted-foreground/g, 'text-[var(--color-text-secondary)]');
    
    // Disabled text
    content = content.replace(/text-\[#8A889C\]/g, 'text-[var(--color-text-disabled)]');
    
    // === BORDERS ===
    content = content.replace(/border-\[#504E59\]/g, 'border-[var(--color-border)]');
    content = content.replace(/border-border/g, 'border-[var(--color-border)]');
    content = content.replace(/border-\[#6b6975\]\/20/g, 'border-[var(--color-border)]');
    
    // === BUTTONS ===
    // Button backgrounds
    content = content.replace(/bg-\[#575463\]/g, 'bg-[var(--color-button-bg)]');
    
    // Button hover states
    content = content.replace(/hover:bg-\[#6B6975\]/g, 'hover:bg-[var(--color-button-hover)]');
    content = content.replace(/hover:bg-\[#44444E\]\/30/g, 'hover:bg-[var(--color-button-hover)]');
    
    // === HOVER STATES ===
    content = content.replace(/hover:bg-\[#3D3B45\]/g, 'hover:bg-[var(--color-hover)]');
    content = content.replace(/hover:bg-muted\/50/g, 'hover:bg-[var(--color-hover)]');
    
    // === ACTIVE STATES ===
    content = content.replace(/bg-\[#2F2D36\]/g, 'bg-[var(--color-active)]');
    
    // === FOCUS STATES ===
    content = content.replace(/ring-\[#BAB9CA\]/g, 'ring-[var(--color-focus-ring)]');
    content = content.replace(/focus:ring-\[#BAB9CA\]/g, 'focus:ring-[var(--color-focus-ring)]');
    
    // === ACCENT COLORS ===
    // Replace any remaining blue/purple with accent
    content = content.replace(/bg-\[#7A6FF0\]/g, 'bg-[var(--color-accent)]');
    content = content.replace(/text-\[#7A6FF0\]/g, 'text-[var(--color-accent)]');
    content = content.replace(/bg-blue-[0-9]+/g, 'bg-[var(--color-accent)]');
    content = content.replace(/text-blue-[0-9]+/g, 'text-[var(--color-accent)]');
    
    // === SPECIFIC COMPONENT PATTERNS ===
    // Update opacity variants
    content = content.replace(/bg-\[var\(--color-body\)\]\/70/g, 'bg-[var(--color-body)]/70');
    content = content.replace(/bg-\[var\(--color-surface-raised\)\]\/50/g, 'bg-[var(--color-surface-raised)]/50');
    
    // Update icon colors in specific contexts
    content = content.replace(/text-\[#37353E\](?=.*icon|.*Icon)/gi, 'text-[var(--color-text-primary)]');
    
    // Fix button text colors
    content = content.replace(/(?<=Button[^>]*>.*?)text-white/g, 'text-[var(--color-button-text)]');
    
    // Update specific furniture component classes
    // Cards
    if (content.includes('Card className=')) {
      content = content.replace(
        /Card className="([^"]*?)"/g,
        (match, classes) => {
          let newClasses = classes;
          // Remove old background classes
          newClasses = newClasses.replace(/bg-\[#[0-9a-fA-F]+\](?:\/\d+)?/g, '');
          newClasses = newClasses.replace(/bg-muted(?:\/\d+)?/g, '');
          newClasses = newClasses.replace(/bg-card(?:\/\d+)?/g, '');
          // Add new background
          newClasses = `bg-[var(--color-surface-raised)] border-[var(--color-border)] ${newClasses}`.trim();
          return `Card className="${newClasses}"`;
        }
      );
    }
    
    // Buttons
    if (content.includes('Button')) {
      content = content.replace(
        /<Button([^>]*?)className="([^"]*?)"([^>]*?)>/g,
        (match, before, classes, after) => {
          let newClasses = classes;
          // Check if it's a variant="ghost" or variant="outline" button
          if (match.includes('variant="ghost"') || match.includes('variant="outline"')) {
            // Ghost/outline buttons get hover states
            if (!newClasses.includes('hover:bg-')) {
              newClasses += ' hover:bg-[var(--color-hover)]';
            }
          } else if (!match.includes('variant=')) {
            // Default solid buttons
            if (!newClasses.includes('bg-')) {
              newClasses = `bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] ${newClasses}`;
            }
          }
          return `<Button${before}className="${newClasses.trim()}"${after}>`;
        }
      );
    }
    
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
    }
  }
  
  return fileList;
}

async function main() {
  console.log('Updating furniture module with design token system...\n');
  
  console.log('Color Tokens:');
  console.log('- Body: ' + COLOR_TOKENS.body);
  console.log('- Sidebar: ' + COLOR_TOKENS.sidebar);
  console.log('- Surface Raised: ' + COLOR_TOKENS.surfaceRaised);
  console.log('- Border: ' + COLOR_TOKENS.border);
  console.log('- Text Primary: ' + COLOR_TOKENS.textPrimary);
  console.log('- Text Secondary: ' + COLOR_TOKENS.textSecondary);
  console.log('- Button: ' + COLOR_TOKENS.buttonBg);
  console.log('- Accent: ' + COLOR_TOKENS.accent);
  console.log('');
  
  // Create CSS variables file
  await createCSSVariables();
  
  // Update main CSS file
  await updateFurnitureCSS();
  
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
  
  console.log(`\nCompleted! Updated ${updatedCount + 2} files total.`);
  console.log('\nNext steps:');
  console.log('1. Import the CSS variables file in your main styles');
  console.log('2. Test the theme in both light and dark modes');
  console.log('3. Adjust any specific components as needed');
}

main().catch(console.error);