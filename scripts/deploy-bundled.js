#!/usr/bin/env node

/**
 * 🚀 HERA Bundled Deployment Script (Node.js Version)
 * One-command deployment to GitHub and Railway
 */

const { execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Helper functions
const log = {
  info: (msg) => console.log(`${colors.blue}[DEPLOY]${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}[SUCCESS]${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}[ERROR]${colors.reset} ${msg}`),
  step: (num, msg) => console.log(`${colors.yellow}[STEP ${num}]${colors.reset} ${msg}`),
  banner: (msg) => console.log(`${colors.cyan}${msg}${colors.reset}`)
};

// Execute command helper
function exec(command, silent = false) {
  try {
    const result = execSync(command, { 
      encoding: 'utf8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Get user input
async function getInput(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

// Main deployment function
async function deploy() {
  log.banner(`
╔═══════════════════════════════════════════════════════════╗
║           🚀 HERA BUNDLED DEPLOYMENT SYSTEM 🚀            ║
║                GitHub + Railway Deploy                     ║
╚═══════════════════════════════════════════════════════════╝
  `);

  // Check prerequisites
  log.info('Checking prerequisites...');
  
  // Check git
  const gitCheck = exec('git --version', true);
  if (!gitCheck.success) {
    log.error('Git is not installed. Please install git first.');
    process.exit(1);
  }
  
  // Check railway
  const railwayCheck = exec('railway --version', true);
  if (!railwayCheck.success) {
    log.error('Railway CLI is not installed. Install with: npm install -g @railway/cli');
    process.exit(1);
  }
  
  // Check for changes
  const statusResult = exec('git status --porcelain', true);
  if (!statusResult.output || statusResult.output.trim() === '') {
    log.error('No changes to deploy. Make some changes first.');
    process.exit(1);
  }

  // Get commit message
  let commitMessage = process.argv[2];
  if (!commitMessage) {
    commitMessage = await getInput('Enter deployment message: ');
    if (!commitMessage.trim()) {
      log.error('Deployment message is required.');
      process.exit(1);
    }
  }

  console.log('');
  log.info(`Deploying with message: "${commitMessage}"`);
  console.log('');

  // Step 1: Show changes
  log.step(1, 'Current changes:');
  exec('git status --short');
  console.log('');

  // Step 2: Build
  log.step(2, 'Building application...');
  const buildResult = exec('npm run build');
  if (!buildResult.success) {
    log.error('Build failed. Please fix build errors before deploying.');
    process.exit(1);
  }
  log.success('Build completed successfully');
  console.log('');

  // Step 3: Stage changes
  log.step(3, 'Staging all changes...');
  exec('git add .');
  log.success('All changes staged');
  console.log('');

  // Step 4: Commit
  log.step(4, 'Committing to Git...');
  const fullCommitMessage = `🚀 ${commitMessage}

Deployed via HERA Bundled Deployment System
- GitHub commit and push
- Railway production deployment

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>`;

  const commitResult = exec(`git commit -m "${fullCommitMessage.replace(/"/g, '\\"')}"`);
  if (!commitResult.success) {
    log.error('Commit failed');
    process.exit(1);
  }
  
  const commitHash = exec('git rev-parse --short HEAD', true).output.trim();
  log.success(`Changes committed: ${commitHash}`);
  console.log('');

  // Step 5: Push to GitHub
  log.step(5, 'Pushing to GitHub...');
  const pushResult = exec('git push origin main');
  if (!pushResult.success) {
    log.error('GitHub push failed');
    process.exit(1);
  }
  log.success('Pushed to GitHub successfully');
  console.log(`GitHub: https://github.com/heraerp/heraprd/commit/${commitHash}`);
  console.log('');

  // Step 6: Deploy to Railway
  log.step(6, 'Deploying to Railway...');
  
  // Check Railway auth
  const authCheck = exec('railway whoami', true);
  if (!authCheck.success) {
    log.error('Not authenticated with Railway. Please run: railway login');
    process.exit(1);
  }
  
  log.info('Starting Railway deployment...');
  const deployResult = exec('railway up');
  if (!deployResult.success) {
    log.error('Railway deployment failed');
    process.exit(1);
  }

  // Success summary
  console.log('');
  log.banner(`
╔═══════════════════════════════════════════════════════════╗
║              ✅ DEPLOYMENT SUCCESSFUL! ✅                  ║
╚═══════════════════════════════════════════════════════════╝
  `);
  
  console.log(`
📝 Commit: ${commitHash} - ${commitMessage}
🌐 Live URLs:
   - https://heraerp.com
   - https://heraerp-production.up.railway.app

📊 Check status:
   - GitHub: https://github.com/heraerp/heraprd/commit/${commitHash}
   - Railway: railway logs
  `);
  
  log.success('Deployment complete! 🎉');
}

// Handle errors
process.on('unhandledRejection', (error) => {
  log.error(`Unexpected error: ${error.message}`);
  process.exit(1);
});

// Run deployment
deploy().catch((error) => {
  log.error(`Deployment failed: ${error.message}`);
  process.exit(1);
});