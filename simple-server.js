#!/usr/bin/env node

const { spawn } = require('child_process');

const PORT = process.env.PORT || 3000;

console.log('Starting HERA ERP...');
console.log(`PORT: ${PORT}`);
console.log(`NODE_ENV: ${process.env.NODE_ENV}`);

// Start Next.js directly
console.log('Starting Next.js application...');

const next = spawn('npm', ['start'], {
  env: {
    ...process.env,
    PORT: PORT,
    HOSTNAME: '0.0.0.0'
  },
  stdio: 'inherit'
});

next.on('error', (err) => {
  console.error('Failed to start Next.js:', err);
  process.exit(1);
});

next.on('exit', (code) => {
  console.log(`Next.js exited with code ${code}`);
  process.exit(code || 0);
});

// Handle shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  next.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('SIGINT received');
  next.kill('SIGINT');
});