import { apiV2 } from '@/lib/client/fetchV2';
export const universalApiAdapters = {
    setDynamic(ctx, field) {
        ctx.out.dynamicFields ??= [];
        // Ensure we don't duplicate fields
        const existing = ctx.out.dynamicFields.findIndex(f => f.name === field.name);
        if (existing >= 0) {
            ctx.out.dynamicFields[existing] = field;
        }
        else {
            ctx.out.dynamicFields.push(field);
        }
    },
    link(ctx, rel) {
        ctx.out.relationships ??= [];
        // Ensure we don't duplicate relationships
        const existing = ctx.out.relationships.findIndex(r => r.type === rel.type && r.from === rel.from && r.to === rel.to);
        if (existing < 0) {
            ctx.out.relationships.push(rel);
        }
    },
    async persist(ctx) {
        const results = {};
        // 1. Upsert entity header if present
        if (ctx.out.headers) {
            const entityData = {
                ...ctx.out.headers,
                organization_id: ctx.orgId,
            };
            if (ctx.entity.id) {
                // Update existing
                const { data: entity } = await apiV2.put(`entities/${ctx.entity.id}`, entityData);
                results.entity = entity;
            }
            else {
                // Create new
                const { data: entity } = await apiV2.post('entities', entityData);
                results.entity = entity;
                ctx.entity.id = entity.id; // Set for subsequent operations
            }
        }
        // 2. Batch upsert dynamic fields
        if (ctx.out.dynamicFields && ctx.entity.id) {
            const dynamicBatch = ctx.out.dynamicFields.map(field => ({
                entity_id: ctx.entity.id,
                field_name: field.name,
                field_type: field.type,
                field_value: field.value,
                smart_code: field.smartCode,
                organization_id: ctx.orgId,
            }));
            const { data: fields } = await apiV2.post('entities/dynamic-data/batch', { fields: dynamicBatch });
            results.dynamicFields = fields;
        }
        // 3. Batch upsert relationships
        if (ctx.out.relationships && ctx.entity.id) {
            const relBatch = ctx.out.relationships.map(rel => ({
                from_entity_id: rel.from || ctx.entity.id,
                to_entity_id: rel.to,
                relationship_type: rel.type,
                smart_code: rel.smartCode,
                organization_id: ctx.orgId,
            }));
            const { data: relationships } = await apiV2.post('relationships/batch', { relationships: relBatch });
            results.relationships = relationships;
        }
        // Store results back in state for downstream steps
        ctx.state.persistResults = results;
        // If we created a certificate, store its ID
        if (results.entity?.entity_type === 'CERTIFICATE') {
            ctx.state.createdCertificateId = results.entity.id;
        }
    },
    audit(ctx, event, payload) {
        // Create audit trail transaction
        apiV2.post('transactions', {
            transaction_type: 'audit_trail',
            smart_code: 'HERA.SYSTEM.AUDIT.PLAYBOOK.v1',
            organization_id: ctx.orgId,
            metadata: {
                event,
                entity_type: ctx.entity.type,
                entity_id: ctx.entity.id,
                actor_id: ctx.actor.id,
                actor_role: ctx.actor.role,
                playbook_id: ctx.state.__playbookId,
                ...payload,
            },
        }).catch(err => {
            console.error('[AUDIT] Failed to log:', err);
        });
    },
    async tx(fn) {
        // Universal API handles transactions at the endpoint level
        // For now, just execute the function
        // TODO: Implement proper transaction support when available
        try {
            return await fn();
        }
        catch (error) {
            // Attempt rollback logic here if needed
            throw error;
        }
    },
    async fetchEntityById(id, opts = {}) {
        // The adapter needs access to org ID, which should be passed via the execution context
        // For now, we'll require it to be passed in opts
        if (!opts.organizationId) {
            throw new Error('organizationId required for fetchEntityById');
        }
        const params = { organization_id: opts.organizationId };
        if (opts.includeDynamic)
            params.include_dynamic = true;
        if (opts.includeRelationships)
            params.include_relationships = true;
        const { data } = await apiV2.get(`entities/${id}`, params);
        return data;
    },
};
