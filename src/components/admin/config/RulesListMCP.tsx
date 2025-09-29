'use client'

import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUCRMCP } from '@/lib/hooks/use-ucr-mcp'
import {
  Scale,
  Edit,
  Copy,
  MoreHorizontal,
  ChevronRight,
  FileCode,
  Clock,
  CheckCircle,
  AlertCircle,
  FileText,
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  Eye,
  GitBranch,
  Calendar,
  History,
  TestTube
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { formatDate } from '@/lib/date-utils'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface RulesListMCPProps {
  organizationId: string
  onCreateRule?: () => void
}

export function RulesListMCP({ organizationId, onCreateRule }: RulesListMCPProps) {
  const {
    loading,
    error,
    listTemplates,
    searchRules,
    cloneTemplate,
    getRule,
    deployRule,
    validateRule,
    simulateRule,
    getAuditLog
  } = useUCRMCP()
  const { toast } = useToast()

  const [rules, setRules] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedRule, setSelectedRule] = useState<any>(null)
  const [showAuditLog, setShowAuditLog] = useState(false)
  const [auditEvents, setAuditEvents] = useState<any[]>([])

  useEffect(() => {
    loadRules()
    loadTemplates()
  }, [organizationId])

  const loadRules = async () => {
    try {
      const rulesData = await searchRules('*', [], false)
      setRules(rulesData)
    } catch (err) {
      console.error('Failed to load rules:', err)
    }
  }

  const loadTemplates = async () => {
    try {
      const templatesData = await listTemplates()
      setTemplates(templatesData)
    } catch (err) {
      console.error('Failed to load templates:', err)
    }
  }

  const handleCloneTemplate = async (template: any) => {
    const smartCode = `${template.smart_code.replace('.v1', '')}.CUSTOM.v1`
    try {
      const result = await cloneTemplate(template.template_id, smartCode)
      toast({
        title: 'Template Cloned',
        description: `Created new rule with ID: ${result.rule_id}`
      })
      await loadRules()
      setShowTemplates(false)
    } catch (err: any) {
      toast({
        title: 'Clone Failed',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const handleViewAuditLog = async (rule: any) => {
    try {
      const events = await getAuditLog(rule.id)
      setAuditEvents(events)
      setSelectedRule(rule)
      setShowAuditLog(true)
    } catch (err: any) {
      toast({
        title: 'Failed to load audit log',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const handleDeployRule = async (rule: any) => {
    try {
      const result = await deployRule(
        rule.id,
        { apps: ['salon'], locations: ['all'] },
        new Date().toISOString(),
        undefined,
        [{ user_id: 'current-user', at: new Date().toISOString() }]
      )
      toast({
        title: 'Rule Deployed',
        description: `Deployment transaction: ${result.deployment_txn_id}`
      })
      await loadRules()
    } catch (err: any) {
      toast({
        title: 'Deployment Failed',
        description: err.message,
        variant: 'destructive'
      })
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
      draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
      deprecated: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
    }
    return <Badge className={variants[status] || variants.draft}>{status}</Badge>
  }

  const filteredRules = rules.filter(
    rule =>
      rule.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.smart_code?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-primary" />
              <CardTitle>Universal Configuration Rules</CardTitle>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-2"
              >
                <FileText className="w-4 h-4" />
                Templates
              </Button>
              <Button
                onClick={onCreateRule}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-foreground"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Rule
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search rules by name or smart code..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={loadRules} disabled={loading}>
              <RefreshCw className={`w-4 h-4 ${loading ?'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Rules List */}
      <div className="space-y-4">
        {filteredRules.map(rule => (
          <Card key={rule.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{rule.entity_name}</h3>
                    {getStatusBadge(rule.status)}
                    {(rule.metadata as any)?.rule_version && (
                      <Badge variant="outline">v{rule.metadata.rule_version}</Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <code className="bg-muted dark:bg-muted px-2 py-1 rounded">
                      {rule.smart_code}
                    </code>
                  </div>
                  {(rule.metadata as any)?.tags && (
                    <div className="flex gap-2 mt-2">
                      {rule.metadata.tags.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Created {formatDate(new Date(rule.created_at), 'MMM dd, yyyy')}
                    </span>
                    {(rule.metadata as any)?.owner && <span>Owner: {rule.metadata.owner}</span>}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() =>
                        (window.location.href = `/salon-data/config/test?rule=${rule.id}`)
                      }
                      className="flex items-center gap-2"
                    >
                      <TestTube className="w-4 h-4" />
                      Test Rule
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleViewAuditLog(rule)}
                      className="flex items-center gap-2"
                    >
                      <History className="w-4 h-4" />
                      View Audit Log
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() =>
                        (window.location.href = `/salon-data/config/deploy?rule=${rule.id}`)
                      }
                      disabled={rule.status === 'active'}
                      className="flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Deploy Rule
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2">
                      <GitBranch className="w-4 h-4" />
                      Create Version
                    </DropdownMenuItem>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Copy className="w-4 h-4" />
                      Duplicate Rule
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRules.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Scale className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              {searchQuery ? 'No rules found matching your search' : 'No rules configured yet'}
            </p>
            <Button onClick={() => setShowTemplates(true)} className="mt-4" variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Browse Templates
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onOpenChange={setShowTemplates}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rule Templates</DialogTitle>
            <DialogDescription>
              Clone a template to quickly create new rules for your organization
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            {templates.map(template => (
              <Card key={template.template_id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium">{template.title}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.rule_payload.description}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline">{template.industry}</Badge>
                      <Badge variant="outline">{template.module}</Badge>
                    </div>
                    <code className="text-xs bg-muted dark:bg-muted px-2 py-1 rounded mt-2 inline-block">
                      {template.smart_code}
                    </code>
                  </div>
                  <Button onClick={() => handleCloneTemplate(template)} size="sm">
                    <Copy className="w-4 h-4 mr-2" />
                    Use Template
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={showAuditLog} onOpenChange={setShowAuditLog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log</DialogTitle>
            <DialogDescription>
              Transaction history for {selectedRule?.entity_name}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-2">
            {auditEvents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No audit events found</p>
            ) : (
              auditEvents.map((event, index) => (
                <div key={index} className="border rounded-lg p-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{event.transaction_type}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                    </span>
                  </div>
                  {event.metadata && (
                    <pre className="text-xs mt-2 bg-muted dark:bg-muted p-2 rounded overflow-x-auto">
                      {JSON.stringify(event.metadata, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
