#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const command = process.argv[2];

function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

function runCommand(cmd, options = {}) {
  try {
    log(`Running: ${cmd}`);
    execSync(cmd, { stdio: 'inherit', ...options });
    return true;
  } catch (error) {
    log(`Error running command: ${error.message}`);
    return false;
  }
}

if (command === 'build') {
  log('🚀 Starting Railway build process...');
  
  // Set environment variables
  process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dummy.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'dummy-anon-key';
  process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'dummy-service-key';
  process.env.NODE_OPTIONS = '--max-old-space-size=4096';
  process.env.SKIP_ENV_VALIDATION = 'true';
  
  // Run build steps
  runCommand('npm run schema:types') || log('Schema types generation failed, continuing...');
  runCommand('node scripts/clear-browser-cache.js') || log('Cache clearing failed, continuing...');
  runCommand('node scripts/inject-build-version.js') || log('Version injection failed, continuing...');
  
  log('🏗️ Building Next.js application...');
  const buildSuccess = runCommand('npx next build', {
    env: {
      ...process.env,
      TSC_COMPILE_ON_ERROR: 'true'
    }
  });
  
  if (!buildSuccess) {
    log('❌ Build failed!');
    process.exit(1);
  }
  
  // Check if .next directory exists
  if (fs.existsSync('.next')) {
    log('✅ Build directory found!');
    const buildInfo = {
      timestamp: new Date().toISOString(),
      node_version: process.version,
      cwd: process.cwd()
    };
    fs.writeFileSync('.next/BUILD_INFO.json', JSON.stringify(buildInfo, null, 2));
    log('✅ Created build info file');
    
    // List .next contents
    const files = fs.readdirSync('.next');
    log(`.next directory contents: ${files.join(', ')}`);
  } else {
    log('❌ Build directory not found!');
    process.exit(1);
  }
  
  log('✅ Railway build completed successfully!');
  
} else if (command === 'start') {
  log('🚀 Starting HERA ERP production server...');
  
  // Log current directory
  log(`Current working directory: ${process.cwd()}`);
  log(`Directory contents: ${fs.readdirSync('.').join(', ')}`);
  
  // Check for .next directory
  let nextDir = '.next';
  if (!fs.existsSync(nextDir)) {
    log('⚠️ .next not found in current directory, checking other locations...');
    
    // Check common locations
    const possibleLocations = [
      '/app/.next',
      '/opt/app/.next',
      path.join(process.cwd(), '.next')
    ];
    
    for (const location of possibleLocations) {
      if (fs.existsSync(location)) {
        log(`✅ Found .next at: ${location}`);
        const parentDir = path.dirname(location);
        process.chdir(parentDir);
        log(`Changed directory to: ${parentDir}`);
        nextDir = '.next';
        break;
      }
    }
  }
  
  // Final check
  if (fs.existsSync(nextDir)) {
    log('✅ .next directory confirmed');
    
    // Check for build info
    const buildInfoPath = path.join(nextDir, 'BUILD_INFO.json');
    if (fs.existsSync(buildInfoPath)) {
      const buildInfo = JSON.parse(fs.readFileSync(buildInfoPath, 'utf8'));
      log(`Build info: ${JSON.stringify(buildInfo)}`);
    }
    
    // Start the server
    log('🌐 Starting Next.js production server...');
    require('child_process').spawn('npm', ['run', 'start'], {
      stdio: 'inherit',
      shell: true
    });
    
  } else {
    log('❌ FATAL: Could not locate .next directory!');
    log('Searching for .next directory...');
    
    try {
      const findResult = execSync('find / -name ".next" -type d 2>/dev/null | head -10', { encoding: 'utf8' });
      log(`Found .next directories:\n${findResult}`);
    } catch (e) {
      log('Could not search for .next directory');
    }
    
    process.exit(1);
  }
  
} else {
  console.log('Usage: node railway-deploy.js [build|start]');
  process.exit(1);
}