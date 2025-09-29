import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'CRM Constituent Management - Civicflow Documentation',
  description: 'Learn how to manage constituents in Civicflow CRM. Complete guide for tracking citizens, stakeholders, and community members in your public sector organization.',
  keywords: 'Civicflow CRM, constituent management, citizen tracking, public sector CRM, stakeholder management',
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'CRM Module', href: '/docs/civicflow/crm-constituents' },
  { label: 'Constituents', href: '/docs/civicflow/crm-constituents' },
]

export default function CRMConstituentsPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'crm-constituents.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <DocsLayout
      content={content}
      sidebar={civicflowSidebar}
      breadcrumbs={breadcrumbs}
    />
  )
}