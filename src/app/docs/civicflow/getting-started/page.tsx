import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'Getting Started with Civicflow - Setup Guide',
  description: 'Learn how to get started with Civicflow CRM and grants management platform. Complete setup guide for new users and administrators.',
  keywords: 'Civicflow getting started, CRM setup, public sector software setup, grants management setup',
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'Getting Started', href: '/docs/civicflow/getting-started' },
]

export default function GettingStartedPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'getting-started.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <DocsLayout
      content={content}
      sidebar={civicflowSidebar}
      breadcrumbs={breadcrumbs}
    />
  )
}