/**
 * Example usage of the Playbook Orchestrator
 * 
 * This shows how to set up and run the orchestrator service
 * for executing playbook runs.
 */

import { createOrchestrator } from './orchestrator';
import { EventEmitter } from 'events';

// Example AI Service implementation
class ExampleAIService {
  async process(request: any): Promise<any> {
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Parse expected output format
    const outputKeys = Object.keys(request.output_schema?.properties || {});
    const outputs: Record<string, any> = {};
    
    // Generate mock outputs based on schema
    for (const key of outputKeys) {
      const type = request.output_schema.properties[key].type;
      switch (type) {
        case 'string':
          outputs[key] = `Generated ${key}`;
          break;
        case 'number':
          outputs[key] = Math.random() * 100;
          break;
        case 'boolean':
          outputs[key] = Math.random() > 0.5;
          break;
        case 'object':
          outputs[key] = { generated: true };
          break;
        default:
          outputs[key] = null;
      }
    }
    
    return {
      outputs,
      confidence: 0.85 + Math.random() * 0.15,
      insights: 'AI processing completed successfully',
      usage: {
        prompt_tokens: 150,
        completion_tokens: 50,
        total_tokens: 200
      }
    };
  }
}

// Example orchestrator setup
export async function setupOrchestrator(organizationId: string) {
  // Create event bus for monitoring
  const eventBus = new EventEmitter();
  
  // Set up event listeners
  eventBus.on('step:completed', (event) => {
    console.log(`✅ Step completed: ${event.stepId}`);
    console.log(`   Outputs:`, event.outputs);
  });
  
  eventBus.on('step:failed', (event) => {
    console.error(`❌ Step failed: ${event.stepId}`);
    console.error(`   Error:`, event.error);
    console.error(`   Attempt: ${event.attempt}`);
  });
  
  eventBus.on('run:completed', (event) => {
    console.log(`🎉 Run completed: ${event.runId}`);
  });
  
  eventBus.on('run:failed', (event) => {
    console.error(`💥 Run failed: ${event.runId}`);
    console.error(`   Reason:`, event.reason);
  });
  
  // Create orchestrator
  const orchestrator = createOrchestrator({
    organizationId,
    pollIntervalMs: 5000, // Poll every 5 seconds
    maxConcurrentSteps: 5, // Max 5 concurrent steps
    serviceToken: process.env.SERVICE_TOKEN || '',
    aiService: new ExampleAIService(),
    eventBus
  });
  
  return orchestrator;
}

// Example of starting a playbook run
export async function startPlaybookRun(
  organizationId: string,
  playbookId: string,
  inputs: Record<string, any>
) {
  // This would typically be done via API, but showing the direct approach
  const { universalApi } = await import('@/lib/universal-api');
  
  // Create the run
  const run = await universalApi.createTransaction({
    transaction_type: 'playbook_run',
    transaction_code: `RUN-${Date.now()}`,
    smart_code: 'HERA.GENERAL.PLAYBOOK.RUN.EXAMPLE.V1',
    organization_id: organizationId,
    reference_entity_id: playbookId,
    status: 'queued',
    metadata: {
      inputs,
      priority: 'normal',
      created_at: new Date().toISOString()
    }
  });
  
  // Get playbook steps
  const relationships = await universalApi.queryRelationships({
    from_entity_id: playbookId,
    relationship_type: 'playbook_has_step',
    smart_code: 'HERA.PLAYBOOK.HAS_STEP.V1'
  });
  
  // Create step execution lines
  for (let i = 0; i < relationships.length; i++) {
    const stepId = relationships[i].to_entity_id;
    const step = await universalApi.getEntity(stepId);
    
    await universalApi.createTransactionLine({
      transaction_id: run.id,
      line_number: i + 1,
      line_entity_id: stepId,
      smart_code: 'HERA.GENERAL.PLAYBOOK.STEP.EXEC.EXAMPLE.V1',
      quantity: 1,
      metadata: {
        sequence: i + 1,
        status: i === 0 ? 'pending' : 'queued',
        worker_type: step.metadata?.worker_type || 'system',
        service_endpoint: step.metadata?.service_endpoint,
        sla_seconds: step.metadata?.sla_seconds || 300,
        retry_policy: step.metadata?.retry_policy || {
          max_attempts: 3,
          backoff_seconds: [5, 30, 120]
        }
      }
    });
  }
  
  console.log(`✨ Created playbook run: ${run.id}`);
  return run;
}

// Example usage
async function main() {
  const organizationId = 'org_123';
  
  // Set up orchestrator
  const orchestrator = await setupOrchestrator(organizationId);
  
  // Start orchestrator
  console.log('🚀 Starting orchestrator...');
  await orchestrator.start();
  
  // Create a sample run
  const run = await startPlaybookRun(
    organizationId,
    'playbook_456', // Example playbook ID
    {
      customer_name: 'John Doe',
      email: 'john@example.com',
      request_type: 'onboarding'
    }
  );
  
  // Let it run for a while
  console.log('⏳ Orchestrator running...');
  
  // Stop after 60 seconds (in production, this would run continuously)
  setTimeout(async () => {
    console.log('🛑 Stopping orchestrator...');
    await orchestrator.stop();
    process.exit(0);
  }, 60000);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}