import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'Organization Management - Civicflow CRM Documentation',
  description: 'Comprehensive guide to managing organizations in Civicflow CRM. Learn how to track businesses, non-profits, government agencies, and other entities.',
  keywords: 'Civicflow organizations, business management, CRM organizations, entity tracking, public sector CRM',
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'CRM Module', href: '/docs/civicflow/crm-constituents' },
  { label: 'Organizations', href: '/docs/civicflow/crm-organizations' },
]

export default function CRMOrganizationsPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'crm-organizations.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <DocsLayout
      content={content}
      sidebar={civicflowSidebar}
      breadcrumbs={breadcrumbs}
    />
  )
}