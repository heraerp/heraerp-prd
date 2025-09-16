#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files with syntax errors
const filesToFix = [
  'src/app/furniture/ai-manager/page.tsx',
  'src/app/furniture/digital-accountant/page.tsx',
  'src/app/furniture/finance/chart-of-accounts/page.tsx'
];

// Function to fix interface property syntax
function fixInterfaceProperties(content) {
  // Fix interface properties missing semicolons
  content = content.replace(
    /metrics\?\: \{ label\: string value\: string \| number trend\?\: 'up' \| 'down' \| 'stable' change\?\: number\s*\}\[\]/g,
    "metrics?: {\n    label: string;\n    value: string | number;\n    trend?: 'up' | 'down' | 'stable';\n    change?: number;\n  }[]"
  );
  
  // Fix journal entry interface
  content = content.replace(
    /journalEntry\?\: \{ debits\: Array<\{ account\: string; amount\: number\s*\}>/g,
    "journalEntry?: {\n    debits: Array<{ account: string; amount: number }>"
  );
  
  return content;
}

// Function to fix compressed useEffect and imports
function fixCompressedCode(content) {
  // Fix import statements on same line as JSDoc comments
  content = content.replace(
    /\*\/ import React, \{ useState, useRef, useEffect \}$/gm,
    '*/\nimport React, { useState, useRef, useEffect }'
  );
  
  // Fix compressed useEffect patterns
  content = content.replace(
    /const inputRef = useRef<HTMLInputElement>\(null\) \/\/ Auto-scroll to bottom useEffect\(\(\) => \{/g,
    'const inputRef = useRef<HTMLInputElement>(null)\n\n  // Auto-scroll to bottom\n  useEffect(() => {'
  );
  
  // Fix scrollToBottom function definition
  content = content.replace(
    /const scrollToBottom = \(\) => \{ if \(scrollAreaRef\.current\) \{$/gm,
    '    const scrollToBottom = () => {\n      if (scrollAreaRef.current) {'
  );
  
  // Fix viewport access
  content = content.replace(
    /const viewport = scrollAreaRef\.current\.querySelector\('\[data-radix-scroll-area-viewport\]'\) if \(viewport\) \{$/gm,
    '        const viewport = scrollAreaRef.current.querySelector(\'[data-radix-scroll-area-viewport]\')\n        if (viewport) {'
  );
  
  // Fix scrollTo call
  content = content.replace(
    /viewport\.scrollTo\(\{ top: viewport\.scrollHeight, behavior: 'smooth' \}\) \} \} \}$/gm,
    '          viewport.scrollTo({ top: viewport.scrollHeight, behavior: \'smooth\' })\n        }\n      }\n    }'
  );
  
  // Fix timer cleanup
  content = content.replace(
    /const timer = setTimeout\(\(\) => \{ requestAnimationFrame\(scrollToBottom\) \}, 50\) return \(\) => clearTimeout\(timer\) \}, \[messages\]\)/g,
    '\n    const timer = setTimeout(() => {\n      requestAnimationFrame(scrollToBottom)\n    }, 50)\n    \n    return () => clearTimeout(timer)\n  }, [messages])'
  );
  
  // Fix setInterval useEffect
  content = content.replace(
    /const timer = setTimeout\(\(\) => \{ requestAnimationFrame\(scrollToBottom\) \}, 50\) return \(\) => clearTimeout\(timer\) \}, \[messages\]\) \/\/ Simulate real-time metric updates useEffect\(\(\) => \{ const interval = setInterval\(\(\) => \{/g,
    'const timer = setTimeout(() => {\n      requestAnimationFrame(scrollToBottom)\n    }, 50)\n    \n    return () => clearTimeout(timer)\n  }, [messages])\n\n  // Simulate real-time metric updates\n  useEffect(() => {\n    const interval = setInterval(() => {'
  );
  
  // Fix empty interval body
  content = content.replace(
    /\/\/ In production, this would fetch real data \/\/ For now, we'll just slightly modify the metrics \}, 30000\) \/\/ Update every 30 seconds return \(\) => clearInterval\(interval\) \}, \[\]\)/g,
    '      // In production, this would fetch real data\n      // For now, we\'ll just slightly modify the metrics\n    }, 30000) // Update every 30 seconds\n    \n    return () => clearInterval(interval)\n  }, [])'
  );
  
  // Fix component definitions on same line as imports
  content = content.replace(
    /'react' \/\/ Force dynamic rendering to avoid build issues$/gm,
    "'react'\n\n// Force dynamic rendering to avoid build issues"
  );
  
  // Fix React import pattern
  content = content.replace(
    /from 'react'$/gm,
    "from 'react'"
  );
  
  return content;
}

// Function to fix object method shorthand
function fixObjectMethods(content) {
  // Fix p95ResponseTime vs ResponseTime inconsistency
  content = content.replace(/ResponseTime: number/g, 'p95ResponseTime: number');
  
  return content;
}

// Function to fix const declarations
function fixConstDeclarations(content) {
  // Fix defaultMetrics declaration
  content = content.replace(
    /const \[alerts, setAlerts\] = useState<string\[\]>\(\[\]\) \/\/ Default metrics if no onRefresh provided const defaultMetrics: PerformanceMetric\[\] = \[/g,
    'const [alerts, setAlerts] = useState<string[]>([])\n\n  // Default metrics if no onRefresh provided\n  const defaultMetrics: PerformanceMetric[] = ['
  );
  
  // Fix fetchData function
  content = content.replace(
    /\] \/\/ Fetch performance data const fetchData = async \(\) => \{ setLoading\(true\) try \{ if \(onRefresh\) \{/g,
    '  ]\n\n  // Fetch performance data\n  const fetchData = async () => {\n    setLoading(true)\n    try {\n      if (onRefresh) {'
  );
  
  return content;
}

// Main processing
filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Apply all fixes
  content = fixInterfaceProperties(content);
  content = fixCompressedCode(content);
  content = fixObjectMethods(content);
  content = fixConstDeclarations(content);
  
  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed syntax in ${file}`);
  } else {
    console.log(`ℹ️  No changes needed for ${file}`);
  }
});

console.log('\n✨ Furniture module syntax fixes complete!');