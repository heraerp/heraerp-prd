// ================================================================================
// POSTING RULES VIEWER PAGE
// Smart Code: HERA.UI.FINANCE.POSTING_RULES_VIEWER.V1
// Finance DNA Rules management interface
// ================================================================================

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { BookOpen, Plus, AlertCircle, RefreshCw, Info } from 'lucide-react'
import { useOrganization } from '@/components/organization/OrganizationProvider'
import { useFinanceRulesApi } from '@/lib/api/financeRules'
import { PostingRule } from '@/lib/schemas/financeRules'
import { RuleFilterBar, CategoryFilter } from '@/components/finance/RuleFilterBar'
import { RuleCard } from '@/components/finance/RuleCard'
import { RuleEditorDialog } from '@/components/finance/RuleEditorDialog'
import { JsonView } from '@/components/common/JsonView'
import { useToast } from '@/components/ui/use-toast'

export default function PostingRulesViewerPage() {
  const { currentOrganization } = useOrganization()
  const { toast } = useToast()

  // State
  const [searchTerm, setSearchTerm] = React.useState('')
  const [categoryFilter, setCategoryFilter] = React.useState<CategoryFilter>('all')
  const [enabledOnly, setEnabledOnly] = React.useState(false)
  const [selectedRule, setSelectedRule] = React.useState<PostingRule | null>(null)
  const [editorOpen, setEditorOpen] = React.useState(false)
  const [jsonViewRule, setJsonViewRule] = React.useState<PostingRule | null>(null)
  const [createMode, setCreateMode] = React.useState(false)

  // API
  const rulesApi = useFinanceRulesApi(currentOrganization?.id || '')

  // Filter rules
  const filteredRules = React.useMemo(() => {
    return rulesApi.rules.filter(rule => {
      // Search filter
      const matchesSearch =
        searchTerm === '' ||
        rule.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rule.title.toLowerCase().includes(searchTerm.toLowerCase())

      // Category filter
      const matchesCategory = categoryFilter === 'all' || rule.category === categoryFilter

      // Enabled filter
      const matchesEnabled = !enabledOnly || rule.enabled

      return matchesSearch && matchesCategory && matchesEnabled
    })
  }, [rulesApi.rules, searchTerm, categoryFilter, enabledOnly])

  // Handlers
  const handleToggle = async (rule: PostingRule, enabled: boolean) => {
    try {
      await rulesApi.toggle.mutateAsync({ key: rule.key, enabled })
      toast({
        title: 'Rule Updated',
        description: `${rule.title} has been ${enabled ? 'enabled' : 'disabled'}`
      })
    } catch (error) {
      toast({
        title: 'Update Failed',
        description: error instanceof Error ? error.message : 'Failed to update rule',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = (rule: PostingRule) => {
    setSelectedRule(rule)
    setCreateMode(false)
    setEditorOpen(true)
  }

  const handleCreate = () => {
    const newRule: PostingRule = {
      key: 'FIN_DNA.RULES.NEW.V1',
      title: '',
      description: undefined,
      category: 'other',
      enabled: false,
      smart_code: 'HERA.',
      applies_to: [],
      conditions: {},
      mappings: [],
      last_run_at: undefined,
      version: 'v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    setSelectedRule(newRule)
    setCreateMode(true)
    setEditorOpen(true)
  }

  const handleSave = async (rule: PostingRule) => {
    try {
      await rulesApi.upsert.mutateAsync(rule)
      setEditorOpen(false)
      toast({
        title: createMode ? 'Rule Created' : 'Rule Saved',
        description: `${rule.title} has been saved successfully`
      })
    } catch (error) {
      toast({
        title: 'Save Failed',
        description: error instanceof Error ? error.message : 'Failed to save rule',
        variant: 'destructive'
      })
    }
  }

  const handleClone = async (rule: PostingRule) => {
    try {
      const newRule = await rulesApi.cloneToNewVersion.mutateAsync(rule.key)
      toast({
        title: 'Rule Cloned',
        description: `Created ${newRule.key} (disabled by default)`
      })
    } catch (error) {
      toast({
        title: 'Clone Failed',
        description: error instanceof Error ? error.message : 'Failed to clone rule',
        variant: 'destructive'
      })
    }
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertDescription>
            Please select an organization to view Finance DNA rules.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-violet-600" />
            Finance DNA Rules
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage posting rules that drive automatic journal entries
          </p>
        </div>
        <Button onClick={handleCreate} className="bg-violet-600 hover:bg-violet-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Rule
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <RuleFilterBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            enabledOnly={enabledOnly}
            onEnabledOnlyChange={setEnabledOnly}
            onRefresh={() => rulesApi.refetch()}
            isRefreshing={rulesApi.isLoading}
            totalRules={rulesApi.rules.length}
            filteredCount={filteredRules.length}
          />
        </CardContent>
      </Card>

      {/* Rules Grid */}
      {rulesApi.isLoading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-violet-600 mr-3" />
          <span className="text-gray-600 dark:text-gray-400">Loading rules...</span>
        </div>
      ) : rulesApi.error ? (
        <Alert className="border-red-200 bg-red-50 dark:bg-red-950/30">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            Failed to load rules: {rulesApi.error.message}
          </AlertDescription>
        </Alert>
      ) : filteredRules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 dark:text-gray-400">
              {rulesApi.rules.length === 0
                ? 'No posting rules defined yet.'
                : 'No rules match your filters.'}
            </p>
            {rulesApi.rules.length === 0 && (
              <Button variant="outline" className="mt-4" onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Rule
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRules.map(rule => (
            <RuleCard
              key={rule.key}
              rule={rule}
              onToggle={enabled => handleToggle(rule, enabled)}
              onEdit={() => handleEdit(rule)}
              onClone={() => handleClone(rule)}
              onViewJson={() => setJsonViewRule(rule)}
              isToggling={rulesApi.toggle.isPending}
            />
          ))}
        </div>
      )}

      {/* Policy-as-Data Info */}
      <Alert className="mt-6 border-blue-200 bg-blue-50 dark:bg-blue-950/30">
        <Info className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div className="font-medium text-blue-800 dark:text-blue-200">
              Policy-as-Data Architecture
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              All posting rules are stored in{' '}
              <code className="font-mono text-xs">core_dynamic_data</code> with keys like{' '}
              <code className="font-mono text-xs">FIN_DNA.RULES.*</code>. Rules are versioned (v1,
              v2, etc.) and changes only affect future transactions.
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Rule Editor Dialog */}
      <RuleEditorDialog
        rule={selectedRule}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        isSaving={rulesApi.upsert.isPending}
        mode={createMode ? 'create' : 'edit'}
      />

      {/* JSON View Dialog */}
      {jsonViewRule && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setJsonViewRule(null)}
        >
          <div
            className="max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <JsonView
              data={jsonViewRule}
              title={`${jsonViewRule.title} (${jsonViewRule.key})`}
              defaultExpanded={true}
              maxHeight={600}
            />
            <div className="mt-4 text-center">
              <Button variant="outline" onClick={() => setJsonViewRule(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
