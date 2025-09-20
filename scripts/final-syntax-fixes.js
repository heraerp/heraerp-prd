const fs = require('fs');
const path = require('path');

const fixes = [
  {
    file: 'src/app/furniture/production/tracking/page.tsx',
    fix: (content) => {
      // Fix the filter expression issue
      content = content.replace(
        /const activeOrders = productionOrders\.filter\(order => \{[\s\S]*?\}\)/,
        `const activeOrders = productionOrders?.filter(order => {
    const statusRel = relationships?.find(r => r.from_entity_id === order.id);
    const status = statusRel ? statusEntities?.find(s => s.id === statusRel.to_entity_id) : null;
    return status?.entity_code === 'STATUS-IN_PROGRESS';
  }) || []`
      );
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/products/catalog/page.tsx',
    fix: (content) => {
      // Fix columns array syntax
      content = content.replace(/const columns = \[\s*\{/, 'const columns = [\n    {');
      
      // Remove any orphaned closing braces/brackets
      content = content.replace(/\}\s*\}\s*,\s*\{/, '},\n  {');
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/quality/page.tsx',
    fix: (content) => {
      // Remove the extra closing brace
      content = content.replace(/\}\s*,\s*\}\s*,/, '},');
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/sales/customers/[id]/page.tsx',
    fix: (content) => {
      // Fix missing closing braces
      content = content.replace(
        /setFormData\(prev => \(\{ \.\.\.prev, \[name\]: value \}\)\s*\);\s*\n\s*const handleSave/,
        `setFormData(prev => ({ ...prev, [name]: value }));
  }
  
  const handleSave`
      );
      
      // Fix missing semicolons
      content = content.replace(/setError\(''\)\s+setLoading\(true\)/, "setError('');\n    setLoading(true);");
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/sales/customers/new/page.tsx',
    fix: (content) => {
      // Fix missing semicolons
      content = content.replace(
        /setLoading\(true\)\s+try\s*\{/,
        'setLoading(true);\n    try {'
      );
      
      return content;
    }
  }
];

console.log('🔧 Running final syntax fixes...\n');

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