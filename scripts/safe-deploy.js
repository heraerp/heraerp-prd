#!/usr/bin/env node

/**
 * Safe deployment wrapper
 * Ensures all checks pass before deploying
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.toLowerCase().trim());
    });
  });
}

async function deploy() {
  console.log('🚀 HERA Safe Deployment Process\n');
  
  // 1. Run pre-deployment validation
  console.log('Step 1: Running pre-deployment validation...');
  try {
    execSync('node scripts/pre-deploy-validation.js', { stdio: 'inherit' });
  } catch (error) {
    console.error('\n❌ Pre-deployment validation failed!');
    console.error('Deployment cancelled for safety.\n');
    rl.close();
    process.exit(1);
  }
  
  // 2. Show git status
  console.log('\nStep 2: Checking git status...');
  execSync('git status', { stdio: 'inherit' });
  
  // 3. Confirm deployment
  const answer = await askQuestion('\n🤔 Do you want to proceed with deployment? (yes/no): ');
  
  if (answer !== 'yes' && answer !== 'y') {
    console.log('\n❌ Deployment cancelled by user.\n');
    rl.close();
    process.exit(0);
  }
  
  // 4. Create deployment tag
  const date = new Date().toISOString().split('T')[0];
  const tagName = `deploy-${date}-${Date.now()}`;
  
  console.log(`\nStep 3: Creating deployment tag: ${tagName}`);
  try {
    execSync(`git tag -a ${tagName} -m "Deployment ${date}"`, { stdio: 'inherit' });
    console.log('✅ Tag created');
  } catch (error) {
    console.error('⚠️  Failed to create tag (continuing anyway)');
  }
  
  // 5. Push to repository
  console.log('\nStep 4: Pushing to repository...');
  try {
    execSync('git push origin main', { stdio: 'inherit' });
    execSync(`git push origin ${tagName}`, { stdio: 'inherit' });
    console.log('✅ Code pushed successfully');
  } catch (error) {
    console.error('❌ Failed to push to repository');
    rl.close();
    process.exit(1);
  }
  
  console.log('\n✅ Safe deployment completed!');
  console.log(`📋 Deployment tag: ${tagName}`);
  console.log('🔍 Monitor your deployment platform for build status.\n');
  
  rl.close();
}

deploy().catch(error => {
  console.error('Deployment error:', error);
  rl.close();
  process.exit(1);
});