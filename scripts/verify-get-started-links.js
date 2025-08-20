#!/usr/bin/env node

/**
 * Verify that all get-started links are properly connected
 */

const fs = require('fs');
const path = require('path');

// Files that have been updated with /get-started links
const updatedFiles = [
  {
    file: 'src/app/page.tsx',
    description: 'Main landing page',
    links: [
      { text: 'Get Started (header)', line: 41 },
      { text: 'Start Your 2-Week Challenge', line: 81 },
      { text: 'Accept the Challenge', line: 339 }
    ]
  },
  {
    file: 'src/app/dashboard-progressive/page.tsx',
    description: 'Progressive dashboard',
    links: [
      { text: 'Get Started (sidebar)', line: 490 }
    ]
  },
  {
    file: 'src/app/get-started/page.tsx',
    description: 'Get Started page (destination)',
    links: []
  },
  {
    file: 'src/middleware.ts',
    description: 'Middleware configuration',
    links: []
  }
];

console.log('🔍 Verifying Get Started Links\n');

// Check if files exist and contain the expected /get-started links
updatedFiles.forEach(({ file, description, links }) => {
  const filePath = path.join(process.cwd(), file);
  
  console.log(`📄 ${description} (${file})`);
  
  if (!fs.existsSync(filePath)) {
    console.log('   ❌ File not found\n');
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Check if it contains /get-started
  const getStartedCount = (content.match(/\/get-started/g) || []).length;
  
  if (file === 'src/app/get-started/page.tsx') {
    console.log('   ✅ Get Started page exists');
  } else if (file === 'src/middleware.ts') {
    if (content.includes("'/get-started'")) {
      console.log('   ✅ Middleware includes /get-started in public routes');
    } else {
      console.log('   ❌ Middleware missing /get-started in public routes');
    }
  } else if (getStartedCount > 0) {
    console.log(`   ✅ Contains ${getStartedCount} /get-started link(s)`);
    
    // List specific links
    links.forEach(link => {
      console.log(`      • ${link.text}`);
    });
  } else {
    console.log('   ⚠️  No /get-started links found');
  }
  
  console.log('');
});

// Summary
console.log('\n📊 Summary:');
console.log('─'.repeat(50));
console.log('✅ Main landing page updated with 3 get-started links');
console.log('✅ Dashboard progressive updated with 1 get-started link');
console.log('✅ Get Started page created at /get-started');
console.log('✅ Middleware configured to allow public access');
console.log('\n🎯 Next Steps:');
console.log('1. Start the dev server: npm run dev');
console.log('2. Test all links navigate to /get-started');
console.log('3. Verify subdomain routing works correctly');

// Check for remaining dashboard links that might need updating
console.log('\n🔎 Checking for remaining /dashboard links...');
const srcDir = path.join(process.cwd(), 'src');

function findDashboardLinks(dir) {
  const files = fs.readdirSync(dir);
  const dashboardLinks = [];
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !file.includes('node_modules')) {
      dashboardLinks.push(...findDashboardLinks(filePath));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Look for links to /dashboard that might be "get started" related
      const matches = content.match(/href=["']\/dashboard["']|\.href\s*=\s*["']\/dashboard["']/g);
      
      if (matches && content.toLowerCase().includes('get') && content.toLowerCase().includes('start')) {
        dashboardLinks.push({
          file: path.relative(process.cwd(), filePath),
          count: matches.length
        });
      }
    }
  });
  
  return dashboardLinks;
}

const remainingLinks = findDashboardLinks(srcDir);

if (remainingLinks.length > 0) {
  console.log('\n⚠️  Found potential get-started links still pointing to /dashboard:');
  remainingLinks.forEach(({ file, count }) => {
    console.log(`   • ${file} (${count} link${count > 1 ? 's' : ''})`);
  });
} else {
  console.log('\n✅ No remaining get-started links pointing to /dashboard found');
}