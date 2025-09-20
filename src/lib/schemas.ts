import { api } from './api-client';
import type { TaskItem, StepSchemaResult } from '@/types/tasks';

// Simple cache for schemas to avoid repeated fetches
const schemaCache = new Map<string, Record<string, unknown>>();

/**
 * Get the output schema for a step from a task
 */
export async function getStepOutputSchema(task: TaskItem): Promise<Record<string, unknown>> {
  const cacheKey = `${task.run_id}-${task.sequence}`;
  
  // Check cache first
  if (schemaCache.has(cacheKey)) {
    return schemaCache.get(cacheKey)!;
  }

  try {
    // Strategy 1: Try to get playbook definition and find step
    const playbookName = task.metadata?.playbook_name as string;
    
    if (playbookName) {
      try {
        // Fetch playbook by name
        const playbooks = await api.playbooks.list({ 
          filter: { name: playbookName },
          limit: 1 
        });
        
        if (playbooks.data && playbooks.data.length > 0) {
          const playbook = playbooks.data[0];
          
          // Get full playbook definition
          const fullPlaybook = await api.playbooks.get(playbook.id);
          
          // Find step by sequence or name
          const step = findStepInPlaybook(fullPlaybook, task.step_name, task.sequence);
          
          if (step?.output_contract) {
            schemaCache.set(cacheKey, step.output_contract);
            return step.output_contract;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch playbook definition:', error);
      }
    }

    // Strategy 2: Try to get schema from run metadata or step definition endpoint
    // This would be a custom endpoint that returns step schemas
    try {
      const response = await fetch(`/api/v1/runs/${task.run_id}/steps/${task.sequence}/schema`);
      if (response.ok) {
        const schemaResult: StepSchemaResult = await response.json();
        if (schemaResult.output_contract) {
          schemaCache.set(cacheKey, schemaResult.output_contract);
          return schemaResult.output_contract;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch step schema from API:', error);
    }

    // Strategy 3: Return default schema based on step name patterns
    const defaultSchema = getDefaultSchemaForStepName(task.step_name);
    schemaCache.set(cacheKey, defaultSchema);
    return defaultSchema;

  } catch (error) {
    console.error('Failed to get step output schema:', error);
    
    // Return minimal default schema
    const fallbackSchema = {
      type: 'object',
      properties: {
        result: {
          type: 'string',
          title: 'Result',
          description: 'Step completion result'
        }
      }
    };
    
    schemaCache.set(cacheKey, fallbackSchema);
    return fallbackSchema;
  }
}

/**
 * Find step definition in playbook by name or sequence
 */
function findStepInPlaybook(
  playbook: any, 
  stepName: string, 
  sequence: number
): StepSchemaResult | null {
  // Look for steps in playbook definition
  if (playbook.steps && Array.isArray(playbook.steps)) {
    // Try to find by sequence
    if (playbook.steps[sequence - 1]) {
      return {
        output_contract: playbook.steps[sequence - 1].output_contract,
        step_definition: playbook.steps[sequence - 1]
      };
    }
    
    // Try to find by name
    const step = playbook.steps.find((s: any) => s.name === stepName);
    if (step) {
      return {
        output_contract: step.output_contract,
        step_definition: step
      };
    }
  }

  // Look in metadata or other playbook structures
  if (playbook.metadata?.steps) {
    const step = playbook.metadata.steps.find((s: any) => 
      s.name === stepName || s.sequence === sequence
    );
    if (step) {
      return {
        output_contract: step.output_contract,
        step_definition: step
      };
    }
  }

  return null;
}

/**
 * Generate default schema based on step name patterns
 */
function getDefaultSchemaForStepName(stepName: string): Record<string, unknown> {
  const lowerName = stepName.toLowerCase();

  // Approval steps
  if (lowerName.includes('approve') || lowerName.includes('review')) {
    return {
      type: 'object',
      properties: {
        approved: {
          type: 'boolean',
          title: 'Approved',
          description: 'Whether this item is approved'
        },
        comments: {
          type: 'string',
          title: 'Comments',
          description: 'Additional comments or feedback',
          format: 'textarea'
        }
      },
      required: ['approved']
    };
  }

  // Validation steps
  if (lowerName.includes('validate') || lowerName.includes('verify')) {
    return {
      type: 'object',
      properties: {
        valid: {
          type: 'boolean',
          title: 'Valid',
          description: 'Whether validation passed'
        },
        issues: {
          type: 'array',
          title: 'Issues Found',
          items: {
            type: 'string'
          }
        },
        notes: {
          type: 'string',
          title: 'Validation Notes',
          format: 'textarea'
        }
      },
      required: ['valid']
    };
  }

  // Data entry steps
  if (lowerName.includes('enter') || lowerName.includes('input') || lowerName.includes('fill')) {
    return {
      type: 'object',
      properties: {
        data: {
          type: 'object',
          title: 'Data',
          description: 'Enter the required data',
          properties: {
            value: {
              type: 'string',
              title: 'Value'
            }
          }
        },
        confirmed: {
          type: 'boolean',
          title: 'Confirmed',
          description: 'Confirm data entry is complete'
        }
      },
      required: ['confirmed']
    };
  }

  // Generic completion schema
  return {
    type: 'object',
    properties: {
      status: {
        type: 'string',
        title: 'Status',
        enum: ['completed', 'failed', 'skipped'],
        default: 'completed'
      },
      result: {
        type: 'string',
        title: 'Result',
        description: 'Description of the step result',
        format: 'textarea'
      },
      output_data: {
        type: 'object',
        title: 'Output Data',
        description: 'Additional output data (JSON format)',
        additionalProperties: true
      }
    },
    required: ['status']
  };
}

/**
 * Clear schema cache (useful for testing or when playbooks change)
 */
export function clearSchemaCache(): void {
  schemaCache.clear();
}