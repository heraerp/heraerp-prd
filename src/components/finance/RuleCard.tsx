// ================================================================================
// RULE CARD COMPONENT
// Smart Code: HERA.UI.FINANCE.RULE_CARD.v1
// Card display for individual Finance DNA posting rules
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { 
  Code,
  Edit,
  Copy,
  Save,
  Clock,
  ChevronRight,
  AlertCircle
} from 'lucide-react'
import { PostingRule } from '@/lib/schemas/financeRules'
import { cn } from '@/lib/utils'

interface RuleCardProps {
  rule: PostingRule
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onClone: () => void
  onViewJson: () => void
  isToggling?: boolean
}

export function RuleCard({
  rule,
  onToggle,
  onEdit,
  onClone,
  onViewJson,
  isToggling = false
}: RuleCardProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'pos': return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'payments': return 'bg-green-100 text-green-800 border-green-300'
      case 'inventory': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'commissions': return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'fiscal': return 'bg-red-100 text-red-800 border-red-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      !rule.enabled && "opacity-60"
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {rule.title}
              <Badge 
                variant="outline" 
                className="text-xs font-mono"
              >
                {rule.version}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              <code className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                {rule.key}
              </code>
            </div>
          </div>
          
          <Switch
            checked={rule.enabled}
            onCheckedChange={onToggle}
            disabled={isToggling}
            aria-label={`Toggle ${rule.title}`}
          />
        </div>

        {/* Smart Code Badge */}
        <Badge 
          variant="outline" 
          className="mt-2 text-violet-700 border-violet-300 font-mono text-xs"
        >
          {rule.smart_code}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Category Badge */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={cn("text-xs capitalize", getCategoryColor(rule.category))}
          >
            {rule.category}
          </Badge>
          
          {rule.description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
              {rule.description}
            </p>
          )}
        </div>

        {/* Applies To Section */}
        <div className="space-y-1">
          <div className="text-xs font-medium text-gray-700 dark:text-gray-300">
            Applies to:
          </div>
          <div className="flex flex-wrap gap-1">
            {rule.applies_to.map((code, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="text-xs font-mono"
              >
                {code}
              </Badge>
            ))}
          </div>
        </div>

        {/* Mappings Summary */}
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>{rule.mappings.length} mapping{rule.mappings.length !== 1 ? 's' : ''}</span>
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Last run: {formatDate(rule.last_run_at)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            size="sm"
            variant="ghost"
            onClick={onViewJson}
            className="text-xs"
          >
            <Code className="h-3 w-3 mr-1" />
            View JSON
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onEdit}
            className="text-xs"
          >
            <Edit className="h-3 w-3 mr-1" />
            Edit
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            onClick={onClone}
            className="text-xs"
          >
            <Copy className="h-3 w-3 mr-1" />
            Clone to v{parseInt(rule.version.slice(1)) + 1}
          </Button>
        </div>

        {/* Conditions Indicator */}
        {Object.keys(rule.conditions).length > 0 && (
          <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
            <AlertCircle className="h-3 w-3" />
            Has conditional logic
          </div>
        )}
      </CardContent>
    </Card>
  )
}