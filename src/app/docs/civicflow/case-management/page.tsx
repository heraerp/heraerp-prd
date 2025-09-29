import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'Case Management System - Civicflow Documentation',
  description: 'Master case management in Civicflow. Complete guide for tracking service requests, complaints, and citizen issues from intake to resolution.',
  keywords: 'Civicflow case management, service requests, complaint tracking, issue resolution, public sector case system',
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'CRM Module', href: '/docs/civicflow/crm-constituents' },
  { label: 'Case Management', href: '/docs/civicflow/case-management' },
]

export default function CaseManagementPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'case-management.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <DocsLayout
      content={content}
      sidebar={civicflowSidebar}
      breadcrumbs={breadcrumbs}
    />
  )
}