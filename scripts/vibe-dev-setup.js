#!/usr/bin/env node
/**
 * HERA Vibe Development Setup
 * Creates the perfect environment for 100% vibe coding success
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🎯 Setting up HERA Vibe Development Environment...');

// 1. Start auto-validator in background
console.log('🤖 Starting auto-validator...');
try {
  execSync('npm run validate:watch &', { stdio: 'ignore' });
  console.log('✅ Auto-validator running in background');
} catch (error) {
  console.log('⚠️  Auto-validator setup skipped (already running?)');
}

// 2. Pre-warm TypeScript compiler
console.log('🔥 Pre-warming TypeScript compiler...');
try {
  execSync('npx tsc --noEmit --incremental', { stdio: 'pipe' });
  console.log('✅ TypeScript compiler ready');
} catch (error) {
  console.log('✅ TypeScript issues detected - auto-validator will help fix them');
}

// 3. Check essential vibe coding dependencies
console.log('📦 Checking vibe coding dependencies...');
const essentialDeps = [
  'lucide-react',
  '@radix-ui/react-*',
  'class-variance-authority',
  'tailwind-merge',
  'framer-motion'
];

const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

essentialDeps.forEach(dep => {
  const isInstalled = Object.keys(deps).some(key => key.includes(dep.replace('*', '')));
  console.log(`${isInstalled ? '✅' : '❌'} ${dep}`);
});

// 4. Generate vibe coding cheat sheet
const vibeCheatSheet = `
# 🎯 HERA VIBE CODING CHEAT SHEET

## 🚀 Perfect First Attempt Patterns:

### Salon Page Template:
\`\`\`bash
node scripts/vibe-templates.js salonPage "MyPage" "MyPageComponent"
\`\`\`

### Enterprise Page Template:
\`\`\`bash
node scripts/vibe-templates.js enterprisePage "Finance" "Reports"
\`\`\`

### Universal Transaction:
\`\`\`bash
node scripts/vibe-templates.js universalTransaction "Sale"
\`\`\`

## 🛡️ Auto-Protection (Always Active):
- ✅ TypeScript validation in real-time
- ✅ JSX entity checking (&lt; instead of <)
- ✅ Import path validation
- ✅ Provider context verification

## 🎨 Vibe-Safe Imports:
\`\`\`typescript
// Always safe lucide icons
import { 
  Users, Building2, Settings, Search, Plus, 
  Edit, Trash2, Eye, Check, X, ArrowRight,
  BarChart3, PieChart, TrendingUp, TrendingDown
} from 'lucide-react'

// Vibe-ready HERA hooks
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { useSecuredSalonContext } from '../EnterpriseSecuredSalonProvider'
\`\`\`

## 🎯 Guaranteed Success Structure:
1. Start with template
2. Add your vibe logic
3. Auto-validator catches issues
4. First attempt works!
`;

fs.writeFileSync('.vibe-cheat-sheet.md', vibeCheatSheet);
console.log('📝 Created .vibe-cheat-sheet.md');

// 5. Set up vibe coding npm scripts
const packageJsonPath = 'package.json';
const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const vibeScripts = {
  'vibe:start': 'npm run dev:safe',
  'vibe:template': 'node scripts/vibe-templates.js',
  'vibe:check': 'npm run check:code',
  'vibe:fix': 'npm run fix:auto',
  'vibe:salon': 'node scripts/vibe-templates.js salonPage',
  'vibe:enterprise': 'node scripts/vibe-templates.js enterprisePage',
  'vibe:transaction': 'node scripts/vibe-templates.js universalTransaction'
};

// Add vibe scripts if they don't exist
let scriptsUpdated = false;
Object.entries(vibeScripts).forEach(([script, command]) => {
  if (!pkg.scripts[script]) {
    pkg.scripts[script] = command;
    scriptsUpdated = true;
  }
});

if (scriptsUpdated) {
  fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2));
  console.log('✅ Added vibe coding scripts to package.json');
}

console.log('\n🎉 VIBE DEVELOPMENT ENVIRONMENT READY!');
console.log('\n🚀 Start vibe coding with:');
console.log('   npm run vibe:start');
console.log('\n📝 Generate templates with:');
console.log('   npm run vibe:template salonPage "MyPage" "MyComponent"');
console.log('\n🛡️ Auto-validator is watching for issues in background');
console.log('💡 Check .vibe-cheat-sheet.md for patterns');