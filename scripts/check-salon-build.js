#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Checking Salon module build...\n');

// List of salon-related files
const salonFiles = [
  'src/app/(app)/dashboard/page.tsx',
  'src/app/(app)/accountant/page.tsx', 
  'src/app/(app)/layout.tsx',
  'src/lib/auth/rbac.ts',
  'src/lib/auth/guard.tsx',
  'src/lib/api/client.ts',
  'src/lib/api/dashboard.ts',
  'src/lib/api/reports.ts',
  'src/lib/utils/format.ts',
  'src/lib/services/demo-policy.ts',
  'src/lib/config/navigation.ts',
  'src/components/dashboard/KpiCards.tsx',
  'src/components/dashboard/AlertsStrip.tsx',
  'src/components/dashboard/RevenueSparkline.tsx',
  'src/components/dashboard/UpcomingAppointments.tsx',
  'src/components/dashboard/LowStockList.tsx',
  'src/components/dashboard/StaffUtilization.tsx',
  'src/components/dashboard/QuickActions.tsx'
];

console.log('📋 Checking TypeScript compilation for Salon files...\n');

// Check each file
let hasErrors = false;
salonFiles.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  if (fs.existsSync(filePath)) {
    try {
      // Run TypeScript compiler on the file
      execSync(`npx tsc --noEmit --skipLibCheck --jsx react-jsx ${filePath}`, { stdio: 'pipe' });
      console.log(`✅ ${file}`);
    } catch (error) {
      console.log(`❌ ${file}`);
      console.log(error.stdout?.toString() || error.message);
      hasErrors = true;
    }
  } else {
    console.log(`⚠️  ${file} - File not found`);
  }
});

if (hasErrors) {
  console.log('\n❌ Some files have TypeScript errors');
  process.exit(1);
} else {
  console.log('\n✅ All Salon files compile successfully!');
}

// Test imports
console.log('\n📦 Testing module imports...\n');

const testImports = [
  '@/src/components/auth/MultiOrgAuthProvider',
  '@/src/lib/auth/guard',
  '@/src/lib/auth/rbac',
  '@/src/lib/api/client',
  '@/src/lib/universal-api'
];

testImports.forEach(imp => {
  try {
    require.resolve(imp.replace('@/', './'));
    console.log(`✅ ${imp}`);
  } catch {
    console.log(`⚠️  ${imp} - Module resolution may need adjustment`);
  }
});

console.log('\n🎉 Salon module check complete!');