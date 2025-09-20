const fs = require('fs');
const path = require('path');

// Files with syntax errors from build output
const filesToFix = [
  'src/app/furniture/production/tracking/page.tsx',
  'src/app/furniture/products/catalog/page.tsx', 
  'src/app/furniture/quality/page.tsx',
  'src/app/furniture/sales/customers/[id]/page.tsx',
  'src/app/furniture/sales/customers/new/page.tsx'
];

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;
    
    // Fix missing semicolons before return statements
    content = content.replace(/(\s*)(return\s+)/g, ';\n$1$2');
    
    // Fix compressed filter/map/find statements
    content = content.replace(/(\w+)\.filter\((\w+)\s*=>\s*{([^}]+)}([^)]*)\)/g, (match, arr, param, body, rest) => {
      // Clean up the body and ensure proper line breaks
      let cleanBody = body.replace(/;\s*(?=\w)/g, ';\n    ');
      return `${arr}.filter(${param} => {\n    ${cleanBody}\n  })`;
    });
    
    // Fix missing semicolons between statements
    content = content.replace(/(\))(\s*)(const|let|var|return|if|for|while)/g, '$1;$2$3');
    content = content.replace(/(\w)(\s+)(const|let|var|return|if|for|while)/g, '$1;$2$3');
    
    // Fix inline object/array declarations
    content = content.replace(/(const|let|var)\s+(\w+)\s*=\s*([{[])/g, '$1 $2 = $3');
    
    // Fix missing semicolons after variable declarations
    content = content.replace(/(const|let|var)\s+(\w+)\s*=\s*([^;{}\n]+)(\s*)(const|let|var|return|if|for|while)/g, '$1 $2 = $3;$4$5');
    
    // Fix compressed object properties
    content = content.replace(/,\s*{(\s*key:)/g, ',\n  {\n    $1');
    
    // Fix return statements without semicolons
    content = content.replace(/return\s+([^;}\n]+)(\s*})/g, 'return $1;$2');
    
    // Fix missing closing parentheses
    content = content.replace(/\)\s*,\s*{/g, '),\n  {');
    
    // Fix specific patterns from error messages
    // Fix: "null return status" pattern
    content = content.replace(/:\s*null\s+return\s+/g, ': null;\n    return ');
    
    // Fix: missing semicolon before const
    content = content.replace(/([^;{}])\s+(const|let|var)\s+/g, '$1;\n  $2 ');
    
    // Fix: field name typo
    content = content.replace(/field\.field_name === fieldNam\s*$/gm, 'field.field_name === fieldName');
    
    // Fix specific syntax issues
    // Fix production/tracking/page.tsx line 50
    content = content.replace(
      /const status = statusRel \? statusEntities\.find\(s => s\.id === statusRel\.to_entity_id\) : null return status\?\.entity_code === 'STATUS-IN_PROGRESS'/g,
      "const status = statusRel ? statusEntities.find(s => s.id === statusRel.to_entity_id) : null;\n    return status?.entity_code === 'STATUS-IN_PROGRESS';"
    );
    
    // Fix products/catalog/page.tsx line 58
    content = content.replace(
      /\)\s*}\s*},\s*{\s*key:\s*'category'/g,
      ");\n    }\n  },\n  {\n    key: 'category'"
    );
    
    // Fix quality/page.tsx line 36
    content = content.replace(
      /\),\s*{\s*key:\s*'batch_number'/g,
      ")\n    }\n  },\n  {\n    key: 'batch_number'"
    );
    
    // Fix sales/customers/[id]/page.tsx line 40
    content = content.replace(
      /const field =dynamicData\.find\(d => d\.field_name === fieldNam/g,
      "const field = dynamicData.find(d => d.field_name === fieldName)"
    );
    
    // Fix sales/customers/new/page.tsx line 41
    content = content.replace(
      /e\.target setFormData/g,
      "e.target;\n    setFormData"
    );
    
    // Fix sales/customers/new/page.tsx line 44
    content = content.replace(
      /const prefix ='CUST' const timestamp/g,
      "const prefix = 'CUST';\n    const timestamp"
    );
    
    // Fix useEffect patterns
    content = content.replace(
      /}\s*}\s*,\s*\[customer, dynamicData\]\)/g,
      "    });\n  }\n}, [customer, dynamicData])"
    );

    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No changes needed for ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing remaining build errors...\n');

let fixedCount = 0;
filesToFix.forEach(file => {
  const fullPath = path.join(process.cwd(), file);
  if (fs.existsSync(fullPath)) {
    if (fixFile(fullPath)) {
      fixedCount++;
    }
  } else {
    console.log(`⚠️  File not found: ${file}`);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files with syntax errors`);