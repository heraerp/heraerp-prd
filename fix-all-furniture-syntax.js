const fs = require('fs');
const path = require('path');

// Fix UCRRuleManager.tsx
console.log('Fixing UCRRuleManager.tsx...');
const ucrPath = path.join(__dirname, 'src/components/furniture/UCRRuleManager.tsx');
let ucrContent = fs.readFileSync(ucrPath, 'utf8');

// Fix the malformed try-catch block
ucrContent = ucrContent.replace(
  /try\s*{\s*return JSON\.parse\(field\.field_value_json\s*\)\s*catch\s*\(e\)\s*{/g,
  'try { return JSON.parse(field.field_value_json); } catch (e) {'
);

// Fix missing semicolons
ucrContent = ucrContent.replace(
  'const ucrRules = entities?.filter((e: any) => e.entity_type === \'ucr_rule\') || [] // Get dynamic data for rules const { data: dynamicData } = await universalApi.read({ table: \'core_dynamic_data\', organizationId }) // Build complete rule objects const rulesWithLogic = ucrRules.map((rule: any) => { const ruleData = dynamicData?.filter((d: any) => d.entity_id === rule.id) || [] const parseField = (fieldName: string) => {',
  'const ucrRules = entities?.filter((e: any) => e.entity_type === \'ucr_rule\') || [];\n      // Get dynamic data for rules\n      const { data: dynamicData } = await universalApi.read({ table: \'core_dynamic_data\', organizationId });\n      // Build complete rule objects\n      const rulesWithLogic = ucrRules.map((rule: any) => {\n        const ruleData = dynamicData?.filter((d: any) => d.entity_id === rule.id) || [];\n        const parseField = (fieldName: string) => {'
);

// Fix missing semicolons in field parsing
ucrContent = ucrContent.replace(
  'const field = ruleData.find((d: any) => d.field_name === fieldName) if (!field) return null if (field.field_value_json) {',
  'const field = ruleData.find((d: any) => d.field_name === fieldName);\n        if (!field) return null;\n        if (field.field_value_json) {'
);

// Fix return statement
ucrContent = ucrContent.replace(
  'return field.field_value_number || field.field_value_text } return {',
  'return field.field_value_number || field.field_value_text;\n        };\n        return {'
);

// Fix closing braces
ucrContent = ucrContent.replace(
  'parameters: parseField(\'rule_parameters\'  ) }) setRules(rulesWithLogic) if (rulesWithLogic.length > 0 && !selectedRule) {',
  'parameters: parseField(\'rule_parameters\')\n        };\n      });\n      setRules(rulesWithLogic);\n      if (rulesWithLogic.length > 0 && !selectedRule) {'
);

ucrContent = ucrContent.replace(
  'setSelectedRule(rulesWithLogic[0]  )   } catch (err) {',
  'setSelectedRule(rulesWithLogic[0]);\n      }\n    } catch (err) {'
);

fs.writeFileSync(ucrPath, ucrContent);

// Fix customers/page.tsx
console.log('Fixing customers/page.tsx...');
const customersPath = path.join(__dirname, 'src/app/furniture/sales/customers/page.tsx');
let customersContent = fs.readFileSync(customersPath, 'utf8');

// Fix filter function structure
customersContent = customersContent.replace(
  /const filteredCustomers = customers\?\.filter\(customer => \{ if \(filterType === 'active'\) \{\s*const metrics = getCustomerMetrics\(customer\.id\)\s*return \( metrics\.orderCount > 0 && metrics\.lastOrderDate && new Date\(metrics\.lastOrderDate\) > new Date\(Date\.now\(\) - 90 \* 24 \* 60 \* 60 \* 1000\) \)\s*\/\/ Active in last 90 days \} if \(filterType === 'inactive'\) \{/g,
  `const filteredCustomers = customers?.filter(customer => {
    if (filterType === 'active') {
      const metrics = getCustomerMetrics(customer.id);
      return metrics.orderCount > 0 && metrics.lastOrderDate && new Date(metrics.lastOrderDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }
    if (filterType === 'inactive') {`
);

customersContent = customersContent.replace(
  'return (metrics.orderCount === 0 || !metrics.lastOrderDate || new Date(metrics.lastOrderDate) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); } return true; })',
  `return metrics.orderCount === 0 || !metrics.lastOrderDate || new Date(metrics.lastOrderDate) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }
    return true;
  });`
);

// Fix stats calculation
customersContent = customersContent.replace(
  /const stats = \{ total: customers\?\.length \|\| 0, active: filteredCustomers\?\.filter\(c => \{\s*const metrics = getCustomerMetrics\(c\.id\)\s*return \(metrics\.orderCount > 0 && metrics\.lastOrderDate && new Date\(metrics\.lastOrderDate\) > new Date\(Date\.now\(\) - 90 \* 24 \* 60 \* 60 \* 1000\)\); \}\)\.length \|\| 0, totalRevenue: transactions\?\.reduce\(\(sum, t\) => sum \+ t\.total_amount, 0\) \|\| 0 \};/g,
  `const stats = {
    total: customers?.length || 0,
    active: filteredCustomers?.filter(c => {
      const metrics = getCustomerMetrics(c.id);
      return metrics.orderCount > 0 && metrics.lastOrderDate && new Date(metrics.lastOrderDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    }).length || 0,
    totalRevenue: transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0
  };`
);

fs.writeFileSync(customersPath, customersContent);

// Fix orders/page.tsx
console.log('Fixing orders/page.tsx...');
const ordersPath = path.join(__dirname, 'src/app/furniture/sales/orders/page.tsx');
let ordersContent = fs.readFileSync(ordersPath, 'utf8');

// Fix loadData function
ordersContent = ordersContent.replace(
  'if (currentOrganization?.id) {\n  loadData(  ) }, [currentOrganization])',
  'if (currentOrganization?.id) {\n    loadData();\n  }\n}, [currentOrganization]);'
);

// Fix missing semicolon and async
ordersContent = ordersContent.replace(
  'const loadData = async () => { try { setLoading(true) universalApi.setOrganizationId(currentOrganization?.id || \'\')',
  'const loadData = async () => {\n  try {\n    setLoading(true);\n    universalApi.setOrganizationId(currentOrganization?.id || \'\');'
);

// Fix the await and filters
ordersContent = ordersContent.replace(
  'const productsResponse =await universalApi.read(\'core_entities\', { filters: [\n  { field: \'entity_type\', operator: \'eq\', value: \'product\' },\n  { field: \'smart_code\', operator: \'like\', value: \'%FURNITURE.MASTER.PRODUCT%\' }\n], limit: 10 })',
  'const productsResponse = await universalApi.read(\'core_entities\', {\n      filters: [\n        { field: \'entity_type\', operator: \'eq\', value: \'product\' },\n        { field: \'smart_code\', operator: \'like\', value: \'%FURNITURE.MASTER.PRODUCT%\' }\n      ],\n      limit: 10\n    });'
);

// Fix dynamic response await
ordersContent = ordersContent.replace(
  'const dynamicResponse =await universalApi.read(\'core_dynamic_data\', { filters: [\n  { field: \'entity_id\', operator: \'eq\', value: product.id },\n  { field: \'field_name\', operator: \'in\', value: [\'selling_price\'] }\n] })',
  'const dynamicResponse = await universalApi.read(\'core_dynamic_data\', {\n        filters: [\n          { field: \'entity_id\', operator: \'eq\', value: product.id },\n          { field: \'field_name\', operator: \'in\', value: [\'selling_price\'] }\n        ]\n      });'
);

// Fix orders response await
ordersContent = ordersContent.replace(
  'const ordersResponse =await universalApi.read(\'universal_transactions\', { filters: [\n  { field: \'transaction_type\', operator: \'eq\', value: \'sales_order\' },\n  { field: \'smart_code\', operator: \'like\', value: \'%FURNITURE.SALES%\' }\n], orderBy: { field: \'created_at\', direction: \'desc\' }, limit: 10 })',
  'const ordersResponse = await universalApi.read(\'universal_transactions\', {\n      filters: [\n        { field: \'transaction_type\', operator: \'eq\', value: \'sales_order\' },\n        { field: \'smart_code\', operator: \'like\', value: \'%FURNITURE.SALES%\' }\n      ],\n      orderBy: { field: \'created_at\', direction: \'desc\' },\n      limit: 10\n    });'
);

// Fix stats calculation
ordersContent = ordersContent.replace(
  'const activeOrders =ordersResponse.data.filter((o: any) => [\'pending_approval\', \'confirmed\', \'in_production\'].includes(o.status) ).length const currentMonth = new Date().getMonth()',
  'const activeOrders = ordersResponse.data.filter((o: any) => [\'pending_approval\', \'confirmed\', \'in_production\'].includes(o.status)).length;\n    const currentMonth = new Date().getMonth();'
);

// Fix return object spacing
ordersContent = ordersContent.replace(
  'return { id: product.id, name: product.entity_name, category: (product.metadata as any)?.category || \'General\', price: price, image: \'/api/placeholder/100/100\', sku: product.entity_code } }) ) setFurnitureItems(productsWithPrices)',
  'return {\n            id: product.id,\n            name: product.entity_name,\n            category: (product.metadata as any)?.category || \'General\',\n            price: price,\n            image: \'/api/placeholder/100/100\',\n            sku: product.entity_code\n          };\n        })\n      );\n      setFurnitureItems(productsWithPrices);'
);

// Fix date formatting parenthesis
ordersContent = ordersContent.replace(
  'date: new Date(order.transaction_date).toLocaleDateString(\'en-IN\'  ) }) ) setRecentOrders(enrichedOrders)',
  'date: new Date(order.transaction_date).toLocaleDateString(\'en-IN\')\n        };\n      });\n      setRecentOrders(enrichedOrders);'
);

// Fix getStatusBadge
ordersContent = ordersContent.replace(
  'const statusConfig ={ pending_approval:',
  'const statusConfig = {\n    pending_approval:'
);

fs.writeFileSync(ordersPath, ordersContent);

// Fix tender/[code]/bid/new/page.tsx
console.log('Fixing tender bid new page...');
const bidNewPath = path.join(__dirname, 'src/app/furniture/tender/[code]/bid/new/page.tsx');
let bidNewContent = fs.readFileSync(bidNewPath, 'utf8');

// Fix calculateTotalBid function
bidNewContent = bidNewContent.replace(
  'const breakdown =formData.priceBreakdown const total = parseFloat(breakdown.materialCost || \'0\') + parseFloat(breakdown.transportCost || \'0\') + parseFloat(breakdown.laborCost || \'0\') + parseFloat(breakdown.overheads || \'0\') + parseFloat(breakdown.profit || \'0\')',
  'const breakdown = formData.priceBreakdown;\n  const total = parseFloat(breakdown.materialCost || \'0\') + parseFloat(breakdown.transportCost || \'0\') + parseFloat(breakdown.laborCost || \'0\') + parseFloat(breakdown.overheads || \'0\') + parseFloat(breakdown.profit || \'0\');'
);

bidNewContent = bidNewContent.replace(
  'return total }',
  'return total;\n}'
);

// Fix handleSubmitDraft function
bidNewContent = bidNewContent.replace(
  'const handleSubmitDraft = async () => { setLoading(true) try {',
  'const handleSubmitDraft = async () => {\n  setLoading(true);\n  try {'
);

bidNewContent = bidNewContent.replace(
  'const bidData ={ entity_type:',
  'const bidData = {\n    entity_type:'
);

bidNewContent = bidNewContent.replace(
  'const result = await universalApi.createEntity(bidData) toast({ title: \'Bid Draft Saved\', description: \'Your bid has been saved as draft.\' }) router.push(`/furniture/tender/${code}`  ) catch (error) {',
  'const result = await universalApi.createEntity(bidData);\n    toast({ title: \'Bid Draft Saved\', description: \'Your bid has been saved as draft.\' });\n    router.push(`/furniture/tender/${code}`);\n  } catch (error) {'
);

fs.writeFileSync(bidNewPath, bidNewContent);

// Fix tender/[code]/page.tsx
console.log('Fixing tender code page...');
const tenderCodePath = path.join(__dirname, 'src/app/furniture/tender/[code]/page.tsx');
let tenderCodeContent = fs.readFileSync(tenderCodePath, 'utf8');

// Fix the array literal and object
tenderCodeContent = tenderCodeContent.replace(
  '// ... more lots ], documents: [',
  '// ... more lots\n    ],\n    documents: ['
);

fs.writeFileSync(tenderCodePath, tenderCodeContent);

console.log('\n✅ All furniture module syntax errors fixed!');