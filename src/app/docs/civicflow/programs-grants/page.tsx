import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'Programs and Grants Management - Civicflow Documentation',
  description: 'Complete guide to managing community programs and grant lifecycles in Civicflow. Learn how to design programs, process applications, track services, and manage grant funding.',
  keywords: 'Civicflow programs, grants management, community programs, public sector grants, social services, grant tracking',
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'Programs & Grants', href: '/docs/civicflow/programs-grants' },
]

export default function ProgramsGrantsPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'programs-grants.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <DocsLayout
      content={content}
      sidebar={civicflowSidebar}
      breadcrumbs={breadcrumbs}
    />
  )
}