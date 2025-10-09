#!/usr/bin/env node
/**
 * Finance DNA v2 - Mermaid Diagram SVG Export Script
 * Auto-generates SVG files from Mermaid diagrams for documentation
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const MERMAID_DIR = path.join(__dirname, '../docs/mermaid');
const SVG_OUTPUT_DIR = path.join(MERMAID_DIR, 'generated/svg');
const PNG_OUTPUT_DIR = path.join(MERMAID_DIR, 'generated/png');

// Ensure output directories exist
if (!fs.existsSync(SVG_OUTPUT_DIR)) {
  fs.mkdirSync(SVG_OUTPUT_DIR, { recursive: true });
}
if (!fs.existsSync(PNG_OUTPUT_DIR)) {
  fs.mkdirSync(PNG_OUTPUT_DIR, { recursive: true });
}

console.log('🎨 Finance DNA v2 - Mermaid Diagram Export');
console.log('==========================================');
console.log('');

/**
 * Extract Mermaid diagrams from markdown files
 */
function extractMermaidDiagrams(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const diagrams = [];
  
  // Match mermaid code blocks
  const mermaidRegex = /```mermaid\n([\s\S]*?)\n```/g;
  let match;
  let index = 0;
  
  while ((match = mermaidRegex.exec(content)) !== null) {
    diagrams.push({
      content: match[1],
      index: index++,
      source: path.basename(filePath, '.md')
    });
  }
  
  return diagrams;
}

/**
 * Generate diagram names from content
 */
function generateDiagramName(diagram) {
  const { source, index } = diagram;
  const content = diagram.content.toLowerCase();
  
  // Extract diagram type and purpose from content
  let name = `${source}-${index + 1}`;
  
  if (content.includes('system architecture') || content.includes('graph tb')) {
    name = `${source}-architecture`;
  } else if (content.includes('sequencediagram') || content.includes('data flow')) {
    name = `${source}-dataflow`;
  } else if (content.includes('flowchart') || content.includes('smart code')) {
    name = `${source}-smartcode-validation`;
  } else if (content.includes('policy engine')) {
    name = `${source}-policy-engine`;
  } else if (content.includes('performance')) {
    name = `${source}-performance`;
  } else if (content.includes('security')) {
    name = `${source}-security`;
  }
  
  return name;
}

/**
 * Create temporary mermaid file and export to SVG/PNG
 */
function exportDiagram(diagram, outputName) {
  const tempFile = path.join(MERMAID_DIR, `temp-${outputName}.mmd`);
  const svgFile = path.join(SVG_OUTPUT_DIR, `${outputName}.svg`);
  const pngFile = path.join(PNG_OUTPUT_DIR, `${outputName}.png`);
  
  try {
    // Write temporary mermaid file
    fs.writeFileSync(tempFile, diagram.content);
    
    // Check if mermaid CLI is available
    try {
      execSync('which mmdc', { stdio: 'ignore' });
    } catch (error) {
      console.log('⚠️  Mermaid CLI not found. Installing...');
      console.log('   Run: npm install -g @mermaid-js/mermaid-cli');
      return false;
    }
    
    // Export to SVG
    try {
      execSync(`mmdc -i "${tempFile}" -o "${svgFile}" -f svg`, { stdio: 'inherit' });
      console.log(`   ✅ SVG: ${path.basename(svgFile)}`);
    } catch (error) {
      console.log(`   ❌ SVG export failed for ${outputName}`);
    }
    
    // Export to PNG (optional, for presentations)
    try {
      execSync(`mmdc -i "${tempFile}" -o "${pngFile}" -f png --width 1200 --height 800`, { stdio: 'inherit' });
      console.log(`   ✅ PNG: ${path.basename(pngFile)}`);
    } catch (error) {
      console.log(`   ⚠️  PNG export failed for ${outputName} (optional)`);
    }
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    return true;
  } catch (error) {
    console.log(`   ❌ Export failed: ${error.message}`);
    // Clean up temp file if it exists
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    return false;
  }
}

/**
 * Main export process
 */
function main() {
  const architectureFile = path.join(MERMAID_DIR, 'finance-dna-v2-architecture.md');
  
  if (!fs.existsSync(architectureFile)) {
    console.log('❌ Architecture file not found:', architectureFile);
    process.exit(1);
  }
  
  console.log('📋 Extracting diagrams from:', path.basename(architectureFile));
  
  const diagrams = extractMermaidDiagrams(architectureFile);
  console.log(`   Found ${diagrams.length} diagrams`);
  console.log('');
  
  let successCount = 0;
  let totalCount = diagrams.length;
  
  console.log('🎨 Exporting diagrams...');
  
  diagrams.forEach((diagram, index) => {
    const outputName = generateDiagramName(diagram);
    console.log(`📊 Diagram ${index + 1}: ${outputName}`);
    
    if (exportDiagram(diagram, outputName)) {
      successCount++;
    }
    console.log('');
  });
  
  console.log('📋 Export Summary');
  console.log('================');
  console.log(`✅ Successful: ${successCount}/${totalCount}`);
  console.log(`📁 SVG Output: ${SVG_OUTPUT_DIR}`);
  console.log(`📁 PNG Output: ${PNG_OUTPUT_DIR}`);
  
  if (successCount === totalCount) {
    console.log('');
    console.log('🎉 All diagrams exported successfully!');
    console.log('📚 Diagrams ready for documentation and presentations');
  } else if (successCount > 0) {
    console.log('');
    console.log('⚠️  Some diagrams failed to export');
    console.log('💡 Check that @mermaid-js/mermaid-cli is installed globally');
  } else {
    console.log('');
    console.log('❌ No diagrams were exported');
    console.log('🔧 Install Mermaid CLI: npm install -g @mermaid-js/mermaid-cli');
    process.exit(1);
  }
}

// Run the export
if (require.main === module) {
  main();
}

module.exports = { extractMermaidDiagrams, exportDiagram };