import type { ExecuteOptions } from '../core/executor';

export const supabaseAdapters: ExecuteOptions['adapters'] = {
  setDynamic(ctx, field) {
    ctx.out.dynamicFields ??= [];
    ctx.out.dynamicFields.push(field);
  },
  link(ctx, rel) {
    ctx.out.relationships ??= [];
    ctx.out.relationships.push(rel);
  },
  async persist(ctx) {
    // Map ctx.out → your UCR endpoints:
    // - upsert entity header
    // - upsert dynamic fields batch
    // - upsert relationships batch
    // Capture created IDs back into ctx.state if needed
    // e.g., ctx.state.createdCertificateId = ...
  },
  audit(ctx, event, payload) {
    // Write to audit trail table or logger
    console.info('[AUDIT]', event, { org: ctx.orgId, entity: ctx.entity.id, ...payload });
  },
  async tx(fn) {
    // Wrap in DB transaction (or emulate with best-effort rollback)
    return await fn();
  },
  async fetchEntityById(id, opts) {
    // Call your universal API v2 to get an entity by id
    return { id, ...opts };
  },
};