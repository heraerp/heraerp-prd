const fs = require('fs');
const path = require('path');
const glob = require('glob');

console.log('🔧 Comprehensive Furniture Module Fix Script');
console.log('==========================================\n');

// Find all TypeScript/TSX files in the furniture directory
const furnitureFiles = glob.sync('src/**/*furniture*/**/*.{ts,tsx}', {
  cwd: path.join(__dirname, '..')
});

console.log(`Found ${furnitureFiles.length} furniture module files to check...\n`);

let totalFixes = 0;

furnitureFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  let fixes = 0;

  // Fix 1: Missing semicolons after variable declarations
  content = content.replace(/^(\s*const\s+\w+\s*=\s*[^;{]+)(\s*const\s)/gm, '$1;$2');
  content = content.replace(/^(\s*let\s+\w+\s*=\s*[^;{]+)(\s*let\s)/gm, '$1;$2');
  content = content.replace(/^(\s*var\s+\w+\s*=\s*[^;{]+)(\s*var\s)/gm, '$1;$2');

  // Fix 2: Missing semicolons before comments
  content = content.replace(/([^;{}])\s*\/\/ /gm, '$1; // ');
  
  // Fix 3: Missing spaces in async/await
  content = content.replace(/=await\s/g, '= await ');
  content = content.replace(/\sawait(\w)/g, ' await $1');

  // Fix 4: Fix object literals with missing commas
  content = content.replace(/(\w+:\s*[^,}\s]+)\s+(\w+:)/g, '$1, $2');

  // Fix 5: Fix missing semicolons after statements
  content = content.replace(/setLoading\((true|false)\)\s*}/g, 'setLoading($1);\n  }');
  content = content.replace(/setStats\(([^)]+)\)\s*}/g, 'setStats($1);\n  }');
  
  // Fix 6: Fix missing semicolons in catch blocks
  content = content.replace(/console\.error\(([^)]+)\)\s+toast/g, 'console.error($1);\n    toast');
  
  // Fix 7: Fix missing semicolons after router.push
  content = content.replace(/router\.push\(([^)]+)\)\s*}/g, 'router.push($1);\n  }');
  
  // Fix 8: Fix async function declarations
  content = content.replace(/const\s+(\w+)\s*=\s*async\s*\(\)\s*=>\s*{\s*([^}])/g, 'const $1 = async () => {\n  $2');
  
  // Fix 9: Fix incomplete interface declarations
  content = content.replace(/(\w+):\s*{\s*(\w+):\s*(\w+)\s+(\w+):/g, '$1: {\n    $2: $3;\n    $4:');
  
  // Fix 10: Fix return statements
  content = content.replace(/\)(\s*)catch\s*\(/g, ');\n  } catch (');
  
  // Fix 11: Fix JSX syntax issues
  content = content.replace(/>}\s*</g, '>}<');
  
  // Fix 12: Fix switch case statements
  content = content.replace(/case\s+'([^']+)':\s*return\s*\(\s*([^)]+)\)\s*case/g, 'case \'$1\':\n        return $2;\n      case');
  
  // Fix 13: Fix export const dynamic
  content = content.replace(/export\s+const\s+dynamic\s*=\s*'force-dynamic'\s*\/\//g, 'export const dynamic = \'force-dynamic\';\n\n//');
  
  // Fix 14: Fix array declarations
  content = content.replace(/\]\s+const\s+(\w+)\s*=/g, '];\n\nconst $1 =');
  
  // Fix 15: Fix missing closing braces in functions
  if (content.includes('return <Icon className={cn(\'h-5 w-5\', config.color)} /> }')) {
    content = content.replace('return <Icon className={cn(\'h-5 w-5\', config.color)} /> }', 'return <Icon className={cn(\'h-5 w-5\', config.color)} />;\n}');
  }

  // Fix 16: Fix missing semicolons after variable assignments
  content = content.replace(/^(\s*)(const|let|var)\s+(\w+)\s*=\s*([^;{]+)$/gm, '$1$2 $3 = $4;');
  
  // Fix 17: Fix array/object spread missing semicolons
  content = content.replace(/\.\.\.(\w+)\]\s*const/g, '...$1];\nconst');
  
  // Fix 18: Fix stats object issue in customers page
  if (file.includes('customers/page.tsx')) {
    content = content.replace(/}\s*;\s*if\s*\(\s*orgLoading\s*\)\s*{/, '};\n\n  if (orgLoading) {');
  }

  // Count fixes
  fixes = originalContent !== content ? 1 : 0;
  
  if (fixes > 0) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed: ${file}`);
    totalFixes++;
  }
});

console.log(`\n✨ Total files fixed: ${totalFixes}`);
console.log('\n🎯 Next steps:');
console.log('1. Run npm run build to check if errors are resolved');
console.log('2. Fix any remaining specific errors manually');
console.log('3. Run npm run predeploy when ready');