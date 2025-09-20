const fs = require('fs');
const path = require('path');

// Specific fixes for each file based on the error messages
const fixes = [
  {
    file: 'src/app/furniture/production/tracking/page.tsx',
    fix: (content) => {
      // Fix export statement
      content = content.replace(/export;\s*const dynamic = ';force-dynamic'/, "export const dynamic = 'force-dynamic'");
      
      // Fix line 50 issue
      content = content.replace(
        /const status = statusRel \? statusEntities\.find\(s => s\.id === statusRel\.to_entity_id\) : null return/g,
        "const status = statusRel ? statusEntities.find(s => s.id === statusRel.to_entity_id) : null;\n    return"
      );
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/products/catalog/page.tsx',
    fix: (content) => {
      // Fix export statement
      content = content.replace(/export;\s*const dynamic = ';force-dynamic'/, "export const dynamic = 'force-dynamic'");
      
      // Fix the category render issue - ensure proper closing
      content = content.replace(
        /\}\s*\},\s*{\s*key:\s*'category'/g,
        "}\n  },\n  {\n    key: 'category'"
      );
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/quality/page.tsx',
    fix: (content) => {
      // Fix export statement
      content = content.replace(/export;\s*const dynamic = ';force-dynamic'/, "export const dynamic = 'force-dynamic'");
      
      // Fix the batch_number column issue
      content = content.replace(
        /<\/p>\s*<\/div>\s*\),\s*{\s*key:\s*'batch_number'/g,
        "</p>\n      </div>\n    )\n  },\n  {\n    key: 'batch_number'"
      );
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/sales/customers/[id]/page.tsx',
    fix: (content) => {
      // Remove extra semicolons at the beginning of lines
      content = content.replace(/^\s*;\s*$/gm, '');
      
      // Fix the fieldName typo
      content = content.replace(/fieldName\)e\);/, 'fieldName);');
      
      // Fix the setFormData issue - needs to be in useEffect
      content = content.replace(
        /return field\?\.field_value_text.*setFormData\({.*}\s*,\s*\[customer,\s*dynamicData\]\);/s,
        `return field?.field_value_text || field?.field_value_number?.toString() || '';
    }
    
    setFormData({
      entity_name: customer.entity_name,
      entity_code: customer.entity_code || '',
      email: getFieldValue('email'),
      phone: getFieldValue('phone'),
      mobile: getFieldValue('mobile'),
      address: getFieldValue('address'),
      city: getFieldValue('city'),
      state: getFieldValue('state'),
      pincode: getFieldValue('pincode'),
      gstin: getFieldValue('gstin'),
      pan_number: getFieldValue('pan_number'),
      contact_person: getFieldValue('contact_person'),
      credit_limit: getFieldValue('credit_limit'),
      payment_terms: getFieldValue('payment_terms') || 'Net 30',
      notes: getFieldValue('notes')
    });
  }
}, [customer, dynamicData])`
      );
      
      return content;
    }
  },
  {
    file: 'src/app/furniture/sales/customers/new/page.tsx',
    fix: (content) => {
      // Remove extra semicolons at the beginning of lines
      content = content.replace(/^\s*;\s*$/gm, '');
      
      // Fix template literal issue
      content = content.replace(/\$\{prefix;\}/, '${prefix}');
      
      // Fix missing semicolon after preventDefault
      content = content.replace(/e\.preventDefault\(\)\s+setError/, "e.preventDefault();\n    setError");
      
      return content;
    }
  }
];

console.log('🔧 Fixing specific build errors...\n');

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