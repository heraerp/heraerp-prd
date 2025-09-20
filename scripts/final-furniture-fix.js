const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/app/furniture/production/tracking/page.tsx',
    fix: (content) => {
      // Remove standalone semicolons
      content = content.replace(/^\s*;\s*$/gm, '');
      
      // Fix the activeOrders filter
      content = content.replace(
        /const activeOrders = productionOrders\.filter\(order => \{[\s\S]*?\}\)/,
        `const activeOrders = productionOrders.filter(order => {
    const statusRel = relationships.find(r => r.from_entity_id === order.id);
    const status = statusRel ? statusEntities.find(s => s.id === statusRel.to_entity_id) : null;
    return status?.entity_code === 'STATUS-IN_PROGRESS';
  })`
      );
      
      // Remove extra semicolons after comments
      content = content.replace(/\/\/ Overall statistics;\s*;/g, '\n  // Overall statistics');
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/products/catalog/page.tsx',
    fix: (content) => {
      // Fix the columns array structure
      content = content.replace(
        /const columns = \[[\s\S]*?\n\s*{\s*key: 'entity_name'/,
        `const columns = [
    {
      key: 'entity_code',
      label: 'SKU',
      sortable: true,
      width: '120px',
      render: (value: string) => <span className="font-mono text-sm">{value}</span>
    },
    {
      key: 'entity_name'`
      );
      
      // Remove standalone semicolons
      content = content.replace(/^\s*;\s*$/gm, '');
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/quality/page.tsx',
    fix: (content) => {
      // Fix the inspectionColumns array structure
      content = content.replace(
        /const inspectionColumns = \[[\s\S]*?\],\s*{/m,
        (match) => {
          // Ensure proper closing of array elements
          return match.replace(/\)\s*}\s*},\s*{/g, ')\n    }\n  },\n  {');
        }
      );
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/sales/customers/[id]/page.tsx',
    fix: (content) => {
      // Fix the useEffect structure
      content = content.replace(
        /form data from customer and dynamic data useEffect\(\(\) => \{/,
        'form data from customer and dynamic data\n  useEffect(() => {'
      );
      
      // Fix semicolons in type assertions
      content = content.replace(/as;\s*const/g, 'as const');
      
      // Remove duplicate semicolons
      content = content.replace(/;\s*;/g, ';');
      
      // Fix metrics calculation
      content = content.replace(
        /Calculate customer metrics;\s*\n\s*const metrics/,
        'Calculate customer metrics\n  const metrics'
      );
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/sales/customers/new/page.tsx',
    fix: (content) => {
      // Fix return statement
      content = content.replace(/return\s*}\s*setLoading/, 'return;\n    }\n    setLoading');
      
      // Fix const declarations
      content = content.replace(/const prefix = 'CUST'\s*;const/, "const prefix = 'CUST';\n    const");
      
      // Fix customerCode assignment
      content = content.replace(/const customerCode =\s*;\s*formData/, 'const customerCode = formData');
      
      // Fix semicolons in type assertions
      content = content.replace(/as;\s*const/g, 'as const');
      
      // Fix missing closing braces
      content = content.replace(
        /field_type: 'text' as;\s*\n\s*const \} \]/,
        "field_type: 'text' as const\n    }\n  ]"
      );
      
      // Remove extra semicolons after comments
      content = content.replace(/\/\/[^;]*;\s*;/g, (match) => match.replace(/;\s*;/, ''));
      
      return content;
    }
  }
];

console.log('🔧 Running final furniture fixes...\n');

let fixedCount = 0;

fixes.forEach(({ file, fix }) => {
  const fullPath = path.join(process.cwd(), file);
  
  try {
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${file}`);
      return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    content = fix(content);
    
    if (content !== originalContent) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✅ Fixed ${file}`);
      fixedCount++;
    } else {
      console.log(`ℹ️  No changes needed for ${file}`);
    }
  } catch (error) {
    console.error(`❌ Error fixing ${file}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);
console.log('\nNow running prettier to format all files...');

const { execSync } = require('child_process');
try {
  execSync('npx prettier --write src/app/furniture/**/*.{ts,tsx}', { stdio: 'inherit' });
  console.log('✅ Prettier formatting complete');
} catch (error) {
  console.log('⚠️  Prettier formatting failed, but files are fixed');
}