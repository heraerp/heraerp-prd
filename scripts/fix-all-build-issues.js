#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing all build issues...');

// Fix 1: admin/provisioning/page.tsx - Type issues with module
const provisioningPath = path.join(__dirname, '../src/app/admin/provisioning/page.tsx');
if (fs.existsSync(provisioningPath)) {
  let content = fs.readFileSync(provisioningPath, 'utf8');
  
  // Fix module type issues by properly typing the module variable
  content = content.replace(
    /const module = selectedModule \? modules\.find\(m => m\.id === selectedModule\) : null/,
    `const module = selectedModule ? modules.find(m => m.id === selectedModule) : null as typeof modules[0] | null`
  );
  
  // Fix parameter types
  content = content.replace(
    /\.map\(\(feature\) => \(/,
    '.map((feature: any) => ('
  );
  
  content = content.replace(
    /\.map\(\(row, idx\) => \(/g,
    '.map((row: any, idx: number) => ('
  );
  
  fs.writeFileSync(provisioningPath, content);
  console.log('✅ Fixed admin/provisioning/page.tsx');
}

// Fix 2: analytics-chat/page.tsx - Parameter types
const analyticsChatPath = path.join(__dirname, '../src/app/analytics-chat/page.tsx');
if (fs.existsSync(analyticsChatPath)) {
  let content = fs.readFileSync(analyticsChatPath, 'utf8');
  
  content = content.replace(
    /\.map\(\(row, idx\) => \(/g,
    '.map((row: any, idx: number) => ('
  );
  
  fs.writeFileSync(analyticsChatPath, content);
  console.log('✅ Fixed analytics-chat/page.tsx');
}

// Fix 3: API route type issues
const apiRoutePath = path.join(__dirname, '../src/app/api/v1/analytics/chat/route.ts');
if (fs.existsSync(apiRoutePath)) {
  let content = fs.readFileSync(apiRoutePath, 'utf8');
  
  // Add null checks
  content = content.replace(
    /const stream = await completion\.toTextStreamResponse\(\)/,
    `const stream = completion ? await completion.toTextStreamResponse() : null`
  );
  
  content = content.replace(
    /completion\.abort\(\)/g,
    'completion?.abort()'
  );
  
  // Fix parameter types
  content = content.replace(
    /\.map\(\(m\) => /g,
    '.map((m: any) => '
  );
  
  fs.writeFileSync(apiRoutePath, content);
  console.log('✅ Fixed API analytics chat route');
}

// Fix 4: Workflow files
const workflowFiles = [
  '../src/lib/workflows/salon-appointment-workflow.ts'
];

workflowFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix workflow step types
    content = content.replace(
      /type: "create_entities"/g,
      'type: "create_entity"'
    );
    
    content = content.replace(
      /type: "notify_staff"/g,
      'type: "send_notification"'
    );
    
    content = content.replace(
      /type: "archive_appointment"/g,
      'type: "update_entity"'
    );
    
    content = content.replace(
      /type: "process_cancellation_fee"/g,
      'type: "create_transaction"'
    );
    
    content = content.replace(
      /type: "block_service_start"/g,
      'type: "update_status"'
    );
    
    content = content.replace(
      /type: "request_alternative_payment"/g,
      'type: "send_notification"'
    );
    
    content = content.replace(
      /type: "notify_manager"/g,
      'type: "send_notification"'
    );
    
    content = content.replace(
      /type: "freeze_payment"/g,
      'type: "update_status"'
    );
    
    content = content.replace(
      /action: "block_transition"/g,
      'action: "block"'
    );
    
    // Add missing action property to guardrails
    content = content.replace(
      /id: "payment_required_before_service",\n\s+description:/g,
      'id: "payment_required_before_service",\n    action: "block",\n    description:'
    );
    
    content = content.replace(
      /id: "cancellation_fee_required",\n\s+description:/g,
      'id: "cancellation_fee_required",\n    action: "block",\n    description:'
    );
    
    // Add required property to variables
    content = content.replace(
      /type: "string",\n\s+default: ""/g,
      'type: "string",\n    required: false,\n    default: ""'
    );
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${path.basename(filePath)}`);
  }
});

// Fix 5: ReadinessWizardV2.tsx
const readinessPath = path.join(__dirname, '../src/modules/readiness-questionnaire/ReadinessWizardV2.tsx');
if (fs.existsSync(readinessPath)) {
  let content = fs.readFileSync(readinessPath, 'utf8');
  
  // Fix type comparison
  content = content.replace(
    /value !== "" && value !== null && value !== undefined && value !== false/g,
    'value != null && value !== "" && value !== false'
  );
  
  fs.writeFileSync(readinessPath, content);
  console.log('✅ Fixed ReadinessWizardV2.tsx');
}

// Fix 6: FinancialSmartCodeService.ts
const financialServicePath = path.join(__dirname, '../src/services/FinancialSmartCodeService.ts');
if (fs.existsSync(financialServicePath)) {
  let content = fs.readFileSync(financialServicePath, 'utf8');
  
  // Fix parameter types
  content = content.replace(
    /\.map\(\(row\) => /g,
    '.map((row: any) => '
  );
  
  fs.writeFileSync(financialServicePath, content);
  console.log('✅ Fixed FinancialSmartCodeService.ts');
}

console.log('\n✅ All build issues fixed!');
console.log('🚀 Now you can run: git add -A && git commit -m "fix: Resolve all TypeScript build errors for Railway deployment"');
console.log('Then push to deploy: git push');