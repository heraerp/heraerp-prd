// ================================================================================
// JSON VIEW COMPONENT
// Smart Code: HERA.UI.COMMON.JSON_VIEW.v1
// Read-only JSON viewer with syntax highlighting and collapsible sections
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/src/components/ui/collapsible'
import { Copy, ChevronRight, ChevronDown, Check } from 'lucide-react'
import { cn } from '@/src/lib/utils'

interface JsonViewProps {
  data: any
  className?: string
  defaultExpanded?: boolean
  maxHeight?: number
  title?: string
}

export function JsonView({
  data,
  className,
  defaultExpanded = true,
  maxHeight = 400,
  title
}: JsonViewProps) {
  const [expanded, setExpanded] = React.useState(defaultExpanded)
  const [copied, setCopied] = React.useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const renderValue = (value: any, depth: number = 0): React.ReactNode => {
    if (value === null) {
      return <span className="text-orange-600 dark:text-orange-400">null</span>
    }

    if (value === undefined) {
      return <span className="text-orange-600 dark:text-orange-400">undefined</span>
    }

    if (typeof value === 'boolean') {
      return (
        <span className="text-purple-600 dark:text-purple-400">
          {value.toString()}
        </span>
      )
    }

    if (typeof value === 'number') {
      return <span className="text-blue-600 dark:text-blue-400">{value}</span>
    }

    if (typeof value === 'string') {
      // Check if it's a smart code
      if (value.startsWith('HERA.')) {
        return (
          <Badge variant="outline" className="text-xs font-mono">
            {value}
          </Badge>
        )
      }
      return (
        <span className="text-green-600 dark:text-green-400">
          "{value}"
        </span>
      )
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return <span className="text-gray-500">[]</span>
      }

      return (
        <CollapsibleArray
          items={value}
          depth={depth}
          renderValue={renderValue}
        />
      )
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value)
      if (entries.length === 0) {
        return <span className="text-gray-500">{'{}'}</span>
      }

      return (
        <CollapsibleObject
          entries={entries}
          depth={depth}
          renderValue={renderValue}
        />
      )
    }

    return <span className="text-gray-700 dark:text-gray-300">{String(value)}</span>
  }

  return (
    <Card className={cn('relative', className)}>
      <CardContent className="p-4">
        {title && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {title}
            </h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={copyToClipboard}
              className="h-8 px-2"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        )}

        <Collapsible open={expanded} onOpenChange={setExpanded}>
          <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium mb-2 hover:text-violet-600 transition-colors">
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
            {expanded ? 'Collapse' : 'Expand'} JSON
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div
              className="font-mono text-sm overflow-auto bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg"
              style={{ maxHeight: `${maxHeight}px` }}
            >
              <pre className="whitespace-pre-wrap break-words">
                {renderValue(data)}
              </pre>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

// Collapsible array component
function CollapsibleArray({
  items,
  depth,
  renderValue
}: {
  items: any[]
  depth: number
  renderValue: (value: any, depth: number) => React.ReactNode
}) {
  const [expanded, setExpanded] = React.useState(depth < 2)
  const indent = '  '.repeat(depth + 1)

  return (
    <>
      <span className="text-gray-700 dark:text-gray-300">[</span>
      {expanded ? (
        <>
          {items.map((item, index) => (
            <div key={index} className="ml-4">
              <span className="text-gray-500">{indent}</span>
              {renderValue(item, depth + 1)}
              {index < items.length - 1 && ','}
            </div>
          ))}
          <div>
            <span className="text-gray-500">{'  '.repeat(depth)}</span>
            <span className="text-gray-700 dark:text-gray-300">]</span>
          </div>
        </>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="text-blue-600 hover:underline mx-1 text-xs"
        >
          {items.length} items
        </button>
      )}
      {!expanded && <span className="text-gray-700 dark:text-gray-300">]</span>}
    </>
  )
}

// Collapsible object component
function CollapsibleObject({
  entries,
  depth,
  renderValue
}: {
  entries: [string, any][]
  depth: number
  renderValue: (value: any, depth: number) => React.ReactNode
}) {
  const [expanded, setExpanded] = React.useState(depth < 2)
  const indent = '  '.repeat(depth + 1)

  return (
    <>
      <span className="text-gray-700 dark:text-gray-300">{'{'}</span>
      {expanded ? (
        <>
          {entries.map(([key, value], index) => (
            <div key={key} className="ml-4">
              <span className="text-gray-500">{indent}</span>
              <span className="text-red-600 dark:text-red-400">"{key}"</span>
              <span className="text-gray-700 dark:text-gray-300">: </span>
              {renderValue(value, depth + 1)}
              {index < entries.length - 1 && ','}
            </div>
          ))}
          <div>
            <span className="text-gray-500">{'  '.repeat(depth)}</span>
            <span className="text-gray-700 dark:text-gray-300">{'}'}</span>
          </div>
        </>
      ) : (
        <button
          onClick={() => setExpanded(true)}
          className="text-blue-600 hover:underline mx-1 text-xs"
        >
          {entries.length} properties
        </button>
      )}
      {!expanded && <span className="text-gray-700 dark:text-gray-300">{'}'}</span>}
    </>
  )
}