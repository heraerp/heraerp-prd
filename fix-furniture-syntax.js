const fs = require('fs');
const path = require('path');

// Fix furniture/sales/customers/page.tsx
const customersPagePath = path.join(__dirname, 'src/app/furniture/sales/customers/page.tsx');
let customersContent = fs.readFileSync(customersPagePath, 'utf8');

// Fix line 34 - missing closing brace
customersContent = customersContent.replace(
  'const field =dynamicData?.find(d => d.entity_id === customerId && d.field_name === fieldName) return field?.field_value_text || field?.field_value_number || \'\' }',
  'const field = dynamicData?.find(d => d.entity_id === customerId && d.field_name === fieldName); return field?.field_value_text || field?.field_value_number || \'\'; }'
);

// Fix line 37 - missing semicolon and closing brace
customersContent = customersContent.replace(
  'const customerTransactions =transactions?.filter(t => t.from_entity_id === customerId) || [] const totalRevenue = customerTransactions.reduce((sum, t) => sum + t.total_amount, 0)',
  'const customerTransactions = transactions?.filter(t => t.from_entity_id === customerId) || []; const totalRevenue = customerTransactions.reduce((sum, t) => sum + t.total_amount, 0);'
);

// Fix line 40 - missing closing brace and semicolons
customersContent = customersContent.replace(
  'const lastOrderDate =customerTransactions.sort( (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime() )[0]?.transaction_date return { totalRevenue, orderCount, lastOrderDate } }',
  'const lastOrderDate = customerTransactions.sort((a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime())[0]?.transaction_date; return { totalRevenue, orderCount, lastOrderDate }; }'
);

// Fix line 47 - missing closing brace
customersContent = customersContent.replace(
  'return ( metrics.orderCount === 0 || !metrics.lastOrderDate || new Date(metrics.lastOrderDate) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)   ) return true })',
  'return (metrics.orderCount === 0 || !metrics.lastOrderDate || new Date(metrics.lastOrderDate) <= new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); } return true; })'
);

// Fix line 49 - missing closing braces
customersContent = customersContent.replace(
  'const handleDeleteCustomer = async () => { if (!customerToDelete) return setDeleteLoading(true) try { universalApi.setOrganizationId(organizationId!)',
  'const handleDeleteCustomer = async () => { if (!customerToDelete) return; setDeleteLoading(true); try { universalApi.setOrganizationId(organizationId!);'
);

// Fix line 52-53 - missing closing braces
customersContent = customersContent.replace(
  'setCustomerToDelete(null  ) catch (error) {',
  'setCustomerToDelete(null); } catch (error) {'
);

customersContent = customersContent.replace(
  'alert(\'Failed to delete customer. Please try again.\'  ) finally { setDeleteLoading(false  ) }',
  'alert(\'Failed to delete customer. Please try again.\'); } finally { setDeleteLoading(false); } }'
);

// Fix line 57 - missing closing brace
customersContent = customersContent.replace(
  'return ( metrics.orderCount > 0 && metrics.lastOrderDate && new Date(metrics.lastOrderDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)   )).length || 0, totalRevenue: transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0 } if (orgLoading) {',
  'return (metrics.orderCount > 0 && metrics.lastOrderDate && new Date(metrics.lastOrderDate) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)); }).length || 0, totalRevenue: transactions?.reduce((sum, t) => sum + t.total_amount, 0) || 0 }; if (orgLoading) {'
);

// Fix line 79 - missing closing brace
customersContent = customersContent.replace(
  'onClick={() => { setCustomerToDelete(customer) setShowDeleteModal(true  )',
  'onClick={() => { setCustomerToDelete(customer); setShowDeleteModal(true); }}'
);

// Fix line 82 - missing closing brace
customersContent = customersContent.replace(
  'onClick={() => { setShowDeleteModal(false) setCustomerToDelete(null  )',
  'onClick={() => { setShowDeleteModal(false); setCustomerToDelete(null); }}'
);

fs.writeFileSync(customersPagePath, customersContent);
console.log('✅ Fixed furniture/sales/customers/page.tsx');

// Fix furniture/sales/orders/page.tsx
const ordersPagePath = path.join(__dirname, 'src/app/furniture/sales/orders/page.tsx');
if (fs.existsSync(ordersPagePath)) {
  let ordersContent = fs.readFileSync(ordersPagePath, 'utf8');
  
  // Fix import statements
  ordersContent = ordersContent.replace(
    'import { format } from \'date-fns\' import { useDemoOrganization } from \'@/lib/dna/patterns/demo-org-pattern\'',
    'import { format } from \'date-fns\';\nimport { useDemoOrganization } from \'@/lib/dna/patterns/demo-org-pattern\';'
  );
  
  // Fix missing semicolons and braces
  ordersContent = ordersContent.replace(/\) catch \(/g, '); } catch (');
  ordersContent = ordersContent.replace(/\) finally \{/g, '); } finally {');
  
  fs.writeFileSync(ordersPagePath, ordersContent);
  console.log('✅ Fixed furniture/sales/orders/page.tsx');
}