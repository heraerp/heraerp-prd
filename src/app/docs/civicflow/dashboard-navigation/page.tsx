import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'Dashboard & Navigation - Civicflow Documentation',
  description: 'Master the Civicflow dashboard and navigation. Learn about workspace organization, shortcuts, and efficient navigation patterns.',
  keywords: 'Civicflow dashboard, navigation guide, CRM navigation, public sector software UI',
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'Dashboard & Navigation', href: '/docs/civicflow/dashboard-navigation' },
]

export default function DashboardNavigationPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'dashboard-navigation.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <DocsLayout
      content={content}
      sidebar={civicflowSidebar}
      breadcrumbs={breadcrumbs}
    />
  )
}