/**
 * HERA DNA Schema Administration Interface
 * Admin interface for managing system schema and organization configuration
 * Smart Code: HERA.DNA.ADMIN.SCHEMA.INTERFACE.v1
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { AlertCircle, Check, Database, Settings, Code, FileText, Zap, Shield, TrendingUp, Award } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useSchemaAdministration } from '@/lib/schema/schema-hooks'
import { useAuth } from '@/components/auth/AuthProvider'

interface SchemaAdministrationProps {
  organizationId?: string
}

export default function SchemaAdministration({ organizationId }: SchemaAdministrationProps) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')

  const {
    // System schema data
    components,
    templates,
    entityTypes,
    fieldTypes,
    smartCodes,
    
    // Organization configuration
    orgConfig,
    fieldSelections,
    formConfigs,
    
    // Self-governing standards integration
    qualityMetrics,
    
    // Mutations
    updateOrgConfig,
    updateFieldSelection,
    updateFormConfig,
    
    // Utilities
    validation,
    warmUpCache,
    clearCache
  } = useSchemaAdministration(organizationId)

  const isSystemAdmin = user?.role === 'system_admin'
  const isOrgAdmin = user?.role === 'admin' || user?.role === 'owner'

  // Filter data based on search term
  const filteredComponents = components.data?.filter(comp => 
    comp.component_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comp.description?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const filteredTemplates = templates.data?.filter(template => 
    template.template_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.industry.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  const filteredEntityTypes = entityTypes.data?.filter(entity => 
    entity.entity_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entity.display_name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Schema Administration</h1>
          <p className="text-muted-foreground">
            Manage system schema definitions and organization configuration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => warmUpCache.mutate()}
            disabled={warmUpCache.isPending}
          >
            <Zap className="h-4 w-4 mr-2" />
            Warm Cache
          </Button>
          <Button
            variant="outline"
            onClick={() => clearCache.mutate()}
            disabled={clearCache.isPending}
          >
            <Database className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
        </div>
      </div>

      {/* Validation Status */}
      {validation.data && (
        <Alert variant={validation.data.valid ? "default" : "destructive"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validation.data.valid ? (
              "Organization configuration is valid"
            ) : (
              `Configuration issues found: ${validation.data.errors.join(", ")}`
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search components, templates, entity types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="entities">Entity Types</TabsTrigger>
          <TabsTrigger value="fields">Field Types</TabsTrigger>
          <TabsTrigger value="governance">Governance</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DNA Components</CardTitle>
                <Code className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{components.data?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {components.data?.filter(c => c.status === 'active').length || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">DNA Templates</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{templates.data?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {templates.data?.filter(t => t.status === 'active').length || 0} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Entity Types</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{entityTypes.data?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {entityTypes.data?.filter(e => e.category === 'universal').length || 0} universal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Smart Codes</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{smartCodes.data?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {smartCodes.data?.filter(s => s.status === 'active').length || 0} active
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Organization Configuration Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Organization Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-sm font-medium">Enabled Components</Label>
                  <p className="text-2xl font-bold">
                    {orgConfig.data?.enabled_components ? 
                      Object.keys(orgConfig.data.enabled_components).length : 0}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Enabled Entity Types</Label>
                  <p className="text-2xl font-bold">
                    {orgConfig.data?.enabled_entity_types?.length || 0}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Custom Field Selections</Label>
                  <p className="text-2xl font-bold">
                    {fieldSelections.data?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Components Tab */}
        <TabsContent value="components" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredComponents.map((component) => (
              <Card key={component.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{component.component_name}</CardTitle>
                    <Badge variant={component.status === 'active' ? 'default' : 'secondary'}>
                      {component.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <Badge variant="outline">{component.component_type}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Category:</span>
                      <span>{component.category}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Reusability:</span>
                      <span>{Math.round(component.reusability_score * 100)}%</span>
                    </div>
                    {component.description && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {component.description}
                      </p>
                    )}
                  </div>
                  
                  {isOrgAdmin && (
                    <div className="mt-4 flex items-center justify-between">
                      <Label htmlFor={`component-${component.id}`} className="text-sm">
                        Enabled
                      </Label>
                      <Switch
                        id={`component-${component.id}`}
                        checked={orgConfig.data?.enabled_components?.[component.component_name] || false}
                        onCheckedChange={(checked) => {
                          const newEnabledComponents = {
                            ...orgConfig.data?.enabled_components,
                            [component.component_name]: checked
                          }
                          updateOrgConfig.mutate({
                            organizationId: user?.organization_id!,
                            config: {
                              enabled_components: newEnabledComponents
                            }
                          })
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{template.template_name}</CardTitle>
                    <Badge variant={template.status === 'active' ? 'default' : 'secondary'}>
                      {template.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Industry:</span>
                      <Badge variant="outline">{template.industry}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Type:</span>
                      <span>{template.template_type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Components:</span>
                      <span>{template.required_components.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Smart Codes:</span>
                      <span>{template.smart_codes.length}</span>
                    </div>
                  </div>

                  {isOrgAdmin && (
                    <div className="mt-4 flex items-center justify-between">
                      <Label htmlFor={`template-${template.id}`} className="text-sm">
                        Active
                      </Label>
                      <Switch
                        id={`template-${template.id}`}
                        checked={orgConfig.data?.active_templates?.includes(template.template_name) || false}
                        onCheckedChange={(checked) => {
                          const currentTemplates = orgConfig.data?.active_templates || []
                          const newTemplates = checked
                            ? [...currentTemplates, template.template_name]
                            : currentTemplates.filter(t => t !== template.template_name)
                          
                          updateOrgConfig.mutate({
                            organizationId: user?.organization_id!,
                            config: {
                              active_templates: newTemplates
                            }
                          })
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Entity Types Tab */}
        <TabsContent value="entities" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredEntityTypes.map((entityType) => (
              <Card key={entityType.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{entityType.display_name}</CardTitle>
                    <Badge variant={entityType.category === 'universal' ? 'default' : 'secondary'}>
                      {entityType.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Entity Type:</span>
                      <code className="text-xs bg-muted px-1 rounded">{entityType.entity_type}</code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Base Fields:</span>
                      <span>{Object.keys(entityType.base_fields).length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Smart Codes:</span>
                      <span>{entityType.default_smart_codes.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Hierarchy:</span>
                      <span>{entityType.hierarchy_support ? 'Yes' : 'No'}</span>
                    </div>
                    {entityType.description && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {entityType.description}
                      </p>
                    )}
                  </div>

                  {isOrgAdmin && (
                    <div className="mt-4 flex items-center justify-between">
                      <Label htmlFor={`entity-${entityType.id}`} className="text-sm">
                        Enabled
                      </Label>
                      <Switch
                        id={`entity-${entityType.id}`}
                        checked={orgConfig.data?.enabled_entity_types?.includes(entityType.entity_type) || false}
                        onCheckedChange={(checked) => {
                          const currentTypes = orgConfig.data?.enabled_entity_types || []
                          const newTypes = checked
                            ? [...currentTypes, entityType.entity_type]
                            : currentTypes.filter(t => t !== entityType.entity_type)
                          
                          updateOrgConfig.mutate({
                            organizationId: user?.organization_id!,
                            config: {
                              enabled_entity_types: newTypes
                            }
                          })
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Field Types Tab */}
        <TabsContent value="fields" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {fieldTypes.data?.map((fieldType) => (
              <Card key={fieldType.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">{fieldType.display_name}</CardTitle>
                    <Badge variant="outline">{fieldType.category}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Field Type:</span>
                      <code className="text-xs bg-muted px-1 rounded">{fieldType.field_type}</code>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Data Type:</span>
                      <span>{fieldType.data_type}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Component:</span>
                      <span>{fieldType.input_component}</span>
                    </div>
                    {fieldType.description && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {fieldType.description}
                      </p>
                    )}
                  </div>

                  {isOrgAdmin && (
                    <div className="mt-4 flex items-center justify-between">
                      <Label htmlFor={`field-${fieldType.id}`} className="text-sm">
                        Enabled
                      </Label>
                      <Switch
                        id={`field-${fieldType.id}`}
                        checked={orgConfig.data?.enabled_field_types?.includes(fieldType.field_type) || false}
                        onCheckedChange={(checked) => {
                          const currentTypes = orgConfig.data?.enabled_field_types || []
                          const newTypes = checked
                            ? [...currentTypes, fieldType.field_type]
                            : currentTypes.filter(t => t !== fieldType.field_type)
                          
                          updateOrgConfig.mutate({
                            organizationId: user?.organization_id!,
                            config: {
                              enabled_field_types: newTypes
                            }
                          })
                        }}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Governance Tab - Self-Governing Standards */}
        <TabsContent value="governance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Data Quality Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Data Quality Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                {qualityMetrics.data ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Compliance Score</Label>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-green-600">
                            {Math.round(qualityMetrics.data.compliance_score * 100)}%
                          </div>
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Duplicate Records</Label>
                        <div className="text-2xl font-bold text-orange-600">
                          {qualityMetrics.data.duplicate_count}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Non-Standard Fields</Label>
                        <div className="text-2xl font-bold text-blue-600">
                          {qualityMetrics.data.non_standard_fields}
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium text-muted-foreground">Active Violations</Label>
                        <div className="text-2xl font-bold text-red-600">
                          {qualityMetrics.data.standards_violations.length}
                        </div>
                      </div>
                    </div>
                    
                    {qualityMetrics.data.compliance_score > 0.9 ? (
                      <Alert>
                        <Check className="h-4 w-4" />
                        <AlertDescription>
                          Excellent data quality! Your organization meets HERA standards.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Data quality needs improvement. Check violations below.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading quality metrics...
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Self-Governing Principle */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Self-Governing Architecture
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">🧬 HERA Meta Principle</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    HERA manages its own standards using the same 6 universal tables that power your business.
                  </p>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span>Standards stored as entities in core_entities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Field definitions in core_dynamic_data</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span>Validation rules via core_relationships</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span>Quality tracking in universal_transactions</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">0</div>
                    <div className="text-muted-foreground">New Tables</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-blue-600">6</div>
                    <div className="text-muted-foreground">Universal Tables</div>
                  </div>
                </div>

                <Alert>
                  <Zap className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    <strong>Revolutionary:</strong> If HERA can govern itself with 6 tables, it can govern any business.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Standards Violations (if any) */}
          {qualityMetrics.data?.standards_violations && qualityMetrics.data.standards_violations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-500" />
                  Standards Violations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {qualityMetrics.data.standards_violations.slice(0, 5).map((violation, index) => (
                    <div key={index} className="border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{violation.entity_name}</div>
                          <div className="text-sm text-muted-foreground">
                            Type: {violation.entity_type}
                          </div>
                        </div>
                        <Badge variant="destructive">Violation</Badge>
                      </div>
                    </div>
                  ))}
                  {qualityMetrics.data.standards_violations.length > 5 && (
                    <div className="text-center text-sm text-muted-foreground">
                      +{qualityMetrics.data.standards_violations.length - 5} more violations
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Universal Smart Codes Registry */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Smart Codes Registry
                <Badge variant="outline">Universal</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  Smart codes provide universal business intelligence across all industries.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {smartCodes.data?.slice(0, 6).map((code) => (
                    <div key={code.id} className="border rounded p-3">
                      <div className="font-mono text-xs text-blue-600 mb-1">
                        {code.smart_code}
                      </div>
                      <div className="text-sm font-medium">{code.description}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Industry: {code.industry}
                      </div>
                    </div>
                  ))}
                </div>
                {smartCodes.data && smartCodes.data.length > 6 && (
                  <div className="text-center">
                    <Button variant="outline" size="sm">
                      View All {smartCodes.data.length} Smart Codes
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="configuration" className="space-y-6">
          {isOrgAdmin ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Organization Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Configuration Version</Label>
                    <p className="text-sm text-muted-foreground">
                      Version {orgConfig.data?.configuration_version || 1}
                    </p>
                  </div>
                  
                  <div>
                    <Label>Last Updated</Label>
                    <p className="text-sm text-muted-foreground">
                      {orgConfig.data?.updated_at ? 
                        new Date(orgConfig.data.updated_at).toLocaleString() : 
                        'Never'
                      }
                    </p>
                  </div>

                  <div>
                    <Label>Configured By</Label>
                    <p className="text-sm text-muted-foreground">
                      {orgConfig.data?.configured_by || 'System'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Feature Flags */}
              <Card>
                <CardHeader>
                  <CardTitle>Feature Flags</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { key: 'advanced_analytics', label: 'Advanced Analytics' },
                    { key: 'api_access', label: 'API Access' },
                    { key: 'custom_fields', label: 'Custom Fields' },
                    { key: 'integrations', label: 'Integrations' },
                    { key: 'realtime_sync', label: 'Real-time Sync' },
                    { key: 'ai_insights', label: 'AI Insights' },
                  ].map((feature) => (
                    <div key={feature.key} className="flex items-center justify-between">
                      <Label htmlFor={feature.key}>{feature.label}</Label>
                      <Switch
                        id={feature.key}
                        checked={orgConfig.data?.feature_flags?.[feature.key] || false}
                        onCheckedChange={(checked) => {
                          const newFeatureFlags = {
                            ...orgConfig.data?.feature_flags,
                            [feature.key]: checked
                          }
                          updateOrgConfig.mutate({
                            organizationId: user?.organization_id!,
                            config: {
                              feature_flags: newFeatureFlags
                            }
                          })
                        }}
                      />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Access Restricted</h3>
                <p className="text-muted-foreground">
                  Only organization administrators can modify configuration settings.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}