import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'Workflow Automation & Playbooks - Civicflow Documentation',
  description: 'Learn how to automate government processes with Civicflow playbooks. Visual workflow designer, pre-built templates, and intelligent routing for efficient operations.',
  keywords: 'Civicflow automation, workflow playbooks, process automation, government workflows, business process automation, visual workflow designer',
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'Automation', href: '/docs/civicflow/automation' },
]

export default function AutomationPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'automation.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <DocsLayout
      content={content}
      sidebar={civicflowSidebar}
      breadcrumbs={breadcrumbs}
    />
  )
}