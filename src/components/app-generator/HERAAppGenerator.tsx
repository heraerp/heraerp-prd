'use client';

/**
 * HERA App Generator Component
 * Smart Code: HERA.COMPONENT.APP.GENERATOR.v1
 * 
 * Complete app generator that takes YAML configuration and generates
 * full HERA applications using universal templates
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  Download, 
  Play, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Code, 
  Settings, 
  Database,
  Workflow,
  Layout
} from 'lucide-react';
import { 
  generateAppFromYAML, 
  HERAAppConfigParser,
  type HERAAppConfig 
} from '@/lib/app-generator/yaml-parser';

interface GenerationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  duration?: number;
  details?: string;
}

interface AppGeneratorProps {
  onAppGenerated?: (appStructure: any) => void;
  defaultYaml?: string;
}

export default function HERAAppGenerator({ 
  onAppGenerated, 
  defaultYaml = '' 
}: AppGeneratorProps) {
  const [yamlContent, setYamlContent] = useState(defaultYaml);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationSteps, setGenerationSteps] = useState<GenerationStep[]>([]);
  const [generatedApp, setGeneratedApp] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);

  const initialSteps: GenerationStep[] = [
    {
      id: 'validate',
      title: 'Validate Configuration',
      description: 'Parse and validate YAML configuration',
      status: 'pending'
    },
    {
      id: 'entities',
      title: 'Generate Entities',
      description: 'Create entity definitions and configurations',
      status: 'pending'
    },
    {
      id: 'transactions',
      title: 'Generate Transactions',
      description: 'Create transaction types and workflows',
      status: 'pending'
    },
    {
      id: 'workflows',
      title: 'Generate Workflows',
      description: 'Create workflow definitions and steps',
      status: 'pending'
    },
    {
      id: 'ui',
      title: 'Generate UI Components',
      description: 'Create pages, forms, and navigation',
      status: 'pending'
    },
    {
      id: 'api',
      title: 'Generate API Structure',
      description: 'Create API endpoints and configurations',
      status: 'pending'
    },
    {
      id: 'finalize',
      title: 'Finalize Application',
      description: 'Package and prepare for deployment',
      status: 'pending'
    }
  ];

  const updateStepStatus = useCallback((stepId: string, status: GenerationStep['status'], details?: string) => {
    setGenerationSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, status, details, duration: status === 'completed' ? Date.now() : undefined }
        : step
    ));
  }, []);

  const simulateStepDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const handleGenerate = async () => {
    if (!yamlContent.trim()) {
      setValidationErrors(['YAML configuration is required']);
      return;
    }

    setIsGenerating(true);
    setGenerationSteps([...initialSteps]);
    setValidationErrors([]);
    setCurrentProgress(0);

    try {
      // Step 1: Validate Configuration
      updateStepStatus('validate', 'running');
      await simulateStepDelay(1000);

      const result = await generateAppFromYAML(yamlContent);
      
      if (!result.isValid) {
        updateStepStatus('validate', 'error', result.errors.join(', '));
        setValidationErrors(result.errors);
        return;
      }

      updateStepStatus('validate', 'completed', 'Configuration validated successfully');
      setCurrentProgress(14);

      // Step 2: Generate Entities
      updateStepStatus('entities', 'running');
      await simulateStepDelay(1500);
      
      const entityConfigs = result.appStructure?.entityConfigs || {};
      updateStepStatus('entities', 'completed', `Generated ${Object.keys(entityConfigs).length} entity configurations`);
      setCurrentProgress(28);

      // Step 3: Generate Transactions
      updateStepStatus('transactions', 'running');
      await simulateStepDelay(1200);
      
      const transactionConfigs = result.appStructure?.transactionConfigs || {};
      updateStepStatus('transactions', 'completed', `Generated ${Object.keys(transactionConfigs).length} transaction types`);
      setCurrentProgress(42);

      // Step 4: Generate Workflows
      updateStepStatus('workflows', 'running');
      await simulateStepDelay(1000);
      
      const workflows = result.appStructure?.config.workflows || [];
      updateStepStatus('workflows', 'completed', `Generated ${workflows.length} workflow definitions`);
      setCurrentProgress(57);

      // Step 5: Generate UI Components
      updateStepStatus('ui', 'running');
      await simulateStepDelay(2000);
      
      const pages = result.appStructure?.pages || {};
      const navigation = result.appStructure?.navigation || [];
      updateStepStatus('ui', 'completed', `Generated ${Object.keys(pages).length} pages and navigation structure`);
      setCurrentProgress(71);

      // Step 6: Generate API Structure
      updateStepStatus('api', 'running');
      await simulateStepDelay(800);
      
      updateStepStatus('api', 'completed', 'API endpoints and configurations created');
      setCurrentProgress(85);

      // Step 7: Finalize Application
      updateStepStatus('finalize', 'running');
      await simulateStepDelay(1000);
      
      setGeneratedApp(result.appStructure);
      updateStepStatus('finalize', 'completed', 'Application generated successfully');
      setCurrentProgress(100);

      if (onAppGenerated && result.appStructure) {
        onAppGenerated(result.appStructure);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setValidationErrors([errorMessage]);
      
      // Update current step as error
      const currentStep = generationSteps.find(step => step.status === 'running');
      if (currentStep) {
        updateStepStatus(currentStep.id, 'error', errorMessage);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadExample = () => {
    // Load the CRM example from our schema
    const exampleYaml = `
app:
  name: "Customer Relationship Management"
  code: "CRM"
  version: "1.0.0"
  description: "Complete CRM system"
  smart_code: "HERA.CRM.APP.SYSTEM.v1"
  organization:
    id: "org_demo"
    name: "Demo Company"
  module:
    code: "CRM"
    icon: "users"
    color: "#3B82F6"
    category: "business"

entities:
  - entity_type: "CUSTOMER"
    entity_name: "Customer"
    description: "Customer master data"
    smart_code: "HERA.CRM.CUSTOMER.ENTITY.v1"
    icon: "user"
    dynamic_fields:
      - name: "customer_type"
        type: "text"
        required: true
        smart_code: "HERA.CRM.CUSTOMER.FIELD.TYPE.v1"
        options: ["individual", "corporate"]
        default: "individual"
      - name: "credit_limit"
        type: "number"
        required: false
        smart_code: "HERA.CRM.CUSTOMER.FIELD.CREDIT.v1"
        default: 10000
    relationships:
      - type: "HAS_SALES_REP"
        target_entity: "EMPLOYEE"
        cardinality: "one"
        smart_code: "HERA.CRM.CUSTOMER.REL.SALES_REP.v1"

transactions:
  - transaction_type: "SALE"
    transaction_name: "Sales Transaction"
    description: "Record customer sales"
    smart_code: "HERA.CRM.TXN.SALE.v1"
    category: "revenue"
    line_types:
      - name: "receivable"
        description: "Accounts receivable"
        required: true
        smart_code: "HERA.CRM.TXN.LINE.AR.v1"
        side: "DR"
      - name: "revenue"
        description: "Revenue recognition"
        required: true
        smart_code: "HERA.CRM.TXN.LINE.REVENUE.v1"
        side: "CR"

workflows:
  - workflow_name: "Customer Onboarding"
    workflow_code: "ONBOARDING"
    description: "New customer setup process"
    smart_code: "HERA.CRM.WORKFLOW.ONBOARDING.v1"
    trigger_entity: "CUSTOMER"
    steps:
      - step_name: "KYC Verification"
        step_code: "KYC"
        description: "Verify customer identity"
        actor_role: "compliance_officer"
      - step_name: "Credit Check"
        step_code: "CREDIT"
        description: "Check customer creditworthiness"
        actor_role: "finance_manager"

ui:
  dashboard:
    title: "CRM Dashboard"
    layout: "grid"
    refresh_interval: 300
    widgets:
      - type: "metric"
        title: "Total Customers"
        entity: "CUSTOMER"
        calculation: "count"
        color: "blue"
  navigation:
    - section: "Customers"
      items:
        - label: "All Customers"
          entity: "CUSTOMER"
          view: "list"
          icon: "users"
        - label: "Add Customer"
          entity: "CUSTOMER"
          view: "create"
          icon: "user-plus"
  list_views:
    CUSTOMER:
      columns:
        - field: "entity_code"
          title: "Customer ID"
          sortable: true
        - field: "entity_name"
          title: "Customer Name"
          sortable: true
          searchable: true
      filters:
        - field: "dynamic_fields.customer_type"
          type: "select"
          options: ["individual", "corporate"]

deployment:
  database:
    required_tables: ["core_entities", "core_dynamic_data", "universal_transactions"]
  api:
    base_path: "/api/crm"
    version: "v1"
    authentication: "hera_auth"
  permissions:
    roles:
      - role: "crm_admin"
        permissions: ["create", "read", "update", "delete"]
        entities: ["*"]
      - role: "sales_rep"
        permissions: ["create", "read", "update"]
        entities: ["CUSTOMER"]
`;

    setYamlContent(exampleYaml.trim());
  };

  const handleDownloadConfig = () => {
    if (!generatedApp) return;
    
    const configBlob = new Blob([JSON.stringify(generatedApp, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(configBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generatedApp.config.app.code.toLowerCase()}-app-config.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStepIcon = (status: GenerationStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'running':
        return <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-bold text-gray-900 flex items-center justify-center gap-3">
          <Sparkles className="h-8 w-8 text-purple-600" />
          HERA App Generator
        </h1>
        <p className="text-lg text-gray-600">
          Generate complete HERA applications from YAML configuration using universal templates
        </p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Configuration Input */}
        <div className="col-span-7">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Code className="h-5 w-5" />
                  YAML Configuration
                </CardTitle>
                <div className="flex gap-2">
                  <Button onClick={handleLoadExample} variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Load Example
                  </Button>
                  {generatedApp && (
                    <Button onClick={handleDownloadConfig} variant="outline" size="sm">
                      <Download className="h-4 w-4 mr-2" />
                      Download Config
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                value={yamlContent}
                onChange={(e) => setYamlContent(e.target.value)}
                placeholder="Paste your HERA app YAML configuration here..."
                className="min-h-[500px] font-mono text-sm"
              />
              
              {validationErrors.length > 0 && (
                <Alert className="mt-4" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      {validationErrors.map((error, index) => (
                        <div key={index}>{error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-4 flex justify-between items-center">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !yamlContent.trim()}
                  size="lg"
                  className="flex items-center gap-2"
                >
                  <Play className="h-5 w-5" />
                  {isGenerating ? 'Generating...' : 'Generate App'}
                </Button>
                
                {isGenerating && (
                  <div className="flex items-center gap-3">
                    <Progress value={currentProgress} className="w-32" />
                    <span className="text-sm text-gray-600">{currentProgress}%</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Generation Progress */}
        <div className="col-span-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Generation Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generationSteps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border transition-all ${
                      step.status === 'running'
                        ? 'border-blue-500 bg-blue-50'
                        : step.status === 'completed'
                        ? 'border-green-500 bg-green-50'
                        : step.status === 'error'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {getStepIcon(step.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm">{step.title}</h4>
                          <Badge variant="outline" className="text-xs">
                            {index + 1}/{generationSteps.length}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">{step.description}</p>
                        {step.details && (
                          <p className="text-xs text-gray-700 mt-2 font-medium">{step.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generated App Preview */}
      {generatedApp && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layout className="h-5 w-5" />
              Generated Application Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="summary" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="entities">Entities</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="workflows">Workflows</TabsTrigger>
                <TabsTrigger value="ui">UI Structure</TabsTrigger>
              </TabsList>
              
              <TabsContent value="summary" className="mt-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {generatedApp.summary}
                  </pre>
                </div>
              </TabsContent>
              
              <TabsContent value="entities" className="mt-4">
                <div className="space-y-4">
                  {Object.entries(generatedApp.entityConfigs).map(([entityType, config]: [string, any]) => (
                    <Card key={entityType}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{entityType}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <strong>Dynamic Fields:</strong>
                            <ul className="list-disc list-inside mt-1 text-gray-600">
                              {config.dynamicFields?.map((field: any, idx: number) => (
                                <li key={idx}>{field.name} ({field.type})</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <strong>Relationships:</strong>
                            <ul className="list-disc list-inside mt-1 text-gray-600">
                              {config.relationships?.map((rel: any, idx: number) => (
                                <li key={idx}>{rel.type} ({rel.cardinality})</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="transactions" className="mt-4">
                <div className="space-y-4">
                  {generatedApp.config.transactions.map((txn: any, index: number) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{txn.transaction_name}</CardTitle>
                        <p className="text-sm text-gray-600">{txn.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Badge>{txn.transaction_type}</Badge>
                            <Badge variant="outline">{txn.category}</Badge>
                          </div>
                          <div>
                            <strong className="text-sm">Line Types:</strong>
                            <ul className="list-disc list-inside mt-1 text-sm text-gray-600">
                              {txn.line_types.map((line: any, idx: number) => (
                                <li key={idx}>{line.name} - {line.description}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="workflows" className="mt-4">
                <div className="space-y-4">
                  {generatedApp.config.workflows.map((workflow: any, index: number) => (
                    <Card key={index}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{workflow.workflow_name}</CardTitle>
                        <p className="text-sm text-gray-600">{workflow.description}</p>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge>{workflow.workflow_code}</Badge>
                            <Badge variant="outline">Trigger: {workflow.trigger_entity}</Badge>
                          </div>
                          <div>
                            <strong className="text-sm">Workflow Steps:</strong>
                            <div className="mt-2 space-y-2">
                              {workflow.steps.map((step: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 text-sm">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                                    {idx + 1}
                                  </div>
                                  <div>
                                    <span className="font-medium">{step.step_name}</span>
                                    <span className="text-gray-600 ml-2">({step.actor_role})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="ui" className="mt-4">
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Dashboard Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <div><strong>Title:</strong> {generatedApp.config.ui.dashboard.title}</div>
                        <div><strong>Layout:</strong> {generatedApp.config.ui.dashboard.layout}</div>
                        <div><strong>Widgets:</strong> {generatedApp.config.ui.dashboard.widgets.length}</div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Navigation Structure</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {generatedApp.navigation.map((section: any, index: number) => (
                          <div key={index}>
                            <h4 className="font-medium text-sm">{section.section}</h4>
                            <ul className="list-disc list-inside mt-1 text-sm text-gray-600 ml-2">
                              {section.items.map((item: any, idx: number) => (
                                <li key={idx}>{item.label} ({item.view})</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}