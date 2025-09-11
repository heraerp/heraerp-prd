#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Railway deployment with full functionality...\n');

// 1. Ensure next.config.js has correct settings
console.log('1️⃣ Checking Next.js configuration...');
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
let nextConfig = fs.readFileSync(nextConfigPath, 'utf8');

// Ensure output is NOT standalone (Railway doesn't support it well)
if (nextConfig.includes("output: 'standalone'")) {
  nextConfig = nextConfig.replace("output: 'standalone'", "// output: 'standalone' // Disabled for Railway");
  fs.writeFileSync(nextConfigPath, nextConfig);
  console.log('   ✓ Disabled standalone output mode');
}

// 2. Create .env.production with necessary variables
console.log('\n2️⃣ Creating production environment file...');
const envProduction = `# Production environment variables
NEXT_PUBLIC_SUPABASE_URL=${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uirruxpfideciqubwhmp.supabase.co'}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpcnJ1eHBmaWRlY2lxdWJ3aG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE4NDY1MjEsImV4cCI6MjA0NzQyMjUyMX0.LhBPAE9oBsjq80kBhOxHp7ByIy6vgQg4-3FPR5kRrLo'}
NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID=${process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'f0af4ced-9d12-4a55-a649-b484368db249'}
NODE_ENV=production
`;

fs.writeFileSync('.env.production', envProduction);
console.log('   ✓ Created .env.production');

// 3. Update package.json start script
console.log('\n3️⃣ Updating start script...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.scripts.start = "NODE_ENV=production next start -p $PORT";
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('   ✓ Updated start script for Railway');

// 4. Create Railway-specific build script
console.log('\n4️⃣ Creating Railway build script...');
packageJson.scripts['build:railway'] = "NODE_OPTIONS='--max-old-space-size=8192' next build";
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('   ✓ Added build:railway script');

// 5. Update Dockerfile for Railway
console.log('\n5️⃣ Creating Railway-optimized Dockerfile...');
const dockerfileContent = `# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application
RUN npm run build:railway || npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy all necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.js ./next.config.js

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["npm", "start"]
`;

fs.writeFileSync('Dockerfile', dockerfileContent);
console.log('   ✓ Created Railway-optimized Dockerfile');

console.log('\n✅ Railway deployment preparation complete!');
console.log('\nNext steps:');
console.log('1. git add -A');
console.log('2. git commit -m "Configure for Railway deployment with full functionality"');
console.log('3. git push');
console.log('\nRailway should now deploy successfully with all features enabled.');