#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix the remaining furniture files with syntax errors
const filesToFix = [
  'src/app/furniture/production/orders/[id]/page.tsx',
  'src/app/furniture/production/orders/new/page.tsx'
];

function fixProductionDetailPage(content) {
  // Fix the compressed getEntityName function
  content = content.replace(
    /const getEntityName = \(entityId: string\) => \{ const entity = entities\?\.\find\(e => e\.id === entityId\) return entity\?\.\entity_name \|\| 'Unknown' \}/g,
    `const getEntityName = (entityId: string) => {
    const entity = entities?.find(e => e.id === entityId)
    return entity?.entity_name || 'Unknown'
  }`
  );

  // Fix the compressed statusConfig
  content = content.replace(
    /const getStatusBadge = \(status: string\) => \{ const statusConfig = \{[^}]+\}/g,
    `const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-200', icon: Clock },
      in_progress: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-200', icon: Package },
      completed: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-200', icon: CheckCircle },
      cancelled: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200', icon: AlertCircle }
    }`
  );

  // Fix compressed variable declarations by separating them
  content = content.replace(
    /const \[activeTab, setActiveTab\] = useState\('details'\) \/\/ Load the specific production order const/g,
    `const [activeTab, setActiveTab] = useState('details')

  // Load the specific production order
  const`
  );

  content = content.replace(
    /const order = productionOrders\?\.\[0\] \/\/ Load entities for customer and product names const/g,
    `const order = productionOrders?.[0]

  // Load entities for customer and product names
  const`
  );

  // Fix the compressed import statements
  content = content.replace(
    /import \{ useState, useEffect, use \}\nfrom 'react'/g,
    "import { useState, useEffect, use } from 'react'"
  );

  content = content.replace(
    /import \{ useRouter \}\nfrom 'next\/navigation'/g,
    "import { useRouter } from 'next/navigation'"
  );

  content = content.replace(
    /import \{ ArrowLeft, Edit2, Trash2, Calendar, Package, User, FileText, Clock, CheckCircle, AlertCircle, Truck\n\}\nfrom 'lucide-react'/g,
    "import { ArrowLeft, Edit2, Trash2, Calendar, Package, User, FileText, Clock, CheckCircle, AlertCircle, Truck } from 'lucide-react'"
  );

  content = content.replace(
    /import \{ useDemoOrganization \}\nfrom '@\/lib\/dna\/patterns\/demo-org-pattern'/g,
    "import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'"
  );

  content = content.replace(
    /import \{ useUniversalData, universalFilters\n\}\nfrom '@\/lib\/dna\/patterns\/universal-api-loading-pattern'/g,
    "import { useUniversalData, universalFilters } from '@/lib/dna/patterns/universal-api-loading-pattern'"
  );

  content = content.replace(
    /import \{ formatCurrency \}\nfrom '@\/lib\/utils'/g,
    "import { formatCurrency } from '@/lib/utils'"
  );

  content = content.replace(
    /import \{ format \}\nfrom 'date-fns'/g,
    "import { format } from 'date-fns'"
  );

  // Fix the function parameters
  content = content.replace(
    /export default function ProductionOrderDetailPage\(\{ params \}: \{\n  params: Promise<\{ id: string \}> \}\) \{/g,
    `export default function ProductionOrderDetailPage({ params }: {
  params: Promise<{ id: string }>
}) {`
  );

  return content;
}

function fixProductionNewPage(content) {
  // Fix the compressed useState
  content = content.replace(
    /const \[orderLines, setOrderLines\] = useState<OrderLine\[\]>\(\[\]\) \/\/ Load customers const/g,
    `const [orderLines, setOrderLines] = useState<OrderLine[]>([])

  // Load customers
  const`
  );

  // Fix other compressed patterns
  content = content.replace(
    /const \[formData, setFormData\] = useState\(\{[^}]+\}\)/g,
    `const [formData, setFormData] = useState({
    customerId: '',
    deliveryDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 7 days from now
    priority: 'normal',
    notes: ''
  })`
  );

  return content;
}

// Process each file
filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  if (file.includes('[id]')) {
    content = fixProductionDetailPage(content);
  } else if (file.includes('new')) {
    content = fixProductionNewPage(content);
  }
  
  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed syntax errors in ${file}`);
  } else {
    console.log(`ℹ️  No changes needed for ${file}`);
  }
});

console.log('\n✨ Remaining furniture production syntax fixes complete!');