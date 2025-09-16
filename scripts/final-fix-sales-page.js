#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/furniture/sales/page.tsx');

console.log('Final fix for furniture sales page...\n');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix the duplicate error state issue (lines 134-139)
  content = content.replace(
    /\}\s*<\/p>\s*<Button onClick=\{refresh\}.*?Retry.*?<\/Button>.*?<\/div>\s*<\/div>\s*\)\s*\}/s,
    '}'
  );
  
  // Fix compressed JSX in the main return statement
  // This is a massive compressed JSX block starting around line 139
  content = content.replace(
    /\} return \(\s*<div className="min-h-screen bg-background">\s*<div className="p-6 space-y-6"> \{\/\* Header \*\/\} <div/,
    `}

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div`
  );

  // Fix all compressed JSX elements that are on single lines
  content = content.replace(/<\/div>\s*<div/g, '</div>\n        <div');
  content = content.replace(/<\/p>\s*<p/g, '</p>\n          <p');
  content = content.replace(/<\/Card>\s*<Card/g, '</Card>\n        <Card');
  content = content.replace(/<\/Button>\s*<Button/g, '</Button>\n          <Button');
  content = content.replace(/<\/Badge>\s*<\/div>/g, '</Badge>\n        </div>');
  content = content.replace(/<\/span>\s*<span/g, '</span>\n          <span');
  
  // Fix compressed className attributes
  content = content.replace(/className="([^"]+)"\s*>/g, (match, className) => {
    if (className.length > 80) {
      return `\n          className="${className}"\n        >`;
    }
    return match;
  });
  
  // Fix the callback functions that are compressed
  content = content.replace(
    /onOrderCreated=\{orderId => \{\s*console\.log\('New sales order created:', orderId\)\s*\/\/ Refresh the data refresh\(\)\s*\}\s*\}/g,
    `onOrderCreated={orderId => {
            console.log('New sales order created:', orderId)
            // Refresh the data
            refresh()
          }}`
  );
  
  // Fix the cn() function calls
  content = content.replace(
    /className=\{cn\(\s*'([^']+)',\s*([^)]+)\s*\)\}/g,
    'className={cn(\n            \'$1\',\n            $2\n          )}'
  );
  
  // Fix map functions
  content = content.replace(/\)\.map\((\w+) => \(/g, ').map($1 => (');
  
  // Fix JSX closing tags
  content = content.replace(/<\/div>\s*\)\s*\}\s*\)/g, '</div>\n        )}\n      )');
  
  // Fix specific problematic sections
  // Fix the stats cards section
  content = content.replace(
    /<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">/g,
    '\n        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">'
  );
  
  // Fix card components
  content = content.replace(
    /<Card className="p-6 bg-card\/50 backdrop-blur-sm border-border\/50 hover:bg-card\/70 transition-all">/g,
    '\n          <Card className="p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all">'
  );
  
  // Fix nested divs in cards
  content = content.replace(
    /<div className="flex items-center justify-between mb-4">/g,
    '\n            <div className="flex items-center justify-between mb-4">'
  );
  
  // Fix Badge components
  content = content.replace(
    /<Badge variant="secondary" className="([^"]+)"> ([^<]+) <\/Badge>/g,
    '<Badge variant="secondary" className="$1">\n              $2\n            </Badge>'
  );
  
  // Fix conditional rendering
  content = content.replace(
    /\{stats\.weeklyGrowth > 0 \? \(/g,
    '\n              {stats.weeklyGrowth > 0 ? ('
  );
  
  // Fix the closing of components
  content = content.replace(/<\/div> <\/Card>/g, '</div>\n          </Card>');
  content = content.replace(/<\/div> <\/div> <\/Card>/g, '</div>\n            </div>\n          </Card>');
  
  // Fix the main content grid
  content = content.replace(
    /{\/\* Main Content Grid \*\/} <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/g,
    '\n        {/* Main Content Grid */}\n        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">'
  );
  
  // Fix recent orders section
  content = content.replace(
    /{\/\* Recent Orders - 2 columns \*\/} <div className="lg:col-span-2 space-y-4">/g,
    '\n          {/* Recent Orders - 2 columns */}\n          <div className="lg:col-span-2 space-y-4">'
  );
  
  // Fix the map functions for orders
  content = content.replace(
    /recentOrders\.map\(order => \( <div/g,
    'recentOrders.map(order => (\n                  <div'
  );
  
  // Final cleanup - ensure proper JSX structure
  content = content.replace(/\)\s*\}\s*\)\s*\}\s*<\/div>\s*<\/Card>/g, ')\n              })\n            )}\n          </div>\n        </Card>');
  
  // Fix the final closing tags
  content = content.replace(
    /<\/div>\s*<\/div>\s*\)\s*\}$/,
    '</div>\n      </div>\n    </div>\n  )\n}'
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed furniture sales page comprehensively');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}