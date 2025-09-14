#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Fixing TypeScript errors...\n');

// Fix 1: Update next/headers imports for Next.js 15
console.log('📦 Fixing Next.js 15 import issues...');

const filesToFix = [
  'src/app/api/auth/demo-login/route.ts',
  'src/app/api/v1/calendar/appointments/route.ts',
  'src/app/api/v1/calendar/resources/route.ts',
  'src/app/api/v1/calendar/route.ts',
  'src/app/api/v1/config/admin/route.ts',
  'src/app/api/v1/development/tasks/route.ts',
  'src/app/api/v1/fin/route.ts',
  'src/app/api/v1/financial-integration/config/route.ts',
  'src/app/api/v1/financial-integration/route.ts',
  'src/app/api/v1/mcp/tools/route.ts',
  'src/app/api/v1/mcp/whatsapp/route.ts',
  'src/app/api/v1/organizations/[id]/apps/route.ts',
  'src/app/api/v1/organizations/[id]/route.ts',
  'src/app/api/v1/organizations/route.ts'
];

filesToFix.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix cookies import
    content = content.replace(
      /import\s*{\s*cookies\s*}\s*from\s*['"]next\/headers['"]/g,
      "import { cookies } from 'next/headers'"
    );
    
    // Fix headers import
    content = content.replace(
      /import\s*{\s*headers\s*}\s*from\s*['"]next\/headers['"]/g,
      "import { headers } from 'next/headers'"
    );
    
    // Update usage of cookies() to await cookies()
    content = content.replace(
      /(?<!await\s+)cookies\(\)/g,
      '(await cookies())'
    );
    
    // Update usage of headers() to await headers()
    content = content.replace(
      /(?<!await\s+)headers\(\)/g,
      '(await headers())'
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed: ${filePath}`);
  }
});

// Fix 2: Add missing types to universal-api
console.log('\n📦 Fixing universal-api missing methods...');

const universalApiPath = path.join(process.cwd(), 'src/lib/universal-api.ts');
if (fs.existsSync(universalApiPath)) {
  let content = fs.readFileSync(universalApiPath, 'utf8');
  
  // Check if methods are missing and add them
  if (!content.includes('createDynamicData')) {
    // Find the class definition and add missing methods
    const classEndMatch = content.match(/export\s+class\s+HeraApiClient[\s\S]*?{([\s\S]*?)^}/m);
    if (classEndMatch) {
      const methodsToAdd = `
  // Dynamic data management
  async createDynamicData(data: any) {
    return this.request('/api/v1/universal', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        table: 'core_dynamic_data',
        data
      })
    });
  }

  // Organization management
  async createOrganization(data: any) {
    return this.request('/api/v1/organizations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Transaction line management
  async createTransactionLine(data: any) {
    return this.request('/api/v1/universal', {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        table: 'universal_transaction_lines',
        data
      })
    });
  }

  // Batch entity updates
  async updateEntitiesBatch(entities: any[]) {
    return this.request('/api/v1/universal', {
      method: 'POST',
      body: JSON.stringify({
        action: 'batch_update',
        table: 'core_entities',
        data: entities
      })
    });
  }`;

      // Insert before the last closing brace of the class
      content = content.replace(/^}$/m, methodsToAdd + '\n}');
      fs.writeFileSync(universalApiPath, content);
      console.log('✅ Added missing methods to universal-api');
    }
  }
}

// Fix 3: Fix entity types constant issues
console.log('\n📦 Fixing entity types constants...');

const constantFiles = [
  'src/app/api/v1/learning/ca-final/route.ts',
  'src/lib/constants/entity-types.ts'
];

constantFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Add missing GST related constants
    if (content.includes('ENTITY_TYPES') && !content.includes('GST_BASICS')) {
      content = content.replace(
        /export const ENTITY_TYPES = {([\s\S]*?)}/,
        (match, p1) => {
          return `export const ENTITY_TYPES = {${p1}
  // GST Related
  GST_BASICS: 'gst_basics',
  INPUT_TAX_CREDIT: 'input_tax_credit',
  CUSTOMS_VALUATION: 'customs_valuation',
  FTP_SCHEMES: 'ftp_schemes',
}`;
        }
      );
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Fixed entity types in: ${filePath}`);
    }
  }
});

// Fix 4: Fix arithmetic operation type errors
console.log('\n📦 Fixing arithmetic operation type errors...');

const arithmeticFiles = [
  'src/app/api/v1/analytics/chat/v2/route.ts',
  'src/app/api/v1/development/modules/route.ts',
  'src/app/api/v1/digital-accountant/chat/route.ts'
];

arithmeticFiles.forEach(filePath => {
  const fullPath = path.join(process.cwd(), filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Fix arithmetic operations with unknown types
    content = content.replace(
      /(\w+)\s*\+\s*(\w+)(?=\s*[;,\)])/g,
      (match, p1, p2) => {
        // Check if we're dealing with potential number operations
        if (match.includes('progress') || match.includes('score') || match.includes('count')) {
          return `Number(${p1}) + Number(${p2})`;
        }
        return match;
      }
    );
    
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Fixed arithmetic operations in: ${filePath}`);
  }
});

console.log('\n✨ TypeScript error fixing complete!');
console.log('Run "npm run type-check" to see remaining errors.');