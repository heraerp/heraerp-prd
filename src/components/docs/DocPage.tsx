import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

interface DocPageProps {
  docPath: string
  breadcrumbs: { label: string; href: string }[]
}

export function DocPage({ docPath, breadcrumbs }: DocPageProps) {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', `${docPath}.md`)

  let content = ''
  try {
    content = fs.readFileSync(filePath, 'utf8')
  } catch (error) {
    content = '# Page Not Found\n\nThe documentation page you are looking for does not exist yet.'
  }

  return <DocsLayout content={content} sidebar={civicflowSidebar} breadcrumbs={breadcrumbs} />
}
