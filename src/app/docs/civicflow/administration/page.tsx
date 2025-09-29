import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'Administration & Security - Civicflow Documentation',
  description: 'Complete guide to Civicflow administration and security. User management, access control, compliance, system configuration, and security operations for government agencies.',
  keywords: 'Civicflow administration, system security, user management, access control, compliance management, government security',
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'Administration', href: '/docs/civicflow/administration' },
]

export default function AdministrationPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'administration.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <DocsLayout
      content={content}
      sidebar={civicflowSidebar}
      breadcrumbs={breadcrumbs}
    />
  )
}