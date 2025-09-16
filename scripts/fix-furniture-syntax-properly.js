#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all TypeScript/React files in furniture directories
const files = glob.sync('src/{components,app}/furniture/**/*.{ts,tsx}');

console.log(`Found ${files.length} furniture files to check...`);

let fixedCount = 0;

files.forEach(file => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;
    let modified = false;

    // Fix arrays followed by properties on same line
    content = content.replace(/products: Array<\{([^}]+)\}>\s+(\w+:)/g, (match, arrayContent, nextProp) => {
      modified = true;
      return `products: Array<{\n    ${arrayContent.trim()}\n  }>\n  ${nextProp}`;
    });

    // Fix generic pattern for any type followed by a property
    content = content.replace(/}>\s+(\w+:)/g, (match, prop) => {
      if (!match.includes('\n')) {
        modified = true;
        return '}>\n  ' + prop;
      }
      return match;
    });

    // Fix compressed object type definitions in interfaces
    content = content.replace(/specifications\?\s*:\s*\{([^}]+)\}/g, (match, content) => {
      if (!content.includes('\n') && content.includes(':')) {
        const props = content.split(/\s+(?=\w+\?:)/).filter(p => p.trim());
        if (props.length > 1) {
          modified = true;
          const formatted = props.map(p => '    ' + p.trim()).join('\n');
          return `specifications?: {\n${formatted}\n  }`;
        }
      }
      return match;
    });

    // Fix function body starting on same line as declaration
    content = content.replace(/\)\s*{\s*(\w)/g, (match, firstChar) => {
      modified = true;
      return ') {\n  ' + firstChar;
    });

    // Fix component function parameters that are compressed
    content = content.replace(/}: \{ (\w+:)/g, (match, prop) => {
      modified = true;
      return '}: {\n  ' + prop;
    });

    // Fix closing braces followed immediately by properties in interfaces
    content = content.replace(/}\s+(\w+:\s*[^}]+)/g, (match, prop) => {
      if (!match.includes('\n') && prop.includes(':')) {
        modified = true;
        return '}\n  ' + prop;
      }
      return match;
    });

    // Fix compressed interface properties that got split incorrectly
    content = content.replace(/interface\s+(\w+)\s*\{([\s\S]*?)\}/g, (match, name, body) => {
      // Check if properties look broken (single characters on lines)
      const lines = body.split('\n').map(l => l.trim()).filter(l => l);
      
      // Detect pattern where properties are split character by character
      let needsFix = false;
      let rebuiltProps = [];
      let currentProp = '';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Single character lines are suspicious
        if (line.length === 1 && /^[a-zA-Z_]$/.test(line)) {
          currentProp += line;
          needsFix = true;
        } else if (line.includes(':') && currentProp) {
          // This line completes a property
          rebuiltProps.push(currentProp + line);
          currentProp = '';
        } else if (line.includes(':')) {
          // This is a complete property on its own
          rebuiltProps.push(line);
        }
      }
      
      if (needsFix && rebuiltProps.length > 0) {
        modified = true;
        const formatted = rebuiltProps.map(p => '  ' + p.trim()).join('\n');
        return `interface ${name} {\n${formatted}\n}`;
      }
      
      return match;
    });

    // Fix any remaining compressed arrays in interface properties
    content = content.replace(/(\w+):\s*Array<\{([^}]+)\}>/g, (match, propName, arrayContent) => {
      if (!arrayContent.includes('\n') && arrayContent.includes(':')) {
        const props = arrayContent.split(/\s+(?=\w+\??:)/).filter(p => p.trim());
        if (props.length > 2) {
          modified = true;
          const formatted = props.map(p => '    ' + p.trim()).join('\n');
          return `${propName}: Array<{\n${formatted}\n  }>`;
        }
      }
      return match;
    });

    // Save if modified
    if (modified && content !== originalContent) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`Fixed: ${file}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`Error processing ${file}:`, error.message);
  }
});

console.log(`\n✅ Fixed ${fixedCount} files`);