#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixDuplicateLanguages(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if file has duplicate front matter
  const frontMatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontMatterMatch) {
    console.log(`⚠️  No front matter found in ${path.basename(filePath)}`);
    return false;
  }
  
  const frontMatter = frontMatterMatch[1];
  const restOfFile = content.substring(frontMatterMatch[0].length);
  
  // Check for duplicate languages entries
  const languagesMatches = frontMatter.match(/languages:/g);
  if (!languagesMatches || languagesMatches.length <= 1) {
    console.log(`✅ No duplicate languages in ${path.basename(filePath)}`);
    return false;
  }
  
  console.log(`🔧 Fixing duplicate languages in ${path.basename(filePath)}`);
  
  // Remove any trailing language entries (keep the first one)
  const lines = frontMatter.split('\n');
  const cleanedLines = [];
  let foundLanguages = false;
  let skipNext = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (skipNext > 0) {
      skipNext--;
      continue;
    }
    
    if (line.trim() === 'languages:') {
      if (!foundLanguages) {
        foundLanguages = true;
        cleanedLines.push(line);
        // Include the language entries
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith('  ')) {
          cleanedLines.push(lines[j]);
          skipNext++;
          j++;
        }
        // Check for defaultLanguage
        if (j < lines.length && lines[j].startsWith('defaultLanguage:')) {
          cleanedLines.push(lines[j]);
          skipNext++;
        }
      } else {
        // Skip duplicate languages section
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith('  ')) {
          skipNext++;
          j++;
        }
        if (j < lines.length && lines[j].startsWith('defaultLanguage:')) {
          skipNext++;
        }
      }
    } else {
      cleanedLines.push(line);
    }
  }
  
  const cleanedFrontMatter = cleanedLines.join('\n');
  const fixedContent = `---\n${cleanedFrontMatter}\n---${restOfFile}`;
  
  fs.writeFileSync(filePath, fixedContent, 'utf8');
  return true;
}

// Fix all blog posts
const blogDir = path.join(__dirname, '../generated/blog-posts');
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.mdx'));

console.log(`🔍 Checking ${files.length} blog posts for duplicate languages...`);

let fixedCount = 0;
for (const file of files) {
  const filePath = path.join(blogDir, file);
  if (fixDuplicateLanguages(filePath)) {
    fixedCount++;
  }
}

console.log(`\n✨ Fixed ${fixedCount} files with duplicate languages`);