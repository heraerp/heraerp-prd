import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import fs from 'fs'
import path from 'path'

export const metadata = {
  title: 'AI-Powered Features - Civicflow Documentation',
  description: 'Explore AI capabilities in Civicflow. Intelligent document processing, natural language understanding, predictive analytics, and responsible AI for government.',
  keywords: 'Civicflow AI, artificial intelligence, machine learning, document processing, predictive analytics, government AI, responsible AI',
}

// Define breadcrumbs
const breadcrumbs = [
  { label: 'Documentation', href: '/docs/civicflow' },
  { label: 'AI Features', href: '/docs/civicflow/ai-features' },
]

export default function AIFeaturesPage() {
  // Read the markdown content from the docs folder
  const filePath = path.join(process.cwd(), 'docs', 'civicflow', 'ai-features.md')
  const content = fs.readFileSync(filePath, 'utf8')

  return (
    <DocsLayout
      content={content}
      sidebar={civicflowSidebar}
      breadcrumbs={breadcrumbs}
    />
  )
}