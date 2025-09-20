const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/app/furniture/production/tracking/page.tsx',
    fix: (content) => {
      // Fix Button semicolon issue
      content = content.replace(/<Button;/g, '<Button');
      content = content.replace(/<Badge;/g, '<Badge');
      
      // Remove standalone semicolons
      content = content.replace(/^\s*;\s*$/gm, '');
      
      // Fix misc syntax
      content = content.replace(/comp;leted/g, 'completed');
      content = content.replace(/comp;letedOperations/g, 'completedOperations');
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/products/catalog/page.tsx',
    fix: (content) => {
      // Fix Badge semicolon
      content = content.replace(/<Badge;/g, '<Badge');
      content = content.replace(/<Button;/g, '<Button');
      
      // Fix string with semicolon
      content = content.replace(/text-\[;var/g, 'text-[var');
      
      // Fix misc syntax issues
      content = content.replace(/value;}/g, 'value}');
      content = content.replace(/\s+\),\s*\[products/g, '), [products');
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/quality/page.tsx',
    fix: (content) => {
      // Fix the literal \n in JSX
      content = content.replace(/<\/span>;\\n\s*}\\n\s*}/g, '</span>;\n    }\n  }');
      
      // Remove standalone semicolons
      content = content.replace(/^\s*;\s*$/gm, '');
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/sales/customers/[id]/page.tsx',
    fix: (content) => {
      // Fix metrics declaration
      content = content.replace(
        /\/\/ Calculate customer metrics\s*\n\s*const metrics = {/,
        '// Calculate customer metrics\n  const metrics = {'
      );
      
      // Fix the long line with missing semicolon
      content = content.replace(
        /\[0\]\?\.transaction_date } if \(orgLoading \|\| !customer\) {;/,
        '[0]?.transaction_date\n  };\n\n  if (orgLoading || !customer) {'
      );
      
      // Fix closing braces
      content = content.replace(/\)\s*}\s*$/, ');\n}');
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/sales/customers/new/page.tsx',
    fix: (content) => {
      // Fix dynamic field iteration
      content = content.replace(
        /await universalApi\.setDynamicField\( customer\.data\.id, field\.field_name, field\.field_type === 'number' \? field\.field_value_number! : field\.field_value_text!, `HERA\.FURNITURE\.CUSTOMER\.\${field\.field_name\.toUpperCase\(\)}\.v1`\s*\) }/,
        `await universalApi.setDynamicField(
          customer.data.id,
          field.field_name,
          field.field_type === 'number' ? field.field_value_number! : field.field_value_text!,
          \`HERA.FURNITURE.CUSTOMER.\${field.field_name.toUpperCase()}.v1\`
        );
      }
    }`
      );
      
      // Fix navigation comment
      content = content.replace(
        /\/\/ Navigate to the customers list router\.push/,
        '// Navigate to the customers list\n    router.push'
      );
      
      // Fix error handling
      content = content.replace(
        /router\.push\('\/furniture\/sales\/customers'\)\s*}\s*catch/,
        "router.push('/furniture/sales/customers');\n  } catch"
      );
      
      // Fix console.error line
      content = content.replace(
        /console\.error\('Error creating customer:', err\) setError/,
        "console.error('Error creating customer:', err);\n    setError"
      );
      
      // Fix loading state check
      content = content.replace(/} if \(orgLoading\) {;/, '}\n\n  if (orgLoading) {');
      
      return content;
    }
  }
];

console.log('🔧 Running comprehensive furniture fixes...\n');

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