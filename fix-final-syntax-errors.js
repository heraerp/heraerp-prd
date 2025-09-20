const fs = require('fs');
const path = require('path');

// Fix UCRRuleManager.tsx
console.log('Fixing UCRRuleManager.tsx...');
const ucrPath = path.join(__dirname, 'src/components/furniture/UCRRuleManager.tsx');
let ucrContent = fs.readFileSync(ucrPath, 'utf8');

// Fix getRuleIcon function
ucrContent = ucrContent.replace(
  'const getRuleIcon = (type: string) => { const config = ruleTypeConfig[type as keyof typeof ruleTypeConfig] || ruleTypeConfig.defaulting const Icon = config.icon',
  'const getRuleIcon = (type: string) => {\n  const config = ruleTypeConfig[type as keyof typeof ruleTypeConfig] || ruleTypeConfig.defaulting;\n  const Icon = config.icon;'
);

// Fix getRuleBadge function
ucrContent = ucrContent.replace(
  'const getRuleBadge = (type: string) => { const config = ruleTypeConfig[type as keyof typeof ruleTypeConfig] || ruleTypeConfig.defaulting',
  'const getRuleBadge = (type: string) => {\n  const config = ruleTypeConfig[type as keyof typeof ruleTypeConfig] || ruleTypeConfig.defaulting;'
);

// Fix testRule function and conditional rendering
const testRuleMatch = ucrContent.match(/const testRule = async[\s\S]*?if \(loading\) \{/);
if (testRuleMatch) {
  const fixedTestRule = `const testRule = async (rule: UCRRule) => {
  // Simulate rule execution
  const testContext = {
    entity_type: 'product',
    smart_code: 'HERA.FURNITURE.PRODUCT.TEST.v1',
    length_cm: 150,
    width_cm: 80,
    height_cm: 90,
    standard_cost_rate: 1500,
    pricing_method: 'standard_markup',
    discount_percent: 20
  };

  const result = {
    ruleId: rule.id,
    ruleName: rule.name,
    timestamp: new Date().toISOString(),
    success: Math.random() > 0.3,
    executionTime: Math.round(Math.random() * 100) + 20,
    context: testContext,
    result: rule.type === 'pricing' 
      ? { calculated_price: 3750 } 
      : rule.type === 'validation' 
      ? { validated: true } 
      : rule.type === 'approval' 
      ? { approval_required: true, approver: 'sales_manager' } 
      : { processed: true }
  };
  
  setExecutionResults(prev => [result, ...prev.slice(0, 4)]);
};

  if (loading) {`;
  
  ucrContent = ucrContent.replace(testRuleMatch[0], fixedTestRule);
}

// Fix the return statements
ucrContent = ucrContent.replace(
  /return \( <div className={cn\('space-y-6', className\)}> <Skeleton className="h-20 w-full" \/> <Skeleton className="h-96 w-full" \/> <\/div>   \) return \(/g,
  'return (\n    <div className={cn(\'space-y-6\', className)}>\n      <Skeleton className="h-20 w-full" />\n      <Skeleton className="h-96 w-full" />\n    </div>\n  );\n  }\n\n  return ('
);

fs.writeFileSync(ucrPath, ucrContent);

// Fix orders/page.tsx
console.log('Fixing orders/page.tsx...');
const ordersPath = path.join(__dirname, 'src/app/furniture/sales/orders/page.tsx');
let ordersContent = fs.readFileSync(ordersPath, 'utf8');

// Fix state declaration
ordersContent = ordersContent.replace(
  'const [stats, setStats] = useState({ activeOrders: 0, monthlyRevenue: 0, avgOrderSize: 0, pendingDelivery: 0 }) useEffect(() => { if (currentOrganization?.id) {',
  'const [stats, setStats] = useState({ activeOrders: 0, monthlyRevenue: 0, avgOrderSize: 0, pendingDelivery: 0 });\n\n  useEffect(() => {\n    if (currentOrganization?.id) {'
);

// Fix price calculation and return
ordersContent = ordersContent.replace(
  'const price = dynamicResponse.data.find((f: any) => f.field_name === \'selling_price\') ?.field_value_number || 0 return {',
  'const price = dynamicResponse.data.find((f: any) => f.field_name === \'selling_price\')?.field_value_number || 0;\n          return {'
);

// Fix missing semicolons
ordersContent = ordersContent.replace(
  'console.error(\'Failed to load data:\', error)   } finally {',
  'console.error(\'Failed to load data:\', error);\n    } finally {'
);

// Fix stats setters
ordersContent = ordersContent.replace(
  'const pendingDelivery =ordersResponse.data.filter( (o: any) => o.status === \'ready_for_delivery\' ).length setStats({ activeOrders, monthlyRevenue, avgOrderSize, pendingDelivery }); } catch (error) {',
  'const pendingDelivery = ordersResponse.data.filter((o: any) => o.status === \'ready_for_delivery\').length;\n    \n    setStats({ activeOrders, monthlyRevenue, avgOrderSize, pendingDelivery });\n  } catch (error) {'
);

fs.writeFileSync(ordersPath, ordersContent);

// Fix tender bid new page
console.log('Fixing tender bid new page...');
const bidNewPath = path.join(__dirname, 'src/app/furniture/tender/[code]/bid/new/page.tsx');
let bidNewContent = fs.readFileSync(bidNewPath, 'utf8');

// Fix console.error line
bidNewContent = bidNewContent.replace(
  'console.error(\'Error saving bid:\', error) toast({ title: \'Error\', description: \'Failed to save bid draft.\', variant: \'destructive\' })   } finally {',
  'console.error(\'Error saving bid:\', error);\n    toast({ title: \'Error\', description: \'Failed to save bid draft.\', variant: \'destructive\' });\n  } finally {'
);

// Fix handleSubmitBid function
bidNewContent = bidNewContent.replace(
  'const handleSubmitBid = async () => { // Validate all required fields if (!formData.bidAmount || formData.documentsChecked.length < requiredDocuments.length) {',
  'const handleSubmitBid = async () => {\n  // Validate all required fields\n  if (!formData.bidAmount || formData.documentsChecked.length < requiredDocuments.length) {'
);

bidNewContent = bidNewContent.replace(
  'toast({ title: \'Incomplete Bid\', description: \'Please complete all required fields and upload all documents.\', variant: \'destructive\' }) return } setLoading(true) try {',
  'toast({ title: \'Incomplete Bid\', description: \'Please complete all required fields and upload all documents.\', variant: \'destructive\' });\n    return;\n  }\n  setLoading(true);\n  try {'
);

fs.writeFileSync(bidNewPath, bidNewContent);

// Fix tender code page
console.log('Fixing tender code page...');
const tenderCodePath = path.join(__dirname, 'src/app/furniture/tender/[code]/page.tsx');
let tenderCodeContent = fs.readFileSync(tenderCodePath, 'utf8');

// Fix variable declarations
tenderCodeContent = tenderCodeContent.replace(
  'const tenderCode = params.code as string const { organizationId, orgLoading } = useFurnitureOrg()',
  'const tenderCode = params.code as string;\n  const { organizationId, orgLoading } = useFurnitureOrg();'
);

// Fix activeTab declaration
tenderCodeContent = tenderCodeContent.replace(
  'const [activeTab, setActiveTab] = useState(\'overview\') if (orgLoading) {',
  'const [activeTab, setActiveTab] = useState(\'overview\');\n\n  if (orgLoading) {'
);

fs.writeFileSync(tenderCodePath, tenderCodeContent);

// Fix customers/page.tsx
console.log('Fixing customers/page.tsx...');
const customersPath = path.join(__dirname, 'src/app/furniture/sales/customers/page.tsx');
let customersContent = fs.readFileSync(customersPath, 'utf8');

// Fix handleDeleteCustomer function
customersContent = customersContent.replace(
  'const handleDeleteCustomer = async () => { if (!customerToDelete) return; setDeleteLoading(true); try { universalApi.setOrganizationId(organizationId!);',
  'const handleDeleteCustomer = async () => {\n  if (!customerToDelete) return;\n  setDeleteLoading(true);\n  try {\n    universalApi.setOrganizationId(organizationId!);'
);

// Fix the await statements
customersContent = customersContent.replace(
  '// Delete customer entity (this will cascade to dynamic data) await universalApi.deleteEntity(customerToDelete.id)',
  '// Delete customer entity (this will cascade to dynamic data)\n    await universalApi.deleteEntity(customerToDelete.id);'
);

customersContent = customersContent.replace(
  '// Refresh the list await refetch()',
  '// Refresh the list\n    await refetch();'
);

customersContent = customersContent.replace(
  '// Close modal and reset setShowDeleteModal(false) setCustomerToDelete(null); } catch (error) {',
  '// Close modal and reset\n    setShowDeleteModal(false);\n    setCustomerToDelete(null);\n  } catch (error) {'
);

customersContent = customersContent.replace(
  'console.error(\'Error deleting customer:\', error) alert(\'Failed to delete customer. Please try again.\'); } finally { setDeleteLoading(false); } }',
  'console.error(\'Error deleting customer:\', error);\n    alert(\'Failed to delete customer. Please try again.\');\n  } finally {\n    setDeleteLoading(false);\n  }\n};'
);

// Fix stats calculation
customersContent = customersContent.replace(
  'const stats = {',
  '  const stats = {'
);

fs.writeFileSync(customersPath, customersContent);

console.log('\n✅ All final syntax errors fixed!');