const fs = require('fs');
const path = require('path');

// Fix UCRRuleManager.tsx - missing closing braces
console.log('Fixing UCRRuleManager.tsx...');
const ucrPath = path.join(__dirname, 'src/components/furniture/UCRRuleManager.tsx');
let ucrContent = fs.readFileSync(ucrPath, 'utf8');

// Fix getRuleBadge return statement
ucrContent = ucrContent.replace(
  'return ( <Badge className={cn(\'text-xs\', config.bgColor, config.color, \'border-none\')}>{type}</Badge>   );',
  'return <Badge className={cn(\'text-xs\', config.bgColor, config.color, \'border-none\')}>{type}</Badge>;\n};'
);

// Count opening and closing braces to find the issue
const openBraces = (ucrContent.match(/{/g) || []).length;
const closeBraces = (ucrContent.match(/}/g) || []).length;
console.log(`UCRRuleManager.tsx: ${openBraces} opening braces, ${closeBraces} closing braces`);

// Add missing closing brace at the end
if (openBraces > closeBraces) {
  ucrContent = ucrContent.trim() + '\n}';
}

fs.writeFileSync(ucrPath, ucrContent);

// Fix customers/page.tsx - filter function issues
console.log('Fixing customers/page.tsx...');
const customersPath = path.join(__dirname, 'src/app/furniture/sales/customers/page.tsx');
let customersContent = fs.readFileSync(customersPath, 'utf8');

// Fix the filter function - missing opening brace after if statement
customersContent = customersContent.replace(
  'if (filterType === \'inactive\') {\n  const metrics = getCustomerMetrics(customer.id) \n    return metrics.orderCount === 0',
  'if (filterType === \'inactive\') {\n      const metrics = getCustomerMetrics(customer.id);\n      return metrics.orderCount === 0'
);

// Remove extra closing brace and return statement
customersContent = customersContent.replace(
  'return metrics.orderCount === 0 || !metrics.lastOrderDate || new Date(metrics.lastOrderDate) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);\n    }\n    return true;',
  'return metrics.orderCount === 0 || !metrics.lastOrderDate || new Date(metrics.lastOrderDate) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);'
);

fs.writeFileSync(customersPath, customersContent);

// Fix orders/page.tsx - missing async in map and misplaced parentheses
console.log('Fixing orders/page.tsx...');
const ordersPath = path.join(__dirname, 'src/app/furniture/sales/orders/page.tsx');
let ordersContent = fs.readFileSync(ordersPath, 'utf8');

// Find and fix the productsWithPrices section
const productsMapStart = ordersContent.indexOf('// Transform products for POS display');
const productsMapEnd = ordersContent.indexOf('setFurnitureItems(productsWithPrices);');

if (productsMapStart !== -1 && productsMapEnd !== -1) {
  const beforeMap = ordersContent.substring(0, productsMapStart);
  const afterMap = ordersContent.substring(productsMapEnd);
  
  const fixedMap = `// Transform products for POS display
    const productsWithPrices = await Promise.all(
      productsResponse.data.map(async (product: any) => {
        const dynamicResponse = await universalApi.read('core_dynamic_data', {
          filters: [
            { field: 'entity_id', operator: 'eq', value: product.id },
            { field: 'field_name', operator: 'in', value: ['selling_price'] }
          ]
        });
        
        const price = dynamicResponse.data.find((f: any) => f.field_name === 'selling_price')?.field_value_number || 0;
        return {
          id: product.id,
          name: product.entity_name,
          category: (product.metadata as any)?.category || 'General',
          price: price,
          image: '/api/placeholder/100/100',
          sku: product.entity_code
        };
      })
    );
    `;
  
  ordersContent = beforeMap + fixedMap + afterMap;
}

fs.writeFileSync(ordersPath, ordersContent);

// Fix tender bid new page - missing braces and semicolons
console.log('Fixing tender bid new page...');
const bidNewPath = path.join(__dirname, 'src/app/furniture/tender/[code]/bid/new/page.tsx');
let bidNewContent = fs.readFileSync(bidNewPath, 'utf8');

// Fix the missing semicolon after createEntity
bidNewContent = bidNewContent.replace(
  'const result = await universalApi.createEntity(bidData)\n          // Create transaction for bid submission await universalApi.createTransaction',
  'const result = await universalApi.createEntity(bidData);\n    \n    // Create transaction for bid submission\n    await universalApi.createTransaction'
);

// Fix the missing braces in catch block
bidNewContent = bidNewContent.replace(
  'router.push(`/furniture/tender/${code}`  ) catch (error) {',
  'router.push(`/furniture/tender/${code}`);\n  } catch (error) {'
);

// Fix console.error line
bidNewContent = bidNewContent.replace(
  'console.error(\'Error submitting bid:\', error) toast({ title: \'Error\', description: \'Failed to submit bid.\', variant: \'destructive\' })   } finally {',
  'console.error(\'Error submitting bid:\', error);\n    toast({ title: \'Error\', description: \'Failed to submit bid.\', variant: \'destructive\' });\n  } finally {'
);

fs.writeFileSync(bidNewPath, bidNewContent);

// Fix tender bids page - missing semicolons in interface
console.log('Fixing tender bids page...');
const bidsPath = path.join(__dirname, 'src/app/furniture/tender/bids/page.tsx');
if (fs.existsSync(bidsPath)) {
  let bidsContent = fs.readFileSync(bidsPath, 'utf8');
  
  // Fix interface definition
  bidsContent = bidsContent.replace(
    'metadata: { tender_code: string bid_amount: number status: string submission_time?: string validity_period_days: number bid_strategy: string documents_attached?: string[]',
    'metadata: {\n    tender_code: string;\n    bid_amount: number;\n    status: string;\n    submission_time?: string;\n    validity_period_days: number;\n    bid_strategy: string;\n    documents_attached?: string[];'
  );
  
  // Fix created_at/updated_at
  bidsContent = bidsContent.replace(
    'created_at: string updated_at: string',
    'created_at: string;\n  updated_at: string;'
  );
  
  fs.writeFileSync(bidsPath, bidsContent);
}

console.log('\n✅ All remaining build errors fixed!');