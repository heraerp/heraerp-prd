import type { 
  Playbook, 
  PlaybookContext, 
  StepResult, 
  StepFn,
  ContextUtil 
} from './dsl';

export interface ExecuteOptions {
  organizationId: string;
  actorId: string;
  actorRole: string;
  adapters: {
    setDynamic: (ctx: PlaybookContext, field: any) => void;
    link: (ctx: PlaybookContext, rel: any) => void;
    persist: (ctx: PlaybookContext) => Promise<void>;
    audit: (ctx: PlaybookContext, event: string, payload: any) => void;
    tx: (fn: () => Promise<void>) => Promise<void>;
    fetchEntityById: (id: string, opts?: any) => Promise<any>;
  };
}

export interface ExecuteResult {
  steps: StepResult[];
  output: any;
  state: any;
}

export async function executePlaybook(
  playbook: Playbook,
  entity: any,
  opts: ExecuteOptions
): Promise<ExecuteResult> {
  const results: StepResult[] = [];
  
  // Initialize context
  const ctx: PlaybookContext = {
    entity: {
      id: entity.id,
      type: entity.entity_type || playbook.entityType,
      payload: entity,
    },
    actor: {
      id: opts.actorId,
      role: opts.actorRole,
    },
    orgId: opts.organizationId,
    state: {
      __playbookId: playbook.id,
    },
    out: {
      headers: {},
      dynamicFields: [],
      relationships: [],
    },
    util: {} as ContextUtil, // Will be populated below
  };

  // Setup util helpers
  ctx.util = {
    getDynamic(name: string) {
      // First check if we're setting it in the current playbook
      const pending = ctx.out.dynamicFields?.find(f => f.name === name);
      if (pending) return pending.value;
      
      // Then check the entity payload
      return entity.dynamic_data?.find((f: any) => f.field_name === name)?.field_value;
    },
    
    setDynamic(name: string, value: any, fieldOpts?: any) {
      opts.adapters.setDynamic(ctx, {
        name,
        value,
        type: fieldOpts?.type || 'text',
        smartCode: fieldOpts?.smartCode || `HERA.${playbook.entityType}.DYN.${name.toUpperCase()}.v1`,
      });
    },
    
    link(type: string, to: string, linkOpts?: any) {
      opts.adapters.link(ctx, {
        type,
        from: ctx.entity.id,
        to,
        smartCode: linkOpts?.smartCode || `HERA.${playbook.entityType}.REL.${type}.v1`,
      });
    },
    
    async persist() {
      await opts.adapters.persist(ctx);
    },
    
    log(event: string, payload: any = {}) {
      opts.adapters.audit(ctx, event, payload);
    },
    
    async tx(fn: () => Promise<void>) {
      await opts.adapters.tx(fn);
    },
    
    async fetchEntityById(id: string, fetchOpts?: any) {
      return await opts.adapters.fetchEntityById(id, {
        ...fetchOpts,
        organizationId: ctx.orgId,
      });
    },
  };

  // Execute steps
  for (const step of playbook.steps) {
    try {
      const result = await step(ctx);
      results.push(result);
      
      if (result.status === 'failed') {
        console.error(`[Playbook ${playbook.id}] Step failed:`, result);
        break; // Stop on first failure
      }
    } catch (error: any) {
      results.push({
        kind: 'unknown',
        id: 'error',
        status: 'failed',
        message: error.message,
        error,
      });
      break;
    }
  }
  
  // Final persist if we have accumulated changes
  if (ctx.out.headers || ctx.out.dynamicFields?.length || ctx.out.relationships?.length) {
    try {
      await opts.adapters.persist(ctx);
    } catch (error: any) {
      results.push({
        kind: 'post',
        id: 'persist:final',
        status: 'failed', 
        message: error.message,
        error,
      });
    }
  }

  return {
    steps: results,
    output: ctx.out,
    state: ctx.state,
  };
}