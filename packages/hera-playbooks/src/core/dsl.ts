export type PlaybookVersion = `v${number}`;

export type StepKind =
  | 'validate'     // read-only checks
  | 'enforce'      // mutate ctx, normalize/derive values
  | 'transform'    // remap, expand, compute
  | 'post'         // persistence (headers/lines/relationships)
  | 'audit'        // logging/telemetry
  | 'branch'       // conditional routing
  | 'tx';          // nested transactional group

export type StepStatus = 'ok' | 'skipped' | 'failed' | 'rolled_back';

export interface PlaybookContext<I = any> {
  orgId: string;
  actor: { id: string; role: string };
  entity: {
    type: string;
    id?: string;
    name?: string;
    smartCode: string; // ENTITY smart code
    payload: Record<string, any>; // incoming body (metadata, dyn fields, rels)
  };
  // Derived/working state (mutated by enforce/transform steps)
  state: Record<string, any>;
  // Outputs destined for persistence
  out: {
    headers?: Record<string, any>;
    lines?: Array<Record<string, any>>;
    relationships?: Array<{ type: string; from: string; to: string; smartCode: string }>;
    dynamicFields?: Array<{ name: string; value: any; smartCode: string; type: string }>;
  };
  // Execution utilities (injected by executor)
  util: {
    now(): string;
    getDynamic(name: string): any;
    setDynamic(name: string, value: any, opts: { smartCode: string; type: string }): void;
    link(type: string, toEntityId: string, smartCode: string): void;
    fetchEntityById(id: string, opts?: { includeDynamic?: boolean; includeRelationships?: boolean }): Promise<any>;
    tx<T>(fn: () => Promise<T>): Promise<T>;
    log(event: string, data?: any): void;
  };
}

export interface StepResult {
  kind: StepKind;
  id: string;
  status: StepStatus;
  message?: string;
  data?: any;
  error?: any;
}

export type StepFn<C extends PlaybookContext = PlaybookContext> = (ctx: C) => Promise<StepResult> | StepResult;

export interface Playbook<C extends PlaybookContext = PlaybookContext> {
  id: string; // e.g., "HERA.SALON.PRODUCT.PLAYBOOK.v1"
  entityType: string; // e.g., "PRODUCT"
  version: PlaybookVersion; // "v1"
  steps: StepFn<C>[];
}

/* ------------------------------------------
 * Step helpers (builders)
 * ----------------------------------------*/
export const validate = (id: string, fn: (ctx: PlaybookContext) => void | string | Promise<void | string>): StepFn =>
  async (ctx) => {
    try {
      const msg = await fn(ctx);
      return { kind: 'validate', id, status: 'ok', message: msg || 'validated' };
    } catch (e: any) {
      return { kind: 'validate', id, status: 'failed', message: e?.message, error: e };
    }
  };

export const enforce = (id: string, fn: (ctx: PlaybookContext) => void | Promise<void>): StepFn =>
  async (ctx) => {
    try {
      await fn(ctx);
      return { kind: 'enforce', id, status: 'ok' };
    } catch (e: any) {
      return { kind: 'enforce', id, status: 'failed', message: e?.message, error: e };
    }
  };

export const transform = (id: string, fn: (ctx: PlaybookContext) => void | Promise<void>): StepFn =>
  async (ctx) => {
    try {
      await fn(ctx);
      return { kind: 'transform', id, status: 'ok' };
    } catch (e: any) {
      return { kind: 'transform', id, status: 'failed', message: e?.message, error: e };
    }
  };

export const post = (id: string, fn: (ctx: PlaybookContext) => Promise<void>): StepFn =>
  async (ctx) => {
    try {
      await fn(ctx);
      return { kind: 'post', id, status: 'ok' };
    } catch (e: any) {
      return { kind: 'post', id, status: 'failed', message: e?.message, error: e };
    }
  };

export const audit = (id: string, fn: (ctx: PlaybookContext) => void | Promise<void>): StepFn =>
  async (ctx) => {
    try {
      await fn(ctx);
      return { kind: 'audit', id, status: 'ok' };
    } catch (e: any) {
      return { kind: 'audit', id, status: 'failed', message: e?.message, error: e };
    }
  };

export const branch = (
  id: string,
  cond: (ctx: PlaybookContext) => boolean,
  whenTrue: StepFn[],
  whenFalse: StepFn[] = []
): StepFn => async (ctx) => {
  const list = cond(ctx) ? whenTrue : whenFalse;
  // executor will expand composite steps, so just mark as ok here
  ctx.state.__branch = id;
  for (const s of list) {
    const r = await s(ctx);
    if (r.status === 'failed') return { kind: 'branch', id, status: 'failed', message: r.message, error: r.error };
  }
  return { kind: 'branch', id, status: 'ok' };
};

export const tx = (id: string, steps: StepFn[]): StepFn => async (ctx) => {
  try {
    await ctx.util.tx(async () => {
      for (const s of steps) {
        const r = await s(ctx);
        if (r.status === 'failed') throw new Error(`[${id}] step failed: ${s.name || 'anon'} — ${r.message}`);
      }
    });
    return { kind: 'tx', id, status: 'ok' };
  } catch (e: any) {
    return { kind: 'tx', id, status: 'rolled_back', message: e?.message, error: e };
  }
};