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

    // Fix mangled interface properties (where properties are split across lines character by character)
    // Look for patterns like:
    // interface Something {
    //   p
    //   r
    //   o
    //   p: string
    content = content.replace(/interface\s+(\w+)\s*\{([^}]+)\}/gs, (match, name, body) => {
      // Check if the interface body looks mangled (single letters on lines)
      const lines = body.split('\n').map(l => l.trim()).filter(l => l);
      let isMangledPattern = false;
      
      // Check for pattern of single letters followed by a property definition
      for (let i = 0; i < lines.length - 1; i++) {
        if (lines[i].length === 1 && /^[a-zA-Z]$/.test(lines[i])) {
          // Look ahead to see if we're building up to a property name
          let j = i + 1;
          while (j < lines.length && lines[j].length === 1 && /^[a-zA-Z]$/.test(lines[j])) {
            j++;
          }
          if (j < lines.length && lines[j].includes(':')) {
            isMangledPattern = true;
            break;
          }
        }
      }
      
      if (isMangledPattern) {
        // Rebuild the interface
        const props = [];
        let currentProp = '';
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed.length === 1 && /^[a-zA-Z_]$/.test(trimmed)) {
            // Single character - part of a property name
            currentProp += trimmed;
          } else if (trimmed.includes(':')) {
            // Property definition
            if (currentProp) {
              props.push(currentProp + trimmed);
              currentProp = '';
            } else if (trimmed.match(/^\w+\??:/)) {
              props.push(trimmed);
            }
          }
        }
        
        if (props.length > 0) {
          modified = true;
          const formattedProps = props.map(p => '  ' + p).join('\n');
          return `interface ${name} {\n${formattedProps}\n}`;
        }
      }
      
      return match;
    });

    // Fix compressed interface/type properties on single line
    content = content.replace(/interface\s+(\w+)\s*{\s*([^}]*\w+:\s*\w+[^}]*)\s*}/g, (match, name, props) => {
      // Check if properties need formatting (multiple properties on one line)
      if (props.includes(':') && !props.includes('\n')) {
        // Split properties - handle nested types carefully
        const propertyParts = [];
        let current = '';
        let depth = 0;
        let inString = false;
        
        for (let i = 0; i < props.length; i++) {
          const char = props[i];
          
          if ((char === '"' || char === "'") && (i === 0 || props[i-1] !== '\\')) {
            inString = !inString;
          }
          
          if (!inString) {
            if (char === '{' || char === '[' || char === '<' || char === '(') depth++;
            if (char === '}' || char === ']' || char === '>' || char === ')') depth--;
          }
          
          current += char;
          
          // Look for property boundaries
          if (!inString && depth === 0 && i < props.length - 1) {
            const remaining = props.substring(i + 1).trim();
            if (remaining.match(/^[a-zA-Z_]\w*\??:/)) {
              propertyParts.push(current.trim());
              current = '';
            }
          }
        }
        
        if (current.trim()) {
          propertyParts.push(current.trim());
        }
        
        if (propertyParts.length > 1) {
          modified = true;
          const formatted = propertyParts.map(p => '  ' + p).join('\n');
          return `interface ${name} {\n${formatted}\n}`;
        }
      }
      
      return match;
    });

    // Fix compressed function parameters
    content = content.replace(/\({\s*([^}]+)\s*}:\s*([^)]+)\)/g, (match, params, type) => {
      if (!params.includes('\n') && params.includes(',') && params.length > 50) {
        const paramList = params.split(',').map(p => p.trim());
        if (paramList.length > 3) {
          modified = true;
          const formatted = paramList.map(p => '  ' + p).join(',\n');
          return `({\n${formatted}\n}: ${type})`;
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