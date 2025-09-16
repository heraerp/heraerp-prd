#!/usr/bin/env node

/**
 * HERA DNA Script Generator
 * 
 * Generates a complete set of implementation scripts for any business type
 * based on the validated HERA DNA Complete Business Build Pattern
 */

const fs = require('fs');
const path = require('path');

// Get command line arguments
const args = process.argv.slice(2);
const businessType = args[0];
const businessName = args[1];

if (!businessType || !businessName) {
  console.log(`
🧬 HERA DNA Script Generator
Usage: node generate-hera-dna-scripts.js <business-type> <business-name>

Examples:
  node generate-hera-dna-scripts.js restaurant "Mario's Italian Restaurant"
  node generate-hera-dna-scripts.js healthcare "Family Medical Center"
  node generate-hera-dna-scripts.js retail "Fashion Boutique"
  node generate-hera-dna-scripts.js manufacturing "Auto Parts Factory"

Supported Business Types:
  - salon
  - restaurant  
  - healthcare
  - retail
  - manufacturing
  - professional (services)
  `);
  process.exit(1);
}

// Industry configurations
const industryConfigs = {
  salon: {
    code: 'SALON',
    services: ['Haircut', 'Hair Color', 'Hair Treatment', 'Manicure', 'Pedicure'],
    products: ['Shampoo', 'Conditioner', 'Hair Color', 'Nail Polish'],
    roles: ['Stylist', 'Colorist', 'Nail Technician', 'Manager'],
    commissionRate: 0.35
  },
  restaurant: {
    code: 'REST',
    services: ['Dine-in', 'Takeout', 'Delivery', 'Catering'],
    products: ['Appetizers', 'Main Courses', 'Desserts', 'Beverages'],
    roles: ['Chef', 'Server', 'Host', 'Manager'],
    commissionRate: 0.15 // Tips
  },
  healthcare: {
    code: 'HLTH',
    services: ['Consultation', 'Examination', 'Procedure', 'Follow-up'],
    products: ['Medications', 'Medical Supplies', 'Equipment'],
    roles: ['Doctor', 'Nurse', 'Technician', 'Receptionist'],
    commissionRate: 0.25
  },
  retail: {
    code: 'RETAIL',
    services: ['Sales Assistance', 'Personal Shopping', 'Alterations'],
    products: ['Clothing', 'Accessories', 'Shoes', 'Bags'],
    roles: ['Sales Associate', 'Cashier', 'Store Manager'],
    commissionRate: 0.10
  },
  manufacturing: {
    code: 'MFG',
    services: ['Production', 'Quality Control', 'Maintenance'],
    products: ['Raw Materials', 'Work in Progress', 'Finished Goods'],
    roles: ['Machine Operator', 'Quality Inspector', 'Supervisor'],
    commissionRate: 0.05
  },
  professional: {
    code: 'PROF',
    services: ['Consulting', 'Advisory', 'Implementation', 'Support'],
    products: ['Reports', 'Templates', 'Training Materials'],
    roles: ['Consultant', 'Analyst', 'Project Manager'],
    commissionRate: 0.20
  }
};

const config = industryConfigs[businessType] || industryConfigs.professional;

// Create output directory
const outputDir = path.join(process.cwd(), `hera-dna-${businessType}-scripts`);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

console.log(`
🧬 HERA DNA Script Generator
============================
Business Type: ${businessType}
Business Name: ${businessName}
Industry Code: ${config.code}
Output Directory: ${outputDir}

Generating scripts...
`);

// Template for package.json
const packageJson = {
  name: `hera-dna-${businessType}`,
  version: "1.0.0",
  description: `HERA DNA Implementation Scripts for ${businessName}`,
  type: "module",
  scripts: {
    "stage:all": "npm run stage:a && npm run stage:b && npm run stage:c && npm run stage:d && npm run stage:e && npm run stage:f && npm run stage:g && npm run stage:h",
    "stage:a": "node stage-a-setup-business.js",
    "stage:b": "node stage-b-generate-transactions.js",
    "stage:c": "node stage-c-validation.js",
    "stage:d": "node stage-d-auto-journal.js",
    "stage:e": "node stage-e-reporting.js",
    "stage:f": "node stage-f-commission-payroll.js",
    "stage:g": "node stage-g-inventory.js",
    "stage:h": "node stage-h-procurement.js"
  },
  dependencies: {
    "@supabase/supabase-js": "^2.39.0",
    "date-fns": "^2.30.0",
    "dotenv": "^16.3.1"
  }
};

fs.writeFileSync(
  path.join(outputDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);

// Template for .env
const envTemplate = `# HERA DNA Configuration for ${businessName}
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
DEFAULT_ORGANIZATION_ID=your_organization_id

# Business Configuration
BUSINESS_NAME="${businessName}"
BUSINESS_TYPE="${businessType}"
INDUSTRY_CODE="${config.code}"
`;

fs.writeFileSync(path.join(outputDir, '.env.template'), envTemplate);

// Generate README
const readme = `# HERA DNA Implementation: ${businessName}

This folder contains the complete HERA DNA implementation scripts for ${businessName}.

## Quick Start

1. Copy \`.env.template\` to \`.env\` and fill in your credentials
2. Run \`npm install\`
3. Execute all stages: \`npm run stage:all\`

## Individual Stage Execution

- **Stage A**: \`npm run stage:a\` - Setup business foundation
- **Stage B**: \`npm run stage:b\` - Generate transactions  
- **Stage C**: \`npm run stage:c\` - Validate financials
- **Stage D**: \`npm run stage:d\` - Setup auto-journal
- **Stage E**: \`npm run stage:e\` - Generate reports
- **Stage F**: \`npm run stage:f\` - Process commissions
- **Stage G**: \`npm run stage:g\` - Setup inventory
- **Stage H**: \`npm run stage:h\` - Create procurement

## Configuration

Business Type: **${businessType}**  
Industry Code: **${config.code}**  
Commission Rate: **${(config.commissionRate * 100).toFixed(0)}%**

## Services
${config.services.map(s => `- ${s}`).join('\n')}

## Products  
${config.products.map(p => `- ${p}`).join('\n')}

## Roles
${config.roles.map(r => `- ${r}`).join('\n')}
`;

fs.writeFileSync(path.join(outputDir, 'README.md'), readme);

// Create stub for each stage script
const stageScripts = [
  { stage: 'a', name: 'setup-business', description: 'Business Foundation Setup' },
  { stage: 'b', name: 'generate-transactions', description: 'Transaction Generation' },
  { stage: 'c', name: 'validation', description: 'Financial Validation' },
  { stage: 'd', name: 'auto-journal', description: 'Auto-Journal Setup' },
  { stage: 'e', name: 'reporting', description: 'Reporting Validation' },
  { stage: 'f', name: 'commission-payroll', description: 'Commission & Payroll' },
  { stage: 'g', name: 'inventory', description: 'Inventory & COGS' },
  { stage: 'h', name: 'procurement', description: 'Procurement & Valuation' }
];

stageScripts.forEach(({ stage, name, description }) => {
  const scriptContent = `#!/usr/bin/env node

/**
 * HERA DNA Stage ${stage.toUpperCase()}: ${description}
 * Business: ${businessName}
 * Type: ${businessType}
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Business configuration
const BUSINESS_NAME = "${businessName}"
const BUSINESS_TYPE = "${businessType}"
const INDUSTRY_CODE = "${config.code}"

async function main() {
  console.log('🚀 HERA DNA Stage ${stage.toUpperCase()}: ${description}')
  console.log('=' .repeat(60))
  console.log(\`Business: \${BUSINESS_NAME}\`)
  console.log(\`Type: \${BUSINESS_TYPE}\`)
  console.log(\`Industry: \${INDUSTRY_CODE}\`)
  console.log('=' .repeat(60))
  
  // TODO: Implement stage ${stage} logic
  // Refer to the Hair Talkz implementation for patterns
  
  console.log('\\n✅ Stage ${stage.toUpperCase()} Complete!')
}

main().catch(console.error)
`;

  fs.writeFileSync(
    path.join(outputDir, `stage-${stage}-${name}.js`),
    scriptContent
  );
  
  console.log(`  ✅ Created stage-${stage}-${name}.js`);
});

// Create validation checklist
const checklist = `# HERA DNA Implementation Checklist: ${businessName}

## Pre-Implementation
- [ ] Organization details confirmed
- [ ] Supabase credentials in .env
- [ ] Service catalog defined
- [ ] Product catalog defined
- [ ] Employee list prepared
- [ ] Initial customers identified

## Stage Execution
- [ ] Stage A: Business foundation created
- [ ] Stage B: Transactions generated (target: 85+)
- [ ] Stage C: Financial statements balanced
- [ ] Stage D: Auto-journal enabled (85%+ automation)
- [ ] Stage E: All reports generating
- [ ] Stage F: Commissions calculated correctly
- [ ] Stage G: Inventory levels set
- [ ] Stage H: Purchase orders processed

## Post-Implementation Validation  
- [ ] Trial balance: Debits = Credits
- [ ] Balance sheet: Assets = Liabilities + Equity
- [ ] P&L: Showing realistic profit margin
- [ ] Cashflow: All categories populated
- [ ] Inventory: Stock levels accurate
- [ ] Commissions: ${(config.commissionRate * 100).toFixed(0)}% calculated correctly

## Success Metrics
- [ ] Implementation time: < 4 hours
- [ ] All stages completed without errors
- [ ] System fully operational
- [ ] Users can process transactions
- [ ] Reports generate correctly

## Sign-off
- [ ] Technical validation complete
- [ ] Business validation complete
- [ ] System ready for production use

Date: ________________
Signed: ________________
`;

fs.writeFileSync(path.join(outputDir, 'CHECKLIST.md'), checklist);

console.log(`
✅ HERA DNA Scripts Generated Successfully!

Next Steps:
1. cd ${outputDir}
2. Copy .env.template to .env and add your credentials
3. npm install
4. npm run stage:all (or run stages individually)

The generated scripts provide the framework for your ${businessType} implementation.
Customize the master data in each stage script to match ${businessName}'s specific needs.

Happy building! 🚀
`);