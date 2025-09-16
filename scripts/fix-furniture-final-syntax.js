#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Find all TypeScript and TSX files in furniture module
function findFurnitureFiles() {
  const furniturePath = path.join(process.cwd(), 'src/app/furniture');
  const componentsPath = path.join(process.cwd(), 'src/components/furniture');
  const files = [];

  function walkDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDir(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }

  walkDir(furniturePath);
  walkDir(componentsPath);
  return files;
}

// Fix patterns
function fixFileContent(content, filePath) {
  let fixed = content;
  let changesMade = false;

  // Fix imports on same line
  const importPatterns = [
    // Multi-line imports compressed on one line
    /import\s*{\s*([^}]+),\s*([^}]+)\s*}\s*from/g,
    // Icons on same line with other imports
    /([A-Z]\w+),\s*([A-Z]\w+),\s*([A-Z]\w+),\s*([A-Z]\w+)/g
  ];

  // Fix compressed variable declarations with return statements
  fixed = fixed.replace(/const\s+(\w+)\s*=\s*([^=]+)return\s+/g, (match, varName, varValue) => {
    changesMade = true;
    return `const ${varName} = ${varValue}\n    return `;
  });

  // Fix compressed if statements
  fixed = fixed.replace(/}\s*return\s+(\w+)/g, (match, returnValue) => {
    changesMade = true;
    return `}\n    return ${returnValue}`;
  });

  // Fix compressed const declarations with immediate returns
  fixed = fixed.replace(/const\s+Icon\s*=categoryIcons/g, (match) => {
    changesMade = true;
    return 'const Icon = categoryIcons';
  });

  // Fix missing semicolons and line breaks
  fixed = fixed.replace(/}\)const\s+/g, '})\n\nconst ');
  fixed = fixed.replace(/}\s+\/\/\s+/g, '}\n\n// ');
  
  // Fix compressed hook calls
  fixed = fixed.replace(/const\s*{\s*([^}]+)\s*}\s*=\s*use(\w+)\(\);const/g, (match, destructured, hookName) => {
    changesMade = true;
    return `const { ${destructured} } = use${hookName}();\n  const`;
  });

  // Fix comments on same line as code
  fixed = fixed.replace(/\/\/\s+([^\n]+)\s+const\s+/g, (match, comment) => {
    changesMade = true;
    return `// ${comment}\n  const `;
  });

  // Fix compressed useState declarations
  fixed = fixed.replace(/useState\(''\);const/g, "useState('');\n  const");
  fixed = fixed.replace(/useState\(null\);const/g, "useState(null);\n  const");
  fixed = fixed.replace(/useState\(false\);const/g, "useState(false);\n  const");
  fixed = fixed.replace(/useState\(\[\]\);const/g, "useState([]);\n  const");

  // Fix compressed object property assignments
  fixed = fixed.replace(/(\w+):\s*(\w+),(\w+):/g, (match, key1, val1, key2) => {
    changesMade = true;
    return `${key1}: ${val1},\n    ${key2}:`;
  });

  // Fix specific pattern in ai-manager renderMessage
  if (filePath.includes('ai-manager')) {
    const renderMessagePattern = /const renderMessage = \(message: AIMessage\) => \{ const isUser[^}]+\} \} \/\/ Show loading state if \(orgLoading\) \{/gs;
    if (renderMessagePattern.test(fixed)) {
      changesMade = true;
      fixed = fixed.replace(renderMessagePattern, `const renderMessage = (message: AIMessage) => {
    const isUser = message.type === 'user'
    const isInsight = message.type === 'insight'
    const isSystem = message.type === 'system'

    return (
      <div key={message.id} className={cn(
            'flex gap-3',
            isUser ? 'justify-end' : 'justify-start'
          )}>
        {!isUser && (
          <div
            className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
              isInsight ? 'bg-yellow-500/20' : 'bg-[var(--color-body)]/20'
            )}
          >
            {isInsight ? (
              <Lightbulb className="h-4 w-4 text-yellow-500" />
            ) : (
              <Brain className="h-4 w-4 text-[#37353E]" />
            )}
          </div>
        )}
        <div
          className={cn(
            'max-w-[80%] rounded-lg p-4',
            isUser
              ? 'bg-[var(--color-body)] text-[var(--color-text-primary)]'
              : isInsight
                ? 'bg-yellow-500/10 border border-yellow-500/30'
                : isSystem
                  ? 'bg-[var(--color-body)]/10 border border-[var(--color-accent-teal)]/30'
                  : 'bg-muted-foreground/10'
          )}
        >
          {message.priority && !isUser && (
            <Badge
              variant="outline"
              className={cn(
                'mb-2',
                message.priority === 'high'
                  ? 'border-red-500 text-red-500'
                  : message.priority === 'medium'
                    ? 'border-yellow-500 text-yellow-500'
                    : 'border-green-500 text-green-500'
              )}
            >
              {message.priority.toUpperCase()} PRIORITY
            </Badge>
          )}
          <p className={cn(
            'whitespace-pre-wrap',
            isInsight && 'font-medium'
          )}>{message.content}</p>
        </div>
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4" />
          </div>
        )}
      </div>
    )
  }

  // Show loading state
  if (orgLoading) {`);
    }
  }

  // Fix missing spaces in JSX
  fixed = fixed.replace(/className="([^"]+)">/g, (match, className) => {
    return `className="${className}">`;
  });

  // Fix export statements in index files
  if (filePath.includes('index.ts')) {
    // Fix export on same line as from
    fixed = fixed.replace(/export\s*{\s*(\w+)\s*}from\s*'([^']+)'/g, (match, exportName, importPath) => {
      changesMade = true;
      return `export { ${exportName} }\nfrom '${importPath}'`;
    });
  }

  return { content: fixed, changed: changesMade };
}

// Main execution
console.log('🔧 Finding furniture module files...');
const files = findFurnitureFiles();
console.log(`📁 Found ${files.length} files to check`);

let totalFixed = 0;
const fixedFiles = [];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const { content: fixed, changed } = fixFileContent(content, file);
  
  if (changed || content !== fixed) {
    fs.writeFileSync(file, fixed, 'utf8');
    totalFixed++;
    fixedFiles.push(path.relative(process.cwd(), file));
  }
});

console.log(`\n✅ Fixed ${totalFixed} files with syntax issues:`);
fixedFiles.forEach(file => {
  console.log(`   - ${file}`);
});

console.log('\n✨ Furniture module syntax fix complete!');