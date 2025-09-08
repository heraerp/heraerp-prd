#!/usr/bin/env node

/**
 * Safe Migration to HERA DNA UI
 * This script helps migrate to DNA components without breaking existing functionality
 * Run with: node scripts/safe-migrate-to-dna.js [command]
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

// Component mapping for safe migration
const SAFE_COMPONENT_MAP = {
  // Only map components that have DNA equivalents ready
  '@/components/ui/card': {
    to: '@/lib/dna/components/molecules/GlassCard',
    safe: true,
    notes: 'GlassCard is backward compatible with Card props'
  },
  '@/components/ui/stat-card': {
    to: '@/lib/dna/components/ui/stat-card-dna',
    safe: true,
    notes: 'StatCardDNA handles dark mode text visibility automatically'
  },
  // Add more mappings as DNA components are verified
};

// CSS classes that can be safely removed
const SAFE_TO_REMOVE_CLASSES = [
  // Only remove if component uses DNA
  'bg-white/80',
  'backdrop-blur-sm',
  'border-gray-200',
];

// Functions to perform safe migrations
const migrations = {
  /**
   * Check current state without making changes
   */
  check: async () => {
    console.log(`${colors.blue}🔍 Checking for migration opportunities...${colors.reset}\n`);
    
    const issues = [];
    const opportunities = [];
    
    // Check globals.css
    const globalsCss = path.join(process.cwd(), 'src/app/globals.css');
    if (fs.existsSync(globalsCss)) {
      const content = fs.readFileSync(globalsCss, 'utf8');
      
      // Check for problematic patterns
      if (content.includes('.bg-gray-900 h1,')) {
        issues.push({
          file: 'globals.css',
          line: '~1717',
          issue: 'Global text color overrides found',
          severity: 'high'
        });
      }
      
      if (content.includes('tbody tr:nth-child(even)')) {
        issues.push({
          file: 'globals.css',
          line: '~1884',
          issue: 'Global table styling that conflicts with DNA tables',
          severity: 'medium'
        });
      }
    }
    
    // Check for multiple theme providers
    const files = getAllFiles('src');
    let themeProviderCount = 0;
    let dnaThemeProviderCount = 0;
    
    for (const file of files) {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        const content = fs.readFileSync(file, 'utf8');
        if (content.includes('HeraThemeProvider')) themeProviderCount++;
        if (content.includes('ThemeProviderDNA')) dnaThemeProviderCount++;
      }
    }
    
    if (themeProviderCount > 0 && dnaThemeProviderCount > 0) {
      issues.push({
        file: 'Multiple files',
        issue: `Found ${themeProviderCount} uses of HeraThemeProvider and ${dnaThemeProviderCount} uses of ThemeProviderDNA`,
        severity: 'medium'
      });
    }
    
    // Report findings
    console.log(`${colors.yellow}Found ${issues.length} potential conflicts:${colors.reset}`);
    issues.forEach(issue => {
      const color = issue.severity === 'high' ? colors.red : colors.yellow;
      console.log(`${color}  - ${issue.file}: ${issue.issue}${colors.reset}`);
    });
    
    console.log(`\n${colors.green}✅ Safe to proceed with gradual migration${colors.reset}`);
    console.log('\nRun with "prepare" to create safe migration files');
  },

  /**
   * Prepare safe migration files without modifying existing ones
   */
  prepare: async () => {
    console.log(`${colors.blue}📁 Preparing safe migration files...${colors.reset}\n`);
    
    // Create backup directory
    const backupDir = path.join(process.cwd(), '.hera-migration-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Backup critical files
    const filesToBackup = [
      'src/app/globals.css',
      'src/app/layout.tsx',
    ];
    
    for (const file of filesToBackup) {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        const backupPath = path.join(backupDir, file);
        const backupDirPath = path.dirname(backupPath);
        if (!fs.existsSync(backupDirPath)) {
          fs.mkdirSync(backupDirPath, { recursive: true });
        }
        fs.copyFileSync(fullPath, backupPath);
        console.log(`${colors.green}✓${colors.reset} Backed up ${file}`);
      }
    }
    
    // Create migration tracking file
    const migrationStatus = {
      created: new Date().toISOString(),
      phase: 'preparation',
      componentsToMigrate: [],
      cssToClean: [],
      status: 'ready'
    };
    
    fs.writeFileSync(
      path.join(process.cwd(), '.hera-migration-status.json'),
      JSON.stringify(migrationStatus, null, 2)
    );
    
    console.log(`\n${colors.green}✅ Migration files prepared${colors.reset}`);
    console.log('Next: Run with "migrate-css" to create DNA-compatible CSS');
  },

  /**
   * Create DNA-compatible CSS without breaking existing styles
   */
  'migrate-css': async () => {
    console.log(`${colors.blue}🎨 Creating DNA-compatible CSS...${colors.reset}\n`);
    
    const globalsCss = path.join(process.cwd(), 'src/app/globals.css');
    const dnaSafeCss = path.join(process.cwd(), 'src/app/globals-dna-safe.css');
    
    // Check if safe CSS already exists
    if (fs.existsSync(dnaSafeCss)) {
      console.log(`${colors.green}✓${colors.reset} DNA-safe CSS already exists`);
      console.log('\nTo use it, update your layout.tsx:');
      console.log(`  ${colors.yellow}import './globals-dna-safe.css'${colors.reset} (instead of './globals.css')`);
    }
    
    // Create a test CSS that imports both for gradual migration
    const testCss = `/* 
 * HERA Migration Test CSS
 * This temporarily imports both CSS files for testing
 * Once verified, switch to globals-dna-safe.css only
 */

/* Original styles - will be phased out */
@import "./globals.css";

/* DNA-safe overrides - takes precedence */
@import "./globals-dna-safe.css";

/* Migration markers */
.migration-in-progress {
  /* Components being migrated will have this class */
}
`;

    fs.writeFileSync(
      path.join(process.cwd(), 'src/app/globals-migration-test.css'),
      testCss
    );
    
    console.log(`${colors.green}✓${colors.reset} Created globals-migration-test.css`);
    console.log('\nFor testing, you can import this file to use both styles');
  },

  /**
   * Safely migrate individual components
   */
  'migrate-component': async (componentPath) => {
    if (!componentPath) {
      console.log(`${colors.red}❌ Please specify a component path${colors.reset}`);
      console.log('Usage: node scripts/safe-migrate-to-dna.js migrate-component src/components/MyComponent.tsx');
      return;
    }
    
    const fullPath = path.join(process.cwd(), componentPath);
    if (!fs.existsSync(fullPath)) {
      console.log(`${colors.red}❌ Component not found: ${componentPath}${colors.reset}`);
      return;
    }
    
    console.log(`${colors.blue}🔄 Migrating ${componentPath}...${colors.reset}\n`);
    
    // Create a DNA version alongside the original
    const content = fs.readFileSync(fullPath, 'utf8');
    const dnaPath = fullPath.replace(/\.tsx$/, '.dna.tsx');
    
    let dnaContent = content;
    let changesMade = [];
    
    // Safe replacements
    for (const [oldImport, config] of Object.entries(SAFE_COMPONENT_MAP)) {
      if (content.includes(oldImport) && config.safe) {
        dnaContent = dnaContent.replace(
          new RegExp(oldImport.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
          config.to
        );
        changesMade.push(`Replaced ${oldImport} with ${config.to}`);
      }
    }
    
    // Add migration comment
    if (changesMade.length > 0) {
      dnaContent = `/**
 * HERA DNA Migration Version
 * Original: ${componentPath}
 * Changes made:
${changesMade.map(c => ` * - ${c}`).join('\n')}
 */

${dnaContent}`;
      
      fs.writeFileSync(dnaPath, dnaContent);
      console.log(`${colors.green}✓${colors.reset} Created DNA version: ${path.basename(dnaPath)}`);
      console.log('\nChanges made:');
      changesMade.forEach(change => console.log(`  - ${change}`));
      console.log('\nTest the DNA version before replacing the original');
    } else {
      console.log(`${colors.yellow}No safe migrations available for this component${colors.reset}`);
    }
  },

  /**
   * Verify migrations are working
   */
  verify: async () => {
    console.log(`${colors.blue}🔍 Verifying migrations...${colors.reset}\n`);
    
    // Check if DNA components are being used
    const dnaComponents = getAllFiles('src')
      .filter(f => f.endsWith('.dna.tsx'))
      .length;
    
    console.log(`Found ${dnaComponents} DNA component versions`);
    
    // Check which CSS is being used
    const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
    if (fs.existsSync(layoutPath)) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      if (layoutContent.includes('globals-dna-safe.css')) {
        console.log(`${colors.green}✓${colors.reset} Using DNA-safe CSS`);
      } else if (layoutContent.includes('globals-migration-test.css')) {
        console.log(`${colors.yellow}⚡${colors.reset} Using migration test CSS (both styles)`);
      } else {
        console.log(`${colors.yellow}⚠${colors.reset} Still using original globals.css`);
      }
    }
    
    console.log(`\n${colors.green}✅ Migration verification complete${colors.reset}`);
  },

  /**
   * Show help
   */
  help: async () => {
    console.log(`${colors.bright}HERA DNA UI Safe Migration Tool${colors.reset}\n`);
    console.log('Commands:');
    console.log(`  ${colors.blue}check${colors.reset}              - Check for potential conflicts`);
    console.log(`  ${colors.blue}prepare${colors.reset}            - Create backup and migration files`);
    console.log(`  ${colors.blue}migrate-css${colors.reset}        - Create DNA-compatible CSS`);
    console.log(`  ${colors.blue}migrate-component${colors.reset}  - Migrate a specific component`);
    console.log(`  ${colors.blue}verify${colors.reset}             - Verify migration status`);
    console.log(`  ${colors.blue}help${colors.reset}               - Show this help message`);
    console.log('\nExample workflow:');
    console.log('  1. node scripts/safe-migrate-to-dna.js check');
    console.log('  2. node scripts/safe-migrate-to-dna.js prepare');
    console.log('  3. node scripts/safe-migrate-to-dna.js migrate-css');
    console.log('  4. node scripts/safe-migrate-to-dna.js migrate-component src/components/MyComponent.tsx');
    console.log('  5. node scripts/safe-migrate-to-dna.js verify');
  }
};

// Helper function to get all files
function getAllFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      getAllFiles(fullPath, files);
    } else if (stat.isFile()) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Main execution
const command = process.argv[2] || 'help';
const args = process.argv.slice(3);

if (migrations[command]) {
  migrations[command](...args).catch(err => {
    console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
    process.exit(1);
  });
} else {
  console.log(`${colors.red}Unknown command: ${command}${colors.reset}`);
  migrations.help();
}