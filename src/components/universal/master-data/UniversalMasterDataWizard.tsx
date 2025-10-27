'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Info, ArrowLeft, ArrowRight, Sparkles, Upload, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUniversalEntityV1 } from '@/hooks/useUniversalEntityV1';

interface MasterDataWizardProps {
  entityType: string;
  moduleCode: string;
  onComplete: (entityData: any) => void;
  onCancel: () => void;
  initialData?: any;
}

interface WizardStep {
  id: string;
  title: string;
  description: string;
  isCompleted: boolean;
  isActive: boolean;
  validationErrors: string[];
}

interface EntityData {
  // Step 1: Basics
  entity_code: string;
  entity_name: string;
  entity_type: string;
  smart_code: string;
  description?: string;
  
  // Step 2: Relationships
  relationships: Array<{
    target_entity_id: string;
    relationship_type: string;
    relationship_data: Record<string, any>;
    effective_date: string;
    expiration_date?: string;
  }>;
  
  // Step 3: Attributes
  dynamic_attributes: Record<string, any>;
  
  // Step 4: Review
  workflow_assignments: string[];
  notifications: string[];
}

export default function UniversalMasterDataWizard({ 
  entityType, 
  moduleCode, 
  onComplete, 
  onCancel, 
  initialData 
}: MasterDataWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [entityData, setEntityData] = useState<EntityData>({
    entity_code: '',
    entity_name: '',
    entity_type: entityType,
    smart_code: '',
    relationships: [],
    dynamic_attributes: {},
    workflow_assignments: [],
    notifications: []
  });

  // Initialize v1 hook for tested entity creation
  const entityHook = useUniversalEntityV1({
    entity_type: entityType,
    dynamicFields: Object.keys(entityData.dynamic_attributes).map(key => ({
      name: key,
      type: 'text' as const,
      smart_code: `HERA.${moduleCode.toUpperCase()}.${entityType}.FIELD.${key.toUpperCase()}.v1`
    })),
    relationships: entityData.relationships.map(rel => ({
      type: rel.relationship_type,
      smart_code: `HERA.${moduleCode.toUpperCase()}.${entityType}.REL.${rel.relationship_type}.v1`
    }))
  });

  const [steps, setSteps] = useState<WizardStep[]>([
    {
      id: 'basics',
      title: 'Basic Information',
      description: 'Core entity details with smart validation',
      isCompleted: false,
      isActive: true,
      validationErrors: []
    },
    {
      id: 'relationships',
      title: 'Relationships',
      description: 'Configure entity relationships and hierarchies',
      isCompleted: false,
      isActive: false,
      validationErrors: []
    },
    {
      id: 'attributes',
      title: 'Configuration',
      description: 'Industry-specific settings with AI recommendations',
      isCompleted: false,
      isActive: false,
      validationErrors: []
    },
    {
      id: 'review',
      title: 'Review & Activate',
      description: 'Final review with bulk import/export options',
      isCompleted: false,
      isActive: false,
      validationErrors: []
    }
  ]);

  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingSmartCode, setIsGeneratingSmartCode] = useState(false);

  // Generate smart code automatically
  useEffect(() => {
    if (entityData.entity_code && entityData.entity_type) {
      const smartCode = generateSmartCode(moduleCode, entityData.entity_type, entityData.entity_code);
      setEntityData(prev => ({ ...prev, smart_code: smartCode }));
    }
  }, [entityData.entity_code, entityData.entity_type, moduleCode]);

  const generateSmartCode = (module: string, type: string, code: string): string => {
    const timestamp = Date.now().toString().slice(-4);
    return `HERA.${module.toUpperCase()}.${type.toUpperCase()}.${code.toUpperCase().replace(/[^A-Z0-9]/g, '_')}.v1`;
  };

  const validateStep = (stepIndex: number): string[] => {
    const errors: string[] = [];
    
    switch (stepIndex) {
      case 0: // Basics
        if (!entityData.entity_code) errors.push('Entity code is required');
        if (!entityData.entity_name) errors.push('Entity name is required');
        if (!entityData.smart_code) errors.push('Smart code is required');
        if (entityData.smart_code && !validateSmartCodePattern(entityData.smart_code)) {
          errors.push('Smart code must follow HERA pattern: ^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$');
        }
        break;
      case 1: // Relationships
        // Validate relationships if any exist
        entityData.relationships.forEach((rel, index) => {
          if (!rel.target_entity_id) errors.push(`Relationship ${index + 1}: Target entity is required`);
          if (!rel.relationship_type) errors.push(`Relationship ${index + 1}: Relationship type is required`);
        });
        break;
      case 2: // Attributes
        // Custom validation based on entity type
        if (entityType === 'CUSTOMER' && !entityData.dynamic_attributes.customer_type) {
          errors.push('Customer type is required');
        }
        break;
      case 3: // Review
        // Final validation
        break;
    }
    
    return errors;
  };

  const validateSmartCodePattern = (smartCode: string): boolean => {
    const pattern = /^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$/;
    return pattern.test(smartCode);
  };

  const handleNext = async () => {
    const errors = validateStep(currentStep);
    
    // Update step validation
    setSteps(prev => prev.map((step, index) => 
      index === currentStep 
        ? { ...step, validationErrors: errors, isCompleted: errors.length === 0 }
        : step
    ));

    if (errors.length === 0) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        setSteps(prev => prev.map((step, index) => ({
          ...step,
          isActive: index === currentStep + 1
        })));
      } else {
        // Final step - complete the wizard
        await handleComplete();
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSteps(prev => prev.map((step, index) => ({
        ...step,
        isActive: index === currentStep - 1
      })));
    }
  };

  const handleComplete = async () => {
    try {
      // Use tested v1 hook for entity creation
      const entityPayload = {
        entity_type: entityData.entity_type,
        entity_name: entityData.entity_name,
        entity_code: entityData.entity_code,
        smart_code: entityData.smart_code,
        metadata: entityData.description ? { description: entityData.description } : undefined,
        dynamic_fields: Object.entries(entityData.dynamic_attributes).reduce((acc, [key, value]) => {
          acc[key] = {
            value: value,
            type: 'text' as const,
            smart_code: `HERA.${moduleCode.toUpperCase()}.${entityType}.FIELD.${key.toUpperCase()}.v1`
          };
          return acc;
        }, {} as Record<string, any>),
        relationships: entityData.relationships.reduce((acc, rel) => {
          if (!acc[rel.relationship_type]) {
            acc[rel.relationship_type] = [];
          }
          acc[rel.relationship_type].push(rel.target_entity_id);
          return acc;
        }, {} as Record<string, string[]>)
      };

      const result = await entityHook.create(entityPayload);
      onComplete(result);
    } catch (error) {
      console.error('Error creating entity:', error);
      // Handle error appropriately
    }
  };

  const generateAISuggestions = async () => {
    setIsGeneratingSmartCode(true);
    try {
      // Simulate AI suggestions - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const suggestions = [
        `Consider adding a "priority_level" attribute for ${entityType}`,
        `Recommended relationship: ${entityType} → OWNER (Person)`,
        `Suggested workflow: ${entityType} creation approval process`
      ];
      
      setAiSuggestions(suggestions);
    } finally {
      setIsGeneratingSmartCode(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicsStep entityData={entityData} setEntityData={setEntityData} />;
      case 1:
        return <RelationshipsStep entityData={entityData} setEntityData={setEntityData} />;
      case 2:
        return <AttributesStep entityData={entityData} setEntityData={setEntityData} entityType={entityType} />;
      case 3:
        return <ReviewStep entityData={entityData} />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New {entityType.replace('_', ' ')}
          </h1>
          <p className="text-gray-600">
            Follow the 4-step process to create a new {entityType.toLowerCase()} with AI assistance
          </p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Progress */}
          <div className="col-span-3">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Progress</CardTitle>
                <Progress value={progress} className="w-full" />
                <p className="text-sm text-gray-600">Step {currentStep + 1} of {steps.length}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      step.isActive
                        ? 'border-blue-500 bg-blue-50'
                        : step.isCompleted
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {step.isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : step.isActive ? (
                        <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                      )}
                      <h3 className="font-medium text-sm">{step.title}</h3>
                    </div>
                    <p className="text-xs text-gray-600 ml-7">{step.description}</p>
                    {step.validationErrors.length > 0 && (
                      <div className="ml-7 mt-2">
                        {step.validationErrors.map((error, i) => (
                          <p key={i} className="text-xs text-red-600 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-lg">AI Assistant</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={generateAISuggestions}
                  disabled={isGeneratingSmartCode}
                  variant="outline"
                  size="sm"
                  className="w-full mb-3"
                >
                  {isGeneratingSmartCode ? 'Generating...' : 'Get AI Suggestions'}
                </Button>
                {aiSuggestions.length > 0 && (
                  <div className="space-y-2">
                    {aiSuggestions.map((suggestion, index) => (
                      <Alert key={index} className="p-2">
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-xs">{suggestion}</AlertDescription>
                      </Alert>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="col-span-9">
            <Card className="min-h-[600px]">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
                    <p className="text-gray-600">{steps[currentStep].description}</p>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {entityData.smart_code || 'Smart code will be generated'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="min-h-[400px]">
                {renderStepContent()}
              </CardContent>
              <div className="p-6 border-t flex justify-between">
                <Button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </Button>
                <div className="flex gap-2">
                  <Button onClick={onCancel} variant="outline">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleNext}
                    className="flex items-center gap-2"
                  >
                    {currentStep === steps.length - 1 ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Create & Activate
                      </>
                    ) : (
                      <>
                        Next
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
const BasicsStep = ({ entityData, setEntityData }: any) => (
  <div className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="entity_code">Entity Code *</Label>
        <Input
          id="entity_code"
          value={entityData.entity_code}
          onChange={(e) => setEntityData((prev: any) => ({ ...prev, entity_code: e.target.value }))}
          placeholder="e.g., CUST001"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="entity_name">Entity Name *</Label>
        <Input
          id="entity_name"
          value={entityData.entity_name}
          onChange={(e) => setEntityData((prev: any) => ({ ...prev, entity_name: e.target.value }))}
          placeholder="e.g., Customer Name"
          className="mt-1"
        />
      </div>
    </div>
    
    <div>
      <Label htmlFor="smart_code">Smart Code *</Label>
      <Input
        id="smart_code"
        value={entityData.smart_code}
        onChange={(e) => setEntityData((prev: any) => ({ ...prev, smart_code: e.target.value }))}
        placeholder="Auto-generated following HERA pattern"
        className="mt-1 font-mono text-sm"
        readOnly
      />
      <p className="text-xs text-gray-500 mt-1">
        Automatically generated following HERA v2 standards
      </p>
    </div>
    
    <div>
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={entityData.description || ''}
        onChange={(e) => setEntityData((prev: any) => ({ ...prev, description: e.target.value }))}
        placeholder="Optional description for this entity"
        className="mt-1"
      />
    </div>
  </div>
);

const RelationshipsStep = ({ entityData, setEntityData }: any) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">Entity Relationships</h3>
      <Button variant="outline" size="sm">
        Add Relationship
      </Button>
    </div>
    
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
      <p className="text-gray-500">No relationships configured yet</p>
      <p className="text-sm text-gray-400 mt-1">
        Add relationships to connect this entity with others
      </p>
    </div>
    
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        Relationships will be stored in core_relationships table following HERA v2 standards.
        Common types: PARENT_OF, MEMBER_OF, OWNS, MAPS_TO
      </AlertDescription>
    </Alert>
  </div>
);

const AttributesStep = ({ entityData, setEntityData, entityType }: any) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-medium">Dynamic Attributes</h3>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import
        </Button>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>
    </div>
    
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        All business-specific fields are stored in core_dynamic_data following HERA v2 standards.
        No custom columns are allowed on the Sacred Six tables.
      </AlertDescription>
    </Alert>
    
    <div className="grid grid-cols-2 gap-4">
      {entityType === 'CUSTOMER' && (
        <>
          <div>
            <Label htmlFor="customer_type">Customer Type</Label>
            <Select 
              value={entityData.dynamic_attributes.customer_type || ''}
              onValueChange={(value) => 
                setEntityData((prev: any) => ({
                  ...prev,
                  dynamic_attributes: { ...prev.dynamic_attributes, customer_type: value }
                }))
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select customer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="corporate">Corporate</SelectItem>
                <SelectItem value="government">Government</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="credit_limit">Credit Limit</Label>
            <Input
              id="credit_limit"
              type="number"
              value={entityData.dynamic_attributes.credit_limit || ''}
              onChange={(e) => 
                setEntityData((prev: any) => ({
                  ...prev,
                  dynamic_attributes: { ...prev.dynamic_attributes, credit_limit: e.target.value }
                }))
              }
              placeholder="0.00"
              className="mt-1"
            />
          </div>
        </>
      )}
    </div>
  </div>
);

const ReviewStep = ({ entityData }: any) => (
  <div className="space-y-6">
    <h3 className="text-lg font-medium">Review & Activate</h3>
    
    <div className="bg-gray-50 p-4 rounded-lg">
      <h4 className="font-medium mb-2">Entity Summary</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Code:</span> {entityData.entity_code}
        </div>
        <div>
          <span className="text-gray-600">Name:</span> {entityData.entity_name}
        </div>
        <div className="col-span-2">
          <span className="text-gray-600">Smart Code:</span> 
          <code className="ml-2 font-mono text-xs bg-white px-2 py-1 rounded">
            {entityData.smart_code}
          </code>
        </div>
      </div>
    </div>
    
    <Alert>
      <CheckCircle2 className="h-4 w-4" />
      <AlertDescription>
        Entity validation completed. Ready to create in HERA v2 system.
      </AlertDescription>
    </Alert>
  </div>
);