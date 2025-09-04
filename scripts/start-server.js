#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🚀 Starting HERA ERP Production Server...');
console.log('Environment:', process.env.NODE_ENV || 'production');
console.log('Port:', process.env.PORT || '3000');
console.log('Host:', process.env.HOSTNAME || '0.0.0.0');

// Set default environment variables if not provided
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.PORT = process.env.PORT || '3000';
process.env.HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Log configuration status
console.log('\n📋 Configuration Status:');
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configured' : '⚠️  Not configured');
console.log('Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configured' : '⚠️  Not configured');
console.log('Service Role Key:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Configured' : '⚠️  Not configured');

// Start Next.js production server
console.log('\n🔧 Starting Next.js server...\n');

const server = spawn('npx', ['next', 'start', '-p', process.env.PORT || '3000', '-H', process.env.HOSTNAME || '0.0.0.0'], {
  stdio: 'inherit',
  env: process.env
});

server.on('error', (error) => {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Server exited with code ${code}`);
    process.exit(code);
  }
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  server.kill('SIGINT');
});

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  console.error(err.stack);
});