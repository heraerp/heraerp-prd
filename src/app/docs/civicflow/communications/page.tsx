import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'Communications Hub - Civicflow Documentation',
  description:
    'Master multi-channel communications in Civicflow. Complete guide for email campaigns, SMS messaging, emergency alerts, and constituent engagement.',
  keywords:
    'Civicflow communications, email campaigns, SMS messaging, emergency alerts, constituent outreach, public sector communications'
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'Communications Hub', href: '/docs/civicflow/communications' }
]

export default function CommunicationsPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'communications.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return <DocsLayout content={content} sidebar={civicflowSidebar} breadcrumbs={breadcrumbs} />
}
