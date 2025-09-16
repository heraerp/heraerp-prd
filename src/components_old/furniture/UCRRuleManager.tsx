'use client'

import React, { useState, useEffect }
from 'react'
import { Settings, Shield, Calculator, DollarSign, CheckCircle, Calendar, AlertTriangle, Code, Play, Plus, Edit
}
from 'lucide-react'
import { cn }
from '@/lib/utils'
import { universalApi }
from '@/lib/universal-api'
import { Card, CardContent, CardHeader, CardTitle }
from '@/components/ui/card'
import { Badge }
from '@/components/ui/badge'
import { Button }
from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger }
from '@/components/ui/tabs'
import { Alert, AlertDescription }
from '@/components/ui/alert'
import { Skeleton }
from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow
}
from '@/components/ui/table'


interface UCRRule {
  id: string
  name: string
  type: string
  smartCode: string
  status: string
  priority: number
  scope?: any
  condition?: any
  action?: any
  parameters?: any
}

interface UCRRuleManagerProps {
  organizationId: string
  className?: string
}

const ruleTypeConfig = { validation: { icon: Shield, color: 'text-[var(--color-text-primary)]', bgColor: 'bg-[var(--color-body)]/20' }, pricing: { icon: DollarSign, color: 'text-green-500', bgColor: 'bg-green-500/20' }, approval: { icon: CheckCircle, color: 'text-[var(--color-text-primary)]', bgColor: 'bg-[var(--color-body)]/20' }, sla: { icon: Calendar, color: 'text-[var(--color-text-primary)]', bgColor: 'bg-[var(--color-body)]/20' }, calculation: { icon: Calculator, color: 'text-[var(--color-text-primary)]', bgColor: 'bg-[var(--color-body)]/20' }, defaulting: { icon: Settings, color: 'text-[var(--color-text-secondary)]', bgColor: 'bg-gray-9000/20' }
}

export function UCRRuleManager({ organizationId, className }: UCRRuleManagerProps) {
  const [loading, setLoading] = useState(true)

const [rules, setRules] = useState<UCRRule[]>([])

const [selectedRule, setSelectedRule] = useState<UCRRule | null>(null)

const [executionResults, setExecutionResults] = useState<any[]>([])

useEffect(() => { loadRules(  ), [organizationId])

const loadRules = async () => { try { setLoading(true) // Get UCR rule entities const { data: entities } = await universalApi.read({ table: 'core_entities', organizationId })

const ucrRules = entities?.filter((e: any) => e.entity_type === 'ucr_rule') || [] // Get dynamic data for rules const { data: dynamicData } = await universalApi.read({ table: 'core_dynamic_data', organizationId }) // Build complete rule objects const rulesWithLogic = ucrRules.map((rule: any) => { const ruleData = dynamicData?.filter((d: any) => d.entity_id === rule.id) || [] const parseField = (fieldName: string) => { const field = ruleData.find((d: any) => d.field_name === fieldName) if (!field) return null if (field.field_value_json) {
  try { return JSON.parse(field.field_value_json  ) catch (e) {
  return field.field_value_json } } return field.field_value_number || field.field_value_text } return { id: rule.id, name: rule.entity_name, type: (rule.metadata as any)?.rule_type || 'unknown', smartCode: rule.smart_code, status: rule.status, priority: parseField('rule_priority') || 100, scope: parseField('rule_scope'), condition: parseField('rule_condition'), action: parseField('rule_action'), parameters: parseField('rule_parameters'  ) }) setRules(rulesWithLogic) if (rulesWithLogic.length > 0 && !selectedRule) {
  setSelectedRule(rulesWithLogic[0]  )   } catch (err) {
  console.error('Error loading UCR rules:', err)   } finally {
    setLoading(false)
  }
}

const getRuleIcon = (type: string) => { const config = ruleTypeConfig[type as keyof typeof ruleTypeConfig] || ruleTypeConfig.defaulting const Icon = config.icon return <Icon className={cn('h-5 w-5', config.color)} /> }

const getRuleBadge = (type: string) => { const config = ruleTypeConfig[type as keyof typeof ruleTypeConfig] || ruleTypeConfig.defaulting return ( <Badge className={cn('text-xs', config.bgColor, config.color, 'border-none')}>{type}</Badge>   )

const testRule = async (rule: UCRRule) => { // Simulate rule execution const testContext = { entity_type: 'product', smart_code: 'HERA.FURNITURE.PRODUCT.TEST.v1', length_cm: 150, width_cm: 80, height_cm: 90, standard_cost_rate: 1500, pricing_method: 'standard_markup', discount_percent: 20 }

const result = { ruleId: rule.id, ruleName: rule.name, timestamp: new Date().toISOString(), success: Math.random() > 0.3, // Simulate success/failure executionTime: Math.round(Math.random() * 100) + 20, context: testContext, result: rule.type === 'pricing' ? { calculated_price: 3750 } : rule.type === 'validation' ? { validated: true } : rule.type === 'approval' ? { approval_required: true, approver: 'sales_manager' } : { processed: true } } setExecutionResults(prev => [result, ...prev.slice(0, 4)]  ) if (loading) {
  return ( <div className={cn('space-y-6', className)}> <Skeleton className="h-20 w-full" /> <Skeleton className="h-96 w-full" /> </div>   ) return ( <div className={cn('space-y-6', className)}> {/* Header */} <div className="flex items-center justify-between"> <div> <h2 className="bg-[var(--color-body)] text-2xl font-bold text-[var(--color-text-primary)]">Universal Configuration Rules</h2> <p className="text-[var(--color-text-secondary)] mt-1">Business logic as data - zero code changes required</p> </div> <Button className="gap-2 bg-gradient-to-r from-amber-500 to-orange-600"> <Plus className="h-4 w-4" /> New Rule </Button> </div> {/* Stats */} <div className="bg-[var(--color-body)] grid grid-cols-1 md:grid-cols-4 gap-4"> <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)]"> <CardContent className="p-4"> <div className="flex items-center justify-between"> <div> <p className="text-sm text-[var(--color-text-secondary)]">Total Rules</p> <p className="text-2xl font-bold text-[var(--color-text-primary)]">{rules.length}</p> </div> <Settings className="h-8 w-8 text-[var(--color-text-primary)]" /> </div> </CardContent> </Card> <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)]"> <CardContent className="p-4"> <div className="flex items-center justify-between"> <div> <p className="text-sm text-[var(--color-text-secondary)]">Active</p> <p className="text-2xl font-bold text-[var(--color-text-primary)]"> {rules.filter(r => r.status === 'active').length} </p> </div> <Badge className="bg-green-500/20 text-green-400 border-green-500/50">Active</Badge> </div> </CardContent> </Card> <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)]"> <CardContent className="p-4"> <div className="flex items-center justify-between"> <div> <p className="text-sm text-[var(--color-text-secondary)]">Rule Types</p> <p className="text-2xl font-bold text-[var(--color-text-primary)]"> {new Set(rules.map(r => r.type)).size} </p> </div> <Code className="h-8 w-8 text-[var(--color-text-primary)]" /> </div> </CardContent> </Card> <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)]"> <CardContent className="p-4"> <div className="flex items-center justify-between"> <div> <p className="text-sm text-[var(--color-text-secondary)]">Executions Today</p> <p className="text-2xl font-bold text-[var(--color-text-primary)]">{executionResults.length}</p> </div> <Play className="h-8 w-8 text-[var(--color-text-primary)]" /> </div> </CardContent> </Card> </div> {/* Main Content */} <div className="grid grid-cols-1 lg:grid-cols-3 gap-6"> {/* Rule List */} <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)] lg:col-span-1"> <CardHeader> <CardTitle className="text-lg">Configured Rules</CardTitle> </CardHeader> <CardContent className="p-0"> <div className="space-y-1 p-4"> {rules.map(rule => ( <div key={rule.id} className={cn( 'p-3 rounded-lg cursor-pointer transition-all hover:bg-[var(--color-sidebar)]/30/50', selectedRule?.id === rule.id && 'bg-muted-foreground/10/50 ring-1 ring-amber-500' )} onClick={() => setSelectedRule(rule)} > <div className="flex items-center justify-between"> <div className="flex items-center gap-3"> {getRuleIcon(rule.type)} <div> <p className="font-medium text-[var(--color-text-primary)] text-sm">{rule.name}</p> <p className="text-xs text-[var(--color-text-secondary)]">Priority: {rule.priority}</p> </div> </div> {getRuleBadge(rule.type)} </div> </div> ))} </div> </CardContent> </Card> {/* Rule Details */} {selectedRule && ( <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] bg-[var(--color-body)]/50 border-[var(--color-border)] lg:col-span-2"> <CardHeader> <div className="bg-[var(--color-body)] flex items-center justify-between"> <CardTitle className="flex items-center gap-2"> {getRuleIcon(selectedRule.type)} {selectedRule.name} </CardTitle> <div className="flex items-center gap-2"> <Button variant="outline" size="sm"> <Pencil className="h-4 w-4 mr-1" /> Edit </Button> <Button variant="outline" size="sm" onClick={() => testRule(selectedRule)}> <Play className="h-4 w-4 mr-1" /> Test </Button> </div> </div> </CardHeader> <CardContent> <Tabs defaultValue="logic"> <TabsList className="grid w-full grid-cols-3 bg-muted-foreground/10"> <TabsTrigger value="logic">Rule Logic</TabsTrigger> <TabsTrigger value="parameters">Parameters</TabsTrigger> <TabsTrigger value="execution">Execution History</TabsTrigger> </TabsList> <TabsContent value="logic" className="bg-[var(--color-body)] space-y-4 mt-4"> {/* Scope */} <div> <h4 className="bg-[var(--color-body)] text-sm font-medium text-[var(--color-text-secondary)] mb-2">Scope</h4> <div className="bg-[var(--color-body)]/50 rounded-lg p-3"> <pre className="bg-[var(--color-body)] text-xs text-[var(--color-text-primary)] overflow-x-auto"> {JSON.stringify(selectedRule.scope, null, 2)} </pre> </div> </div> {/* Condition */} <div> <h4 className="bg-[var(--color-body)] text-sm font-medium text-[var(--color-text-secondary)] mb-2">Condition (WHEN)</h4> <div className="bg-[var(--color-body)]/50 rounded-lg p-3"> <pre className="bg-[var(--color-body)] text-xs text-[var(--color-text-primary)] overflow-x-auto"> {JSON.stringify(selectedRule.condition, null, 2)} </pre> </div> </div> {/* Action */} <div> <h4 className="bg-[var(--color-body)] text-sm font-medium text-[var(--color-text-secondary)] mb-2">Action (THEN)</h4> <div className="bg-[var(--color-body)]/50 rounded-lg p-3"> <pre className="bg-[var(--color-body)] text-xs text-[var(--color-text-primary)] overflow-x-auto"> {JSON.stringify(selectedRule.action, null, 2)} </pre> </div> </div> </TabsContent> <TabsContent value="parameters" className="bg-[var(--color-body)] mt-4"> <div className="bg-[var(--color-body)]/50 rounded-lg p-3"> <pre className="bg-[var(--color-body)] text-xs text-[var(--color-text-primary)] overflow-x-auto"> {JSON.stringify(selectedRule.parameters, null, 2)} </pre> </div> </TabsContent> <TabsContent value="execution" className="bg-[var(--color-body)] mt-4"> {executionResults.length === 0 ? ( <Alert className="bg-[var(--color-body)]/50 border-[var(--color-border)]"> <AlertTriangle className="h-4 w-4" /> <AlertDescription> No execution history available. Click"Test" to run this rule. </AlertDescription> </Alert> ) : ( <div className="space-y-3"> {executionResults .filter(r => r.ruleId === selectedRule.id) .map((result, idx) => ( <div key={idx} className={cn( 'p-3 rounded-lg border', result.success ? 'bg-green-500/10 border-green-500/50' : 'bg-red-500/10 border-red-500/50' )} > <div className="flex items-center justify-between mb-2"> <Badge variant={result.success ? 'default' : 'destructive'}> {result.success ? 'Success' : 'Failed'} </Badge> <span className="text-xs text-[var(--color-text-secondary)]"> {new Date(result.timestamp).toLocaleTimeString()}( {result.executionTime}ms) </span> </div> <pre className="bg-[var(--color-body)] text-xs text-[var(--color-text-primary)]"> {JSON.stringify(result.result, null, 2)} </pre> </div> ))} </div> )} </TabsContent> </Tabs> </CardContent> </Card> )} </div> </div> )
}
