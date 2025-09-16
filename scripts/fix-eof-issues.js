#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/salon/whatsapp/WhatsAppCampaignManager.tsx',
  'src/components/navigation/NavigationLoadingProvider.tsx',
  'src/components/navigation/NavigationLink.tsx',
  'src/components/isp/ISPForm.tsx',
  'src/components/isp/ISPTable.tsx',
  'src/components/whatsapp/BookingAutomationPanel.tsx'
];

console.log('🔧 Fixing EOF issues in files...\n');

filesToFix.forEach(file => {
  try {
    const filePath = path.join(process.cwd(), file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Remove the problematic EOF line
    const fixedContent = content.replace(/\nEOF < \/dev\/null\s*$/, '');
    
    fs.writeFileSync(filePath, fixedContent);
    console.log(`✅ Fixed: ${file}`);
  } catch (error) {
    console.log(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log('\n✅ EOF issues fixed!');