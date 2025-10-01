import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'Help & Support - Civicflow Documentation',
  description:
    'Get help with Civicflow. Access support resources, training programs, troubleshooting guides, and contact information for comprehensive assistance.',
  keywords:
    'Civicflow support, help center, training, troubleshooting, customer support, technical assistance'
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'Help & Support', href: '/docs/civicflow/support' }
]

export default function SupportPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'support.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return <DocsLayout content={content} sidebar={civicflowSidebar} breadcrumbs={breadcrumbs} />
}
