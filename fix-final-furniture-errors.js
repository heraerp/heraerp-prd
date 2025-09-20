const fs = require('fs');
const path = require('path');

// Fix furniture/sales/customers/page.tsx
const customersPagePath = path.join(__dirname, 'src/app/furniture/sales/customers/page.tsx');
let customersContent = fs.readFileSync(customersPagePath, 'utf8');

// Split by lines for easier manipulation
const lines = customersContent.split('\n');

// Find and fix line 80 (array index 79)
if (lines[79] && lines[79].includes('} className="bg-[var(--color-body)]')) {
  // Remove the extra closing brace at the beginning of the className
  lines[79] = lines[79].replace('    } className="bg-[var(--color-body)]', '                              className="bg-[var(--color-body)]');
}

// Fix line 83 (array index 82) - similar issue
if (lines[82] && lines[82].includes('} className="px-4')) {
  lines[82] = lines[82].replace('    } className="px-4', '                        className="px-4');
}

// Join back and save
customersContent = lines.join('\n');
fs.writeFileSync(customersPagePath, customersContent);

console.log('✅ Fixed furniture/sales/customers/page.tsx');

// Also ensure furniture/sales/orders/page.tsx is properly formatted
const ordersPagePath = path.join(__dirname, 'src/app/furniture/sales/orders/page.tsx');
if (fs.existsSync(ordersPagePath)) {
  let ordersContent = fs.readFileSync(ordersPagePath, 'utf8');
  
  // Fix any remaining syntax issues
  ordersContent = ordersContent.replace(/setStats\({ activeOrders, monthlyRevenue, avgOrderSize, pendingDelivery }\s*\);/g, 
    'setStats({ activeOrders, monthlyRevenue, avgOrderSize, pendingDelivery });');
  
  // Fix catch blocks
  ordersContent = ordersContent.replace(/\s+\); } catch \(error\) {/g, '); } catch (error) {');
  
  // Fix line continuations
  ordersContent = ordersContent.replace(/const statusConfig\s*=\s*{/g, 'const statusConfig = {');
  
  fs.writeFileSync(ordersPagePath, ordersContent);
  console.log('✅ Fixed furniture/sales/orders/page.tsx');
}

console.log('\n🎉 All furniture module errors fixed!');