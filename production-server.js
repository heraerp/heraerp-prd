#!/usr/bin/env node

/**
 * Production-safe server wrapper
 * Implements multiple safety mechanisms to prevent crashes
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const MAX_RESTART_ATTEMPTS = 5;
const RESTART_DELAY = 5000; // 5 seconds
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

let restartCount = 0;
let lastRestartTime = Date.now();
let serverProcess = null;

// Ensure we have build artifacts before starting
function verifyBuildArtifacts() {
  const nextDir = path.join(process.cwd(), '.next');
  const requiredFiles = [
    path.join(nextDir, 'BUILD_ID'),
    path.join(nextDir, 'prerender-manifest.json')
  ];
  
  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      console.error(`❌ Missing required build artifact: ${file}`);
      console.error('Please run "npm run build" before starting the server.');
      return false;
    }
  }
  
  return true;
}

// Graceful shutdown handler
function gracefulShutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  if (serverProcess) {
    serverProcess.kill('SIGTERM');
    
    // Force kill after 10 seconds if not stopped
    setTimeout(() => {
      if (serverProcess) {
        console.log('Force killing server process...');
        serverProcess.kill('SIGKILL');
      }
      process.exit(0);
    }, 10000);
  } else {
    process.exit(0);
  }
}

// Start the server with error handling
function startServer() {
  console.log('🚀 Starting HERA production server...');
  console.log(`Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`Port: ${process.env.PORT || 3000}`);
  
  serverProcess = spawn('node', ['simple-server.js'], {
    env: {
      ...process.env,
      NODE_ENV: 'production'
    },
    stdio: 'inherit'
  });
  
  serverProcess.on('exit', (code, signal) => {
    console.log(`Server process exited with code ${code} and signal ${signal}`);
    serverProcess = null;
    
    // Check if we should restart
    const timeSinceLastRestart = Date.now() - lastRestartTime;
    
    if (timeSinceLastRestart < 60000) { // Less than 1 minute
      restartCount++;
    } else {
      restartCount = 0; // Reset counter if it's been stable
    }
    
    if (restartCount < MAX_RESTART_ATTEMPTS) {
      console.log(`Attempting restart ${restartCount + 1}/${MAX_RESTART_ATTEMPTS} in ${RESTART_DELAY / 1000} seconds...`);
      lastRestartTime = Date.now();
      setTimeout(startServer, RESTART_DELAY);
    } else {
      console.error('❌ Server crashed too many times. Manual intervention required.');
      console.error('Please check logs and fix any issues before restarting.');
      process.exit(1);
    }
  });
  
  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
    serverProcess = null;
  });
}

// Health check (optional - can be expanded)
function performHealthCheck() {
  if (!serverProcess) {
    console.log('⚠️  Server process not running during health check');
    return;
  }
  
  // Add more sophisticated health checks here if needed
  // For now, just check if the process is still alive
  try {
    process.kill(serverProcess.pid, 0);
    // Process exists
  } catch (e) {
    console.log('⚠️  Server process appears to be dead');
  }
}

// Main execution
console.log('🛡️  HERA Production Server Guardian\n');

// Verify build artifacts first
if (!verifyBuildArtifacts()) {
  process.exit(1);
}

// Set up signal handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Set up uncaught exception handler (last resort)
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit - let the process manager handle it
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit - let the process manager handle it
});

// Start the server
startServer();

// Set up periodic health checks
setInterval(performHealthCheck, HEALTH_CHECK_INTERVAL);

console.log('✅ Production server guardian is active\n');