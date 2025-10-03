'use client'

import dynamic from 'next/dynamic'

const ClientMermaidRenderer = dynamic(() => import('./ClientMermaidRenderer'), {
  ssr: false,
  loading: () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6 mb-4"></div>
    </div>
  )
})

interface DocumentationContentProps {
  htmlContent: string
  mermaidCharts: string[]
}

export default function DocumentationContent({ htmlContent, mermaidCharts }: DocumentationContentProps) {
  return <ClientMermaidRenderer htmlContent={htmlContent} mermaidCharts={mermaidCharts} />
}