#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Color mappings from hardcoded to semantic
const colorMappings = {
  // Backgrounds
  'bg-white': 'bg-background',
  'bg-slate-900': 'bg-background',
  'bg-gray-900': 'bg-background',
  'bg-gray-50': 'bg-muted',
  'bg-gray-100': 'bg-muted',
  'bg-gray-800': 'bg-muted',
  'bg-slate-800': 'bg-muted',
  'bg-gray-700': 'bg-muted-foreground/10',
  'bg-black': 'bg-background',
  
  // Background with opacity
  'bg-white/80': 'bg-background/80',
  'bg-white/70': 'bg-background/70',
  'bg-white/60': 'bg-card/60',
  'bg-white/50': 'bg-card/50',
  'bg-white/20': 'bg-card/20',
  'bg-white/10': 'bg-card/10',
  'bg-white/5': 'bg-card/5',
  'bg-slate-900/80': 'bg-background/80',
  'bg-gray-900/80': 'bg-background/80',
  'bg-gray-900/70': 'bg-card/70',
  'bg-gray-900/50': 'bg-card/50',
  'bg-gray-800/50': 'bg-card/50',
  'bg-gray-800/30': 'bg-muted/30',
  'bg-gray-800/70': 'bg-card/70',
  'bg-gray-800/20': 'bg-muted/20',
  'bg-slate-800/60': 'bg-card/60',
  'bg-slate-800/50': 'bg-muted/50',
  'bg-gray-600/20': 'bg-muted-foreground/20',
  'bg-gray-100/50': 'bg-muted/50',
  'bg-black/60': 'bg-background/60',
  'bg-black/70': 'bg-background/70',
  
  // Borders
  'border-slate-200': 'border-border',
  'border-slate-700': 'border-border',
  'border-gray-700': 'border-border',
  'border-gray-600': 'border-border',
  'border-gray-200': 'border-border',
  'border-gray-300': 'border-border',
  'border-slate-300': 'border-input',
  'border-slate-600': 'border-input',
  'border-gray-700/50': 'border-border/50',
  'border-gray-600/50': 'border-border/50',
  'border-gray-300/50': 'border-border/50',
  'border-gray-700/30': 'border-border/30',
  'border-gray-100/50': 'border-border/50',
  'border-white/20': 'border-border/20',
  'border-white/10': 'border-border/10',
  
  // Text
  'text-white': 'text-foreground',
  'text-slate-900': 'text-foreground',
  'text-gray-400': 'text-muted-foreground',
  'text-gray-500': 'text-muted-foreground',
  'text-gray-600': 'text-muted-foreground',
  'text-slate-600': 'text-muted-foreground',
  'text-slate-400': 'text-muted-foreground',
  'text-blue-600': 'text-primary',
  'text-white/60': 'text-muted-foreground',
  'placeholder:text-white/60': 'placeholder:text-muted-foreground',
  
  // Hover states
  'hover:bg-gray-700': 'hover:bg-accent',
  'hover:bg-gray-800/70': 'hover:bg-accent/70',
  'hover:bg-gray-750': 'hover:bg-accent',
  'hover:bg-gray-50': 'hover:bg-muted',
  'hover:bg-gray-800': 'hover:bg-muted',
  'hover:bg-white/20': 'hover:bg-accent/20',
  'hover:bg-blue-50': 'hover:bg-primary/10',
  'hover:text-blue-700': 'hover:text-primary',
  'hover:text-gray-900': 'hover:text-foreground',
  'hover:text-gray-700': 'hover:text-foreground',
  'hover:border-blue-500/50': 'hover:border-primary/50',
  
  // Special cases for dark mode
  'dark:bg-slate-900': 'dark:bg-background',
  'dark:bg-slate-800': 'dark:bg-muted',
  'dark:bg-gray-900': 'dark:bg-background',
  'dark:bg-gray-800': 'dark:bg-muted',
  'dark:bg-gray-900/70': 'dark:bg-background/70',
  'dark:bg-gray-800/20': 'dark:bg-muted/20',
  'dark:bg-slate-800/50': 'dark:bg-muted/50',
  'dark:bg-slate-800/60': 'dark:bg-card/60',
  'dark:bg-slate-900/80': 'dark:bg-background/80',
  'dark:bg-black/60': 'dark:bg-background/60',
  'dark:bg-black/70': 'dark:bg-background/70',
  'dark:border-slate-700': 'dark:border-border',
  'dark:border-slate-600': 'dark:border-input',
  'dark:border-gray-600/50': 'dark:border-border/50',
  'dark:hover:bg-gray-800': 'dark:hover:bg-muted',
  'dark:hover:bg-gray-800/20': 'dark:hover:bg-muted/20',
  'dark:hover:border-blue-400/50': 'dark:hover:border-primary/50',
  'dark:text-slate-200': 'dark:text-foreground',
  'dark:text-slate-400': 'dark:text-muted-foreground',
  'dark:text-white': 'dark:text-foreground',
  'dark:text-gray-100': 'dark:text-foreground',
  'dark:text-gray-400': 'dark:text-muted-foreground',
  'dark:text-gray-600': 'dark:text-muted-foreground'
};

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Apply mappings
  for (const [hardcoded, semantic] of Object.entries(colorMappings)) {
    const regex = new RegExp(`\\b${hardcoded.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, semantic);
      hasChanges = true;
    }
  }
  
  // Special patterns that need more complex replacement
  const specialPatterns = [
    // Fix compound classes like "data-[state=active]:bg-gray-700"
    {
      pattern: /data-\[state=active\]:bg-gray-700/g,
      replacement: 'data-[state=active]:bg-accent'
    },
    // Fix placeholder colors
    {
      pattern: /placeholder:text-gray-400/g,
      replacement: 'placeholder:text-muted-foreground'
    }
  ];
  
  for (const { pattern, replacement } of specialPatterns) {
    if (content.match(pattern)) {
      content = content.replace(pattern, replacement);
      hasChanges = true;
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${filePath}`);
    return true;
  }
  
  return false;
}

// Get list of staged files
const stagedFiles = require('child_process')
  .execSync('git diff --cached --name-only --diff-filter=ACM', { encoding: 'utf8' })
  .split('\n')
  .filter(file => file && (file.endsWith('.tsx') || file.endsWith('.jsx')))
  .map(file => path.resolve(file));

if (stagedFiles.length === 0) {
  console.log('No staged TSX/JSX files to process');
  process.exit(0);
}

console.log(`🔧 Fixing semantic colors in ${stagedFiles.length} staged files...`);

let fixedCount = 0;
for (const file of stagedFiles) {
  if (fs.existsSync(file)) {
    if (fixFile(file)) {
      fixedCount++;
    }
  }
}

if (fixedCount > 0) {
  console.log(`\n✨ Fixed ${fixedCount} files with semantic colors`);
  console.log('📝 Re-staging fixed files...');
  
  // Re-stage the fixed files
  require('child_process').execSync(`git add ${stagedFiles.join(' ')}`, { stdio: 'inherit' });
  
  console.log('✅ Done! You can now commit your changes.');
} else {
  console.log('✅ No hardcoded colors found in staged files');
}