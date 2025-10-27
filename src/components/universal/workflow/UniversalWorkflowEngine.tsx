'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Play, 
  Pause, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  User, 
  ArrowRight, 
  Sparkles,
  MessageSquare,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';

interface WorkflowParticipant {
  user_id: string;
  role: string;
  email?: string;
  name?: string;
}

interface WorkflowTransition {
  from_step: number;
  to_step: number;
  condition?: string;
  action?: string;
  required_role?: string;
}

interface WorkflowStep {
  step_number: number;
  step_name: string;
  step_type: 'manual' | 'automated' | 'approval' | 'notification';
  description: string;
  assigned_to?: string;
  required_role?: string;
  form_schema?: any;
  automated_action?: string;
  due_date?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed';
  completed_at?: string;
  completed_by?: string;
  notes?: string;
}

interface WorkflowState {
  workflow_id: string;
  smart_code: string;
  workflow_name: string;
  workflow_type: string;
  entity_id?: string;
  entity_type?: string;
  current_step: number;
  total_steps: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'failed';
  created_at: string;
  created_by: string;
  updated_at: string;
  participants: WorkflowParticipant[];
  steps: WorkflowStep[];
  transitions: WorkflowTransition[];
  context_data: Record<string, any>;
  ai_recommendations?: any[];
}

interface WorkflowEngineProps {
  workflowId?: string;
  entityId?: string;
  entityType?: string;
  onWorkflowComplete?: (workflow: WorkflowState) => void;
  onWorkflowCancel?: () => void;
}

const WORKFLOW_TEMPLATES = [
  {
    type: 'ENTITY_APPROVAL',
    name: 'Entity Creation Approval',
    smart_code: 'HERA.WORKFLOW.ENTITY.APPROVAL.v1',
    description: 'Multi-step approval process for new entity creation',
    steps: [
      { name: 'Initial Review', type: 'manual', role: 'reviewer' },
      { name: 'Data Validation', type: 'automated', role: 'system' },
      { name: 'Manager Approval', type: 'approval', role: 'manager' },
      { name: 'Final Activation', type: 'automated', role: 'system' }
    ]
  },
  {
    type: 'TRANSACTION_APPROVAL',
    name: 'Transaction Approval',
    smart_code: 'HERA.WORKFLOW.TRANSACTION.APPROVAL.v1',
    description: 'Financial transaction approval workflow',
    steps: [
      { name: 'Amount Validation', type: 'automated', role: 'system' },
      { name: 'Supervisor Review', type: 'approval', role: 'supervisor' },
      { name: 'Finance Approval', type: 'approval', role: 'finance_manager' },
      { name: 'Transaction Posting', type: 'automated', role: 'system' }
    ]
  },
  {
    type: 'ONBOARDING',
    name: 'User Onboarding',
    smart_code: 'HERA.WORKFLOW.USER.ONBOARDING.v1',
    description: 'Comprehensive user onboarding process',
    steps: [
      { name: 'Account Setup', type: 'manual', role: 'admin' },
      { name: 'Role Assignment', type: 'manual', role: 'admin' },
      { name: 'Training Assignment', type: 'automated', role: 'system' },
      { name: 'Welcome Notification', type: 'notification', role: 'system' }
    ]
  }
];

export default function UniversalWorkflowEngine({
  workflowId,
  entityId,
  entityType,
  onWorkflowComplete,
  onWorkflowCancel
}: WorkflowEngineProps) {
  const [workflow, setWorkflow] = useState<WorkflowState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(!workflowId);
  const [currentStepData, setCurrentStepData] = useState<any>({});
  const [stepNotes, setStepNotes] = useState<string>('');

  useEffect(() => {
    if (workflowId) {
      loadWorkflow(workflowId);
    }
  }, [workflowId]);

  const loadWorkflow = async (id: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/v2/workflows/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('hera_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWorkflow(data.workflow);
      }
    } catch (error) {
      console.error('Error loading workflow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createWorkflowFromTemplate = async (templateType: string) => {
    setIsLoading(true);
    try {
      const template = WORKFLOW_TEMPLATES.find(t => t.type === templateType);
      if (!template) return;

      const newWorkflow: WorkflowState = {
        workflow_id: `wf_${Date.now()}`,
        smart_code: template.smart_code,
        workflow_name: template.name,
        workflow_type: templateType,
        entity_id: entityId,
        entity_type: entityType,
        current_step: 0,
        total_steps: template.steps.length,
        status: 'draft',
        created_at: new Date().toISOString(),
        created_by: 'current_user', // Replace with actual user
        updated_at: new Date().toISOString(),
        participants: [],
        steps: template.steps.map((step, index) => ({
          step_number: index,
          step_name: step.name,
          step_type: step.type as any,
          description: `${step.name} - ${template.description}`,
          required_role: step.role,
          status: index === 0 ? 'pending' : 'pending'
        })),
        transitions: template.steps.map((_, index) => ({
          from_step: index,
          to_step: index + 1,
          condition: 'step_completed'
        })).slice(0, -1), // Remove last transition
        context_data: {
          entity_id: entityId,
          entity_type: entityType
        }
      };

      setWorkflow(newWorkflow);
      setIsCreatingWorkflow(false);
      
      // Save to backend
      await saveWorkflow(newWorkflow);
    } catch (error) {
      console.error('Error creating workflow:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveWorkflow = async (workflowData: WorkflowState) => {
    try {
      const response = await fetch('/api/v2/workflows', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('hera_token')}`
        },
        body: JSON.stringify({
          command: 'create_workflow',
          payload: workflowData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }
    } catch (error) {
      console.error('Error saving workflow:', error);
    }
  };

  const executeStep = async (stepNumber: number, action: 'complete' | 'skip' | 'fail') => {
    if (!workflow) return;

    setIsLoading(true);
    try {
      const updatedWorkflow = { ...workflow };
      const step = updatedWorkflow.steps[stepNumber];
      
      step.status = action === 'complete' ? 'completed' : action === 'skip' ? 'skipped' : 'failed';
      step.completed_at = new Date().toISOString();
      step.completed_by = 'current_user'; // Replace with actual user
      step.notes = stepNotes;

      // Move to next step if completed
      if (action === 'complete' && stepNumber < updatedWorkflow.total_steps - 1) {
        updatedWorkflow.current_step = stepNumber + 1;
        updatedWorkflow.steps[stepNumber + 1].status = 'in_progress';
      } else if (action === 'complete' && stepNumber === updatedWorkflow.total_steps - 1) {
        // Workflow completed
        updatedWorkflow.status = 'completed';
      }

      updatedWorkflow.updated_at = new Date().toISOString();
      
      setWorkflow(updatedWorkflow);
      setStepNotes('');
      setCurrentStepData({});
      
      await saveWorkflow(updatedWorkflow);
      
      if (updatedWorkflow.status === 'completed' && onWorkflowComplete) {
        onWorkflowComplete(updatedWorkflow);
      }
    } catch (error) {
      console.error('Error executing step:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAIRecommendations = async () => {
    if (!workflow) return;

    try {
      // Simulate AI recommendations based on workflow context
      const recommendations = [
        {
          type: 'optimization',
          message: 'Consider parallel processing for steps 2 and 3 to reduce cycle time',
          confidence: 0.85
        },
        {
          type: 'risk',
          message: 'High-value transaction detected. Additional approval recommended.',
          confidence: 0.92
        },
        {
          type: 'automation',
          message: 'This step can be automated using existing business rules',
          confidence: 0.78
        }
      ];

      setWorkflow(prev => prev ? {
        ...prev,
        ai_recommendations: recommendations
      } : null);
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
    }
  };

  const getStepIcon = (step: WorkflowStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'in_progress':
        return <Play className="h-5 w-5 text-blue-600" />;
      case 'skipped':
        return <XCircle className="h-5 w-5 text-gray-400" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'active':
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (isCreatingWorkflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Create New Workflow</CardTitle>
              <p className="text-gray-600">Select a workflow template to get started</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {WORKFLOW_TEMPLATES.map((template) => (
                  <Card 
                    key={template.type}
                    className={`cursor-pointer transition-all ${
                      selectedTemplate === template.type 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedTemplate(template.type)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-medium mb-2">{template.name}</h3>
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      <div className="text-xs font-mono text-gray-500">{template.smart_code}</div>
                      <div className="mt-3">
                        <Badge variant="outline" className="text-xs">
                          {template.steps.length} steps
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-between pt-4">
                <Button onClick={onWorkflowCancel} variant="outline">
                  Cancel
                </Button>
                <Button
                  onClick={() => createWorkflowFromTemplate(selectedTemplate)}
                  disabled={!selectedTemplate || isLoading}
                >
                  {isLoading ? 'Creating...' : 'Create Workflow'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!workflow) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500">Loading workflow...</div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const currentStep = workflow.steps[workflow.current_step];
  const progress = ((workflow.current_step + 1) / workflow.total_steps) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {workflow.workflow_name}
              </h1>
              <p className="text-gray-600">
                Workflow ID: {workflow.workflow_id} | Created: {new Date(workflow.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <Badge className={getStatusColor(workflow.status)}>
                {workflow.status.toUpperCase()}
              </Badge>
              <div className="text-sm text-gray-500 mt-2">
                Step {workflow.current_step + 1} of {workflow.total_steps}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content */}
          <div className="col-span-8 space-y-6">
            {/* Progress Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Workflow Progress</CardTitle>
                  <Button onClick={getAIRecommendations} variant="outline" size="sm">
                    <Sparkles className="h-4 w-4 mr-2" />
                    AI Insights
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Progress value={progress} className="w-full mb-4" />
                <div className="space-y-3">
                  {workflow.steps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center p-3 rounded-lg border ${
                        index === workflow.current_step
                          ? 'border-blue-500 bg-blue-50'
                          : step.status === 'completed'
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {getStepIcon(step)}
                        <div>
                          <h4 className="font-medium">{step.step_name}</h4>
                          <p className="text-sm text-gray-600">{step.description}</p>
                          {step.required_role && (
                            <Badge variant="outline" className="text-xs mt-1">
                              {step.required_role}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {step.completed_at && (
                        <div className="text-xs text-gray-500">
                          {new Date(step.completed_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Current Step Actions */}
            {workflow.status === 'active' && currentStep && (
              <Card>
                <CardHeader>
                  <CardTitle>Current Step: {currentStep.step_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <User className="h-4 w-4" />
                    <AlertDescription>
                      Step Type: {currentStep.step_type} | Required Role: {currentStep.required_role}
                    </AlertDescription>
                  </Alert>

                  {currentStep.step_type === 'manual' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="step_notes">Notes</Label>
                        <Textarea
                          id="step_notes"
                          value={stepNotes}
                          onChange={(e) => setStepNotes(e.target.value)}
                          placeholder="Add notes for this step..."
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep.step_type === 'approval' && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription>
                        This step requires approval from a user with {currentStep.required_role} role.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={() => executeStep(workflow.current_step, 'complete')}
                      disabled={isLoading}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Complete Step
                    </Button>
                    <Button
                      onClick={() => executeStep(workflow.current_step, 'skip')}
                      disabled={isLoading}
                      variant="outline"
                    >
                      Skip Step
                    </Button>
                    <Button
                      onClick={() => executeStep(workflow.current_step, 'fail')}
                      disabled={isLoading}
                      variant="destructive"
                    >
                      Mark Failed
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="col-span-4 space-y-6">
            {/* Workflow Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Workflow Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Smart Code:</span>
                  <code className="text-xs font-mono">{workflow.smart_code}</code>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span>{workflow.workflow_type}</span>
                </div>
                {workflow.entity_id && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Entity:</span>
                    <span>{workflow.entity_type}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Created By:</span>
                  <span>{workflow.created_by}</span>
                </div>
              </CardContent>
            </Card>

            {/* AI Recommendations */}
            {workflow.ai_recommendations && workflow.ai_recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg">AI Recommendations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {workflow.ai_recommendations.map((rec, index) => (
                    <Alert key={index} className="p-3">
                      <AlertDescription className="text-sm">
                        <div className="font-medium mb-1 capitalize">{rec.type}</div>
                        <div>{rec.message}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Confidence: {(rec.confidence * 100).toFixed(0)}%
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Participants */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Participants</CardTitle>
              </CardHeader>
              <CardContent>
                {workflow.participants.length === 0 ? (
                  <p className="text-sm text-gray-500">No participants assigned</p>
                ) : (
                  <div className="space-y-2">
                    {workflow.participants.map((participant, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4" />
                        <span>{participant.name || participant.user_id}</span>
                        <Badge variant="outline" className="text-xs">
                          {participant.role}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}