const fs = require('fs');
const path = require('path');

// Fix customers/page.tsx filter function
console.log('Fixing customers/page.tsx...');
const customersPath = path.join(__dirname, 'src/app/furniture/sales/customers/page.tsx');
let customersContent = fs.readFileSync(customersPath, 'utf8');

// Replace the entire filter function with correct syntax
const filterStart = customersContent.indexOf('// Filter customers based on status');
const filterEnd = customersContent.indexOf('const handleDeleteCustomer');

if (filterStart !== -1 && filterEnd !== -1) {
  const beforeFilter = customersContent.substring(0, filterStart);
  const afterFilter = customersContent.substring(filterEnd);
  
  const correctedFilter = `// Filter customers based on status
  const filteredCustomers = customers?.filter(customer => {
    if (filterType === 'active') {
      const metrics = getCustomerMetrics(customer.id);
      return metrics.orderCount > 0 && metrics.lastOrderDate && new Date(metrics.lastOrderDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }
    if (filterType === 'inactive') {
      const metrics = getCustomerMetrics(customer.id);
      return metrics.orderCount === 0 || !metrics.lastOrderDate || new Date(metrics.lastOrderDate) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }
    return true;
  });

  `;
  
  customersContent = beforeFilter + correctedFilter + afterFilter;
}

fs.writeFileSync(customersPath, customersContent);

// Fix orders/page.tsx
console.log('Fixing orders/page.tsx...');
const ordersPath = path.join(__dirname, 'src/app/furniture/sales/orders/page.tsx');
let ordersContent = fs.readFileSync(ordersPath, 'utf8');

// Fix the enrichedOrders map function
const enrichedStart = ordersContent.indexOf('// Transform orders with customer names');
const enrichedEnd = ordersContent.indexOf('setRecentOrders(enrichedOrders);');

if (enrichedStart !== -1 && enrichedEnd !== -1) {
  const beforeEnriched = ordersContent.substring(0, enrichedStart);
  const afterEnriched = ordersContent.substring(enrichedEnd);
  
  const correctedEnriched = `// Transform orders with customer names
    const enrichedOrders = await Promise.all(
      ordersResponse.data.map(async (order: any) => {
        let customerName = 'Direct Sale';
        if (order.from_entity_id) {
          const customerResponse = await universalApi.read('core_entities', {
            filters: [{ field: 'id', operator: 'eq', value: order.from_entity_id }]
          });
          if (customerResponse.data.length > 0) {
            customerName = customerResponse.data[0].entity_name;
          }
        }
        
        // Get line items count
        const linesResponse = await universalApi.read('universal_transaction_lines', {
          filters: [{ field: 'transaction_id', operator: 'eq', value: order.id }]
        });
        
        return {
          id: order.transaction_code,
          customer: customerName,
          items: linesResponse.data.length,
          value: \`₹\${(order.total_amount || 0).toLocaleString('en-IN')}\`,
          status: order.status || 'pending_approval',
          date: new Date(order.transaction_date).toLocaleDateString('en-IN')
        };
      })
    );
    `;
  
  ordersContent = beforeEnriched + correctedEnriched + afterEnriched;
}

// Fix missing semicolon after setLoading(false)
ordersContent = ordersContent.replace(/setLoading\(false\)\s*}/g, 'setLoading(false);\n  }');

fs.writeFileSync(ordersPath, ordersContent);

// Fix tender bid new page
console.log('Fixing tender bid new page...');
const bidNewPath = path.join(__dirname, 'src/app/furniture/tender/[code]/bid/new/page.tsx');
let bidNewContent = fs.readFileSync(bidNewPath, 'utf8');

// Fix the transaction creation line
bidNewContent = bidNewContent.replace(
  'await universalApi.createTransaction({ transaction_type: \'bid_submission\', transaction_code: `BID-SUB-${Date.now()}`, smart_code: \'HERA.FURNITURE.TENDER.BID.SUBMISSION.V1\', total_amount: parseFloat(formData.bidAmount), metadata: { bid_id: result.id, tender_code: code } }) toast({ title: \'Bid Submitted Successfully\', description: \'Your bid has been submitted and locked.\' }) router.push(`/furniture/tender/${code}`);',
  `await universalApi.createTransaction({
      transaction_type: 'bid_submission',
      transaction_code: \`BID-SUB-\${Date.now()}\`,
      smart_code: 'HERA.FURNITURE.TENDER.BID.SUBMISSION.V1',
      total_amount: parseFloat(formData.bidAmount),
      metadata: { bid_id: result.id, tender_code: code }
    });
    
    toast({ title: 'Bid Submitted Successfully', description: 'Your bid has been submitted and locked.' });
    router.push(\`/furniture/tender/\${code}\`);`
);

// Fix missing semicolons
bidNewContent = bidNewContent.replace(/setLoading\(false\)\s*}/g, 'setLoading(false);\n  }');

fs.writeFileSync(bidNewPath, bidNewContent);

// Fix tender bids page
console.log('Fixing tender bids page...');
const bidsPath = path.join(__dirname, 'src/app/furniture/tender/bids/page.tsx');
if (fs.existsSync(bidsPath)) {
  let bidsContent = fs.readFileSync(bidsPath, 'utf8');
  
  // Fix the getBadgeForStatus function
  bidsContent = bidsContent.replace(
    /case 'submitted':\s*return \(\s*<Badge[^>]+>[^<]+<\/Badge>\s*\)\s*case/g,
    'case \'submitted\':\n        return <Badge variant="default" className="furniture-btn-premium"><CheckCircle className="h-3 w-3 mr-1" />Submitted</Badge>;\n      case'
  );
  
  bidsContent = bidsContent.replace(
    /case 'won':\s*return \(\s*<Badge[^>]+>[^<]+<\/Badge>\s*\)\s*case/g,
    'case \'won\':\n        return <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-[var(--color-text-primary)]"><Trophy className="h-3 w-3 mr-1" />Won</Badge>;\n      case'
  );
  
  fs.writeFileSync(bidsPath, bidsContent);
}

// Fix tender dashboard page
console.log('Fixing tender dashboard page...');
const dashboardPath = path.join(__dirname, 'src/app/furniture/tender/dashboard/page.tsx');
if (fs.existsSync(dashboardPath)) {
  let dashboardContent = fs.readFileSync(dashboardPath, 'utf8');
  
  // Fix the missing semicolon after export const dynamic
  dashboardContent = dashboardContent.replace(
    'export const dynamic = \'force-dynamic\' // Mock data for charts',
    'export const dynamic = \'force-dynamic\';\n\n// Mock data for charts'
  );
  
  // Fix const declarations
  dashboardContent = dashboardContent.replace(
    '] const winRateByCategory',
    '];\n\nconst winRateByCategory'
  );
  
  dashboardContent = dashboardContent.replace(
    '] const competitorAnalysis',
    '];\n\nconst competitorAnalysis'
  );
  
  dashboardContent = dashboardContent.replace(
    '] const dashboardStats',
    '];\n\nconst dashboardStats'
  );
  
  fs.writeFileSync(dashboardPath, dashboardContent);
}

console.log('\n✅ All final build errors fixed!');