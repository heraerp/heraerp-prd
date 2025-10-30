'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  FileText, 
  Activity, 
  Network,
  Plus,
  Settings,
  BarChart3,
  Sparkles
} from 'lucide-react';

// Import our universal components
import UniversalMasterDataWizard from '@/components/universal/master-data/UniversalMasterDataWizard';
import UniversalTransactionWizard from '@/components/universal/transactions/UniversalTransactionWizard';
import UniversalWorkflowEngine from '@/components/universal/workflow/UniversalWorkflowEngine';
import UniversalRelationshipManager from '@/components/universal/relationships/UniversalRelationshipManager';
import ModuleDashboard from '@/templates/universal-module-kit/pages/ModuleDashboard';

// Import the CRM module configuration
import { CRM_MODULE_CONFIG } from '@/templates/universal-module-kit/module-config';

type ViewMode = 'dashboard' | 'entities' | 'transactions' | 'workflows' | 'relationships' | 'create-entity' | 'create-transaction';

export default function CRMExampleModule() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('CUSTOMER');

  const navigateToView = (view: ViewMode, entityType?: string) => {
    setCurrentView(view);
    if (entityType) {
      setSelectedEntityType(entityType);
    }
  };

  const handleEntityComplete = (entityData: any) => {
    console.log('Entity created:', entityData);
    setCurrentView('entities');
  };

  const handleTransactionComplete = (transactionData: any) => {
    console.log('Transaction posted:', transactionData);
    setCurrentView('transactions');
  };

  const handleWorkflowComplete = (workflowData: any) => {
    console.log('Workflow completed:', workflowData);
    setCurrentView('workflows');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <ModuleDashboard 
            moduleConfig={CRM_MODULE_CONFIG}
            onNavigate={(path) => {
              if (path.includes('entities/create')) {
                const entityType = new URLSearchParams(path.split('?')[1] || '').get('type');
                setSelectedEntityType(entityType || 'CUSTOMER');
                setCurrentView('create-entity');
              } else if (path.includes('transactions/create')) {
                setCurrentView('create-transaction');
              } else if (path.includes('workflows')) {
                setCurrentView('workflows');
              } else if (path.includes('entities')) {
                setCurrentView('entities');
              } else if (path.includes('relationships')) {
                setCurrentView('relationships');
              }
            }}
          />
        );

      case 'create-entity':
        return (
          <UniversalMasterDataWizard
            entityType={selectedEntityType}
            moduleCode="CRM"
            onComplete={handleEntityComplete}
            onCancel={() => setCurrentView('entities')}
          />
        );

      case 'create-transaction':
        return (
          <UniversalTransactionWizard
            moduleCode="CRM"
            onComplete={handleTransactionComplete}
            onCancel={() => setCurrentView('transactions')}
          />
        );

      case 'workflows':
        return (
          <UniversalWorkflowEngine
            onWorkflowComplete={handleWorkflowComplete}
            onWorkflowCancel={() => setCurrentView('dashboard')}
          />
        );

      case 'relationships':
        return (
          <UniversalRelationshipManager
            moduleCode="CRM"
            onRelationshipChange={(relationships) => {
              console.log('Relationships updated:', relationships);
            }}
          />
        );

      case 'entities':
        return <EntityListView moduleConfig={CRM_MODULE_CONFIG} onNavigate={navigateToView} />;

      case 'transactions':
        return <TransactionListView moduleConfig={CRM_MODULE_CONFIG} onNavigate={navigateToView} />;

      default:
        return <div>View not implemented</div>;
    }
  };

  // Don't render navigation for full-screen wizards
  if (['create-entity', 'create-transaction', 'workflows', 'relationships'].includes(currentView)) {
    return renderCurrentView();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">CRM Example</h1>
                  <p className="text-sm text-gray-600">HERA v2 Module Standard Demo</p>
                </div>
              </div>
              
              <Badge variant="outline" className="text-xs">
                <Sparkles className="h-3 w-3 mr-1" />
                HERA v2 Standard
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => navigateToView('create-entity', 'CUSTOMER')}
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Customer
              </Button>
              <Button
                onClick={() => navigateToView('create-transaction')}
                size="sm"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                New Transaction
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 px-6">
        <div className="max-w-7xl mx-auto">
          <Tabs value={currentView} onValueChange={(value) => navigateToView(value as ViewMode)}>
            <TabsList className="grid grid-cols-5 w-full max-w-2xl">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="entities" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Entities
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Transactions
              </TabsTrigger>
              <TabsTrigger value="workflows" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Workflows
              </TabsTrigger>
              <TabsTrigger value="relationships" className="flex items-center gap-2">
                <Network className="h-4 w-4" />
                Relationships
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          {renderCurrentView()}
        </div>
      </div>
    </div>
  );
}

// Entity List View Component
const EntityListView = ({ moduleConfig, onNavigate }: any) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900">Entity Management</h2>
      <Button onClick={() => onNavigate('create-entity')}>
        <Plus className="h-4 w-4 mr-2" />
        Create Entity
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {moduleConfig.entities.map((entity: any) => (
        <Card key={entity.entity_type} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {entity.display_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{entity.description}</p>
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-gray-500">Attributes:</span> {entity.attributes.length}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Relationships:</span> {entity.relationships.length}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Workflows:</span> {entity.workflows.length}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => onNavigate('create-entity', entity.entity_type)}
                size="sm"
                className="flex-1"
              >
                Create New
              </Button>
              <Button size="sm" variant="outline">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Transaction List View Component
const TransactionListView = ({ moduleConfig, onNavigate }: any) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h2 className="text-2xl font-bold text-gray-900">Transaction Management</h2>
      <Button onClick={() => onNavigate('create-transaction')}>
        <Plus className="h-4 w-4 mr-2" />
        Create Transaction
      </Button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {moduleConfig.transactions.map((transaction: any) => (
        <Card key={transaction.transaction_type} className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {transaction.display_name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{transaction.description}</p>
            <div className="space-y-2 mb-4">
              <div className="text-sm">
                <span className="text-gray-500">Smart Code:</span>
                <code className="ml-2 text-xs bg-gray-100 px-2 py-1 rounded">
                  {transaction.smart_code}
                </code>
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Posting Rules:</span> {transaction.posting_rules.length}
              </div>
              <div className="text-sm">
                <span className="text-gray-500">Workflows:</span> {transaction.workflows.length}
              </div>
            </div>
            <Button
              onClick={() => onNavigate('create-transaction')}
              size="sm"
              className="w-full"
            >
              Create Transaction
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);