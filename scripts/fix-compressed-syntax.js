#!/usr/bin/env node

const fs = require('fs').promises;
const path = require('path');

// Files to check and fix
const filesToFix = [
  'src/components/furniture/NewSalesOrderModal.tsx',
  'src/app/furniture/products/catalog/page.tsx',
  'src/app/furniture/production/tracking/page.tsx',
  'src/app/furniture/tender/watchlist/page.tsx',
  'src/app/furniture/tender/documents/page.tsx'
];

// Patterns to fix
const fixPatterns = [
  {
    // Fix compressed useState with comments on same line
    pattern: /^(\s*)(const\s+\[[^\]]+\]\s*=\s*useState[^)]+\))\s*\/\/(.*)$/gm,
    replacement: '$1$2\n$1// $3'
  },
  {
    // Fix compressed multiple imports on single line
    pattern: /^(\s*import\s*{[^}]*),\s*([A-Z][a-zA-Z0-9]*(?:,\s*[A-Z][a-zA-Z0-9]*)*)\s*$/gm,
    replacement: (match, imports, icons) => {
      const indent = imports.match(/^\s*/)[0];
      const iconList = icons.split(',').map(icon => icon.trim()).filter(Boolean);
      return `${imports},\n${indent}  ${iconList.join(', ')}`;
    }
  },
  {
    // Fix compressed object declarations
    pattern: /^(\s*)(const\s+\w+\s*=\s*{)([^}]+)}(\s*)$/gm,
    replacement: (match, indent, start, content, end) => {
      // Only fix if content has multiple properties
      if (content.includes(',') && content.length > 50) {
        const props = content.split(',').map(prop => prop.trim()).filter(Boolean);
        const propIndent = indent + '  ';
        return `${start}\n${propIndent}${props.join(',\n' + propIndent)}\n${indent}}`;
      }
      return match;
    }
  },
  {
    // Fix compressed JSX with comments
    pattern: /^(\s*)(.+)\s*}\s*\/\/(.*)$/gm,
    replacement: (match, indent, code, comment) => {
      // Only fix if it looks like compressed code
      if (code.includes('}') && !code.trim().startsWith('//')) {
        return `${indent}${code}\n${indent}} // ${comment.trim()}`;
      }
      return match;
    }
  },
  {
    // Fix multiple useEffect or similar hooks on same line
    pattern: /}\s*(useEffect|useState|useMemo|useCallback)\s*\(/g,
    replacement: '}\n\n$1('
  },
  {
    // Fix compressed variable declarations with long initialization
    pattern: /^(\s*)(const\s+\w+\s*=\s*.+)\s+(const\s+\w+\s*=)/gm,
    replacement: '$1$2\n$1$3'
  },
  {
    // Fix interface properties on single line
    pattern: /^(\s*)(\w+:\s*{)([^}]{50,})}$/gm,
    replacement: (match, indent, start, content) => {
      const props = content.split(/\s+(?=\w+:)/).map(prop => prop.trim()).filter(Boolean);
      if (props.length > 2) {
        const propIndent = indent + '  ';
        return `${start}\n${propIndent}${props.join('\n' + propIndent)}\n${indent}}`;
      }
      return match;
    }
  }
];

async function fixFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    let fixedContent = content;
    let changesMade = false;

    // Apply all fix patterns
    for (const { pattern, replacement } of fixPatterns) {
      const newContent = fixedContent.replace(pattern, replacement);
      if (newContent !== fixedContent) {
        changesMade = true;
        fixedContent = newContent;
      }
    }

    // Special handling for specific known issues
    if (filePath.includes('NewSalesOrderModal.tsx')) {
      // Fix line 97 specifically
      fixedContent = fixedContent.replace(
        /tax_percent: 5 \/\/ GST }\) \/\/ Data loading const/g,
        'tax_percent: 5 // GST\n  })\n\n  // Data loading\n  const'
      );
      
      // Fix compressed useEffect declarations
      fixedContent = fixedContent.replace(
        /}\s*},\s*\[[^\]]+\]\)\s*useEffect/g,
        '}\n  }, [isOpen, organizationId, hasValidOrganization])\n\n  useEffect'
      );
      
      fixedContent = fixedContent.replace(
        /setFiltered(Customers|Products)\(filtered\)\s*}\s*else\s*{\s*setFiltered/g,
        (match, type) => `setFiltered${type}(filtered)\n    } else {\n      setFiltered`
      );
      
      fixedContent = fixedContent.replace(
        /}\s*},\s*\[(customerSearchTerm|productSearchTerm),\s*(customers|products)\]\)/g,
        (match, term, data) => `}\n  }, [${term}, ${data}])`
      );
      
      fixedContent = fixedContent.replace(
        /loadData\(\)\s*}\s*},/g,
        'loadData()\n    }\n  },'
      );
      
      fixedContent = fixedContent.replace(
        /const loadData = async \(\) => {\s*try\s*{\s*if/g,
        'const loadData = async () => {\n    try {\n      if'
      );
      
      fixedContent = fixedContent.replace(
        /console\.error\('No organization ID available'\)\s*return\s*}\s*universalApi/g,
        'console.error(\'No organization ID available\')\n        return\n      }\n\n      universalApi'
      );
    }

    if (filePath.includes('catalog/page.tsx')) {
      // Fix category icons and colors
      fixedContent = fixedContent.replace(
        /}\s*\/\/\s*Category icons mapping/g,
        '}\n\n// Category icons mapping'
      );
      
      fixedContent = fixedContent.replace(
        /const categoryIcons = {\s*office: Briefcase,\s*seating: Sofa,\s*tables: Square,\s*storage: Grid3x3,\s*beds: Bed\s*}/g,
        `const categoryIcons = {
  office: Briefcase,
  seating: Sofa,
  tables: Square,
  storage: Grid3x3,
  beds: Bed
}`
      );
      
      fixedContent = fixedContent.replace(
        /}\s*\/\/\s*Category colors mapping/g,
        '}\n\n// Category colors mapping'
      );
      
      fixedContent = fixedContent.replace(
        /const categoryColors = {\s*([^}]+)\s*}/g,
        (match, content) => {
          const colors = content.split(',').map(c => c.trim()).filter(Boolean);
          return `const categoryColors = {\n  ${colors.join(',\n  ')}\n}`;
        }
      );
    }

    if (filePath.includes('tracking/page.tsx')) {
      // Fix compressed data loading declarations
      fixedContent = fixedContent.replace(
        /}\)\s*\/\/\s*Load\s+([^{]+)\s*const\s*{/g,
        '})\n\n  // Load $1\n  const {'
      );
      
      fixedContent = fixedContent.replace(
        /enabled: !!organizationId\s*}\)\s*if\s*\(orgLoading\)/g,
        'enabled: !!organizationId\n  })\n\n  if (orgLoading)'
      );
      
      fixedContent = fixedContent.replace(
        /return <OrganizationLoading \/>\s*}\s*\/\/\s*Get/g,
        'return <OrganizationLoading />\n  }\n\n  // Get'
      );
    }

    if (filePath.includes('documents/page.tsx')) {
      // Fix interface metadata on single line
      fixedContent = fixedContent.replace(
        /metadata:\s*{\s*file_name:\s*string\s+file_size:\s*number\s+file_type:\s*string\s+([^}]+)}/g,
        (match, rest) => {
          const props = rest.split(/\s+(?=\w+:)/).map(p => p.trim()).filter(Boolean);
          return `metadata: {
    file_name: string
    file_size: number
    file_type: string
    ${props.join('\n    ')}
  }`;
        }
      );
    }

    if (changesMade) {
      await fs.writeFile(fullPath, fixedContent, 'utf8');
      console.log(`✅ Fixed compressed syntax in: ${filePath}`);
      return true;
    } else {
      console.log(`ℹ️  No compressed syntax found in: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔧 Fixing compressed syntax in furniture module files...\n');
  
  let totalFixed = 0;
  
  for (const file of filesToFix) {
    const fixed = await fixFile(file);
    if (fixed) totalFixed++;
  }
  
  console.log(`\n✨ Complete! Fixed ${totalFixed} out of ${filesToFix.length} files.`);
  
  if (totalFixed > 0) {
    console.log('\n📝 Next steps:');
    console.log('1. Review the changes to ensure they look correct');
    console.log('2. Run "npm run lint" to check for any remaining issues');
    console.log('3. Run "npm run dev" to test the application');
  }
}

main().catch(console.error);