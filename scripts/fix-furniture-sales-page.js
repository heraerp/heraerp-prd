#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/furniture/sales/page.tsx');

console.log('Fixing furniture sales page compressed syntax...\n');

try {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix line 28 - Multiple compressed statements
  content = content.replace(
    /const \[demoOrg, setDemoOrg\] = useState<\{ id: string; name: string \} \| null>\(null\) \/\/ Use authenticated org if available.*?pathname\]\)/s,
    `const [demoOrg, setDemoOrg] = useState<{ id: string; name: string } | null>(null)

  // Use authenticated org if available, otherwise use demo org, fallback to Kerala Furniture Works
  const organizationId = currentOrganization?.id || demoOrg?.id || 'f0af4ced-9d12-4a55-a649-b484368db249'
  const organizationName = currentOrganization?.organization_name || demoOrg?.name || 'Kerala Furniture Works (Demo)'
  const orgLoading = isAuthenticated ? isLoadingOrgs : false

  // Use the optimized sales data hook
  const { stats, recentOrders, topProducts, salesTrend, loading, error, refresh } = useSalesData(organizationId)

  // Load demo organization if not authenticated
  useEffect(() => {
    async function loadDemoOrg() {
      if (!isAuthenticated && !currentOrganization) {
        const orgInfo = await getDemoOrganizationInfo(pathname)
        if (orgInfo) {
          setDemoOrg({ id: orgInfo.id, name: orgInfo.name })
        }
      }
    }
    
    loadDemoOrg()
  }, [isAuthenticated, currentOrganization, pathname])`
  );

  // Fix line 33 - Compressed switch statement for getStatusColor
  content = content.replace(
    /const getStatusColor = \(status: string\) => \{ switch \(status\) \{.*?\} \}/s,
    `const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
      case 'pending':
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
      case 'confirmed':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
      case 'in_production':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
      case 'ready_for_delivery':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'delivered':
        return 'bg-muted bg-muted/30 text-foreground dark:text-gray-300'
      case 'paid':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
      case 'unpaid':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
      default:
        return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    }
  }`
  );

  // Fix line 36 - Compressed switch statement for getStatusLabel
  content = content.replace(
    /const getStatusLabel = \(status: string\) => \{ switch \(status\) \{.*?\} \}/s,
    `const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'Pending'
      case 'confirmed':
        return 'Confirmed'
      case 'in_production':
        return 'In Production'
      case 'ready_for_delivery':
        return 'Ready'
      case 'delivered':
        return 'Delivered'
      case 'paid':
        return 'Paid'
      case 'unpaid':
        return 'Unpaid'
      case 'overdue':
        return 'Overdue'
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ')
    }
  }`
  );

  // Fix loading states that are compressed
  content = content.replace(
    /\/\/ Show loading state while organization is loading if \(orgLoading\) \{.*?\}/s,
    `
  // Show loading state while organization is loading
  if (orgLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading organization...</p>
          </div>
        </div>
      </div>
    )
  }`
  );

  // Fix skeleton loading state
  content = content.replace(
    /\/\/ Show skeleton while data is loading if \(loading && recentOrders\.length === 0\) \{.*?\}/s,
    `
  // Show skeleton while data is loading
  if (loading && recentOrders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <div className="p-6">
          <SalesPageSkeleton />
        </div>
      </div>
    )
  }`
  );

  // Fix error state
  content = content.replace(
    /\/\/ Show error state if \(error\) \{.*?\}/s,
    `
  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error loading sales data: {error}</p>
          <Button onClick={refresh} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </div>
      </div>
    )
  }`
  );

  // Fix compressed JSX returns
  content = content.replace(/return \( <div/g, 'return (\n    <div');
  content = content.replace(/\) }/g, ')\n  }');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed furniture sales page');
  
} catch (error) {
  console.error('❌ Error:', error.message);
}