'use client';

import { useState, useEffect } from 'react';
import { useCompleteStep } from '@/hooks/use-runs';
import { useToast } from '@/components/ui/useToast';
import { getStepOutputSchema } from '@/lib/schemas';
import { JsonSchemaForm } from '@/components/forms/JsonSchemaForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingState } from '@/components/states/Loading';
import { ErrorState } from '@/components/states/ErrorState';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { TaskItem } from '@/types/tasks';
import type { StepCompleteRequest } from '@/types/runs';

interface TaskDrawerProps {
  open: boolean;
  onClose: () => void;
  task: TaskItem | null;
}

export function TaskDrawer({ open, onClose, task }: TaskDrawerProps) {
  const [schema, setSchema] = useState<Record<string, unknown> | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [aiConfidence, setAiConfidence] = useState<number>(0.95);
  const [aiInsights, setAiInsights] = useState<string>('');
  
  const { toast } = useToast();
  const completeStepMutation = useCompleteStep(task?.run_id || '', task?.sequence || 0);

  // Fetch schema when task changes
  useEffect(() => {
    if (!task || !open) {
      setSchema(null);
      setSchemaError(null);
      return;
    }

    const loadSchema = async () => {
      setSchemaLoading(true);
      setSchemaError(null);
      
      try {
        const outputSchema = await getStepOutputSchema(task);
        setSchema(outputSchema);
      } catch (error) {
        console.error('Schema fetch error:', error);
        setSchemaError(error instanceof Error ? error.message : 'Failed to load schema');
      } finally {
        setSchemaLoading(false);
      }
    };

    loadSchema();
  }, [task, open]);

  const handleSubmit = async (outputs: any) => {
    if (!task) return;

    const payload: StepCompleteRequest = {
      outputs,
      ai_confidence: aiConfidence,
      ai_insights: aiInsights || undefined,
    };

    try {
      await completeStepMutation.mutateAsync({
        ...payload,
        orgId: task.organization_id,
      });

      toast.success(
        'Step Completed',
        `Successfully completed step: ${task.step_name}`
      );

      onClose();
    } catch (error) {
      console.error('Step completion error:', error);
      toast.error(
        'Completion Failed',
        error instanceof Error ? error.message : 'Failed to complete step'
      );
    }
  };

  const handleClose = () => {
    if (completeStepMutation.isPending) return; // Prevent closing during submission
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent className="w-[600px] sm:w-[600px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Complete Task</SheetTitle>
          <SheetDescription>
            {task ? `${task.step_name} - Run ${task.run_id}` : 'No task selected'}
          </SheetDescription>
        </SheetHeader>

        {!task && (
          <div className="mt-6">
            <p className="text-gray-500">No task selected</p>
          </div>
        )}

        {task && (
          <div className="mt-6 space-y-6">
            {/* Task Information */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Step Name</h4>
                <p className="font-medium">{task.step_name}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Run ID</h4>
                <p className="text-sm font-mono">{task.run_id}</p>
              </div>
              
              <div>
                <h4 className="font-medium text-sm text-gray-500 mb-1">Sequence</h4>
                <p className="text-sm">{task.sequence}</p>
              </div>

              {task.due_at && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Due</h4>
                  <p className="text-sm">{new Date(task.due_at).toLocaleString()}</p>
                </div>
              )}

              {task.metadata && (
                <div>
                  <h4 className="font-medium text-sm text-gray-500 mb-1">Context</h4>
                  <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                    {JSON.stringify(task.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* AI Fields */}
            <div className="border-t pt-6 space-y-4">
              <h4 className="font-medium">AI Enhancement (Optional)</h4>
              
              <div className="space-y-2">
                <Label htmlFor="ai_confidence">AI Confidence (0-1)</Label>
                <Input
                  id="ai_confidence"
                  type="number"
                  min="0"
                  max="1"
                  step="0.01"
                  value={aiConfidence}
                  onChange={(e) => setAiConfidence(Number(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ai_insights">AI Insights</Label>
                <Textarea
                  id="ai_insights"
                  value={aiInsights}
                  onChange={(e) => setAiInsights(e.target.value)}
                  placeholder="Optional insights about this step completion..."
                  rows={3}
                />
              </div>
            </div>

            {/* Schema Form */}
            <div className="border-t pt-6">
              <h4 className="font-medium mb-4">Step Outputs</h4>
              
              {schemaLoading && <LoadingState />}
              
              {schemaError && (
                <ErrorState 
                  message={`Schema loading failed: ${schemaError}`}
                  onRetry={() => {
                    // Trigger refetch by changing task reference
                    const taskCopy = { ...task };
                    setSchema(null);
                    // This will trigger the useEffect
                  }}
                />
              )}
              
              {schema && !schemaLoading && (
                <JsonSchemaForm
                  schema={schema}
                  onSubmit={handleSubmit}
                  submitLabel={completeStepMutation.isPending ? 'Completing...' : 'Complete Step'}
                />
              )}
              
              {!schema && !schemaLoading && !schemaError && (
                <div className="p-4 border rounded-lg">
                  <p className="text-gray-500">No output schema defined for this step</p>
                  <Button
                    onClick={() => handleSubmit({})}
                    disabled={completeStepMutation.isPending}
                    className="mt-4"
                  >
                    {completeStepMutation.isPending ? 'Completing...' : 'Complete Without Outputs'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}