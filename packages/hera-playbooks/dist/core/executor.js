export async function executePlaybook(playbook, entity, opts) {
    const results = [];
    // Initialize context
    const ctx = {
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
        util: {}, // Will be populated below
    };
    // Setup util helpers
    ctx.util = {
        getDynamic(name) {
            // First check if we're setting it in the current playbook
            const pending = ctx.out.dynamicFields?.find(f => f.name === name);
            if (pending)
                return pending.value;
            // Then check the entity payload
            return entity.dynamic_data?.find((f) => f.field_name === name)?.field_value;
        },
        setDynamic(name, value, fieldOpts) {
            opts.adapters.setDynamic(ctx, {
                name,
                value,
                type: fieldOpts?.type || 'text',
                smartCode: fieldOpts?.smartCode || `HERA.${playbook.entityType}.DYN.${name.toUpperCase()}.v1`,
            });
        },
        link(type, to, linkOpts) {
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
        log(event, payload = {}) {
            opts.adapters.audit(ctx, event, payload);
        },
        async tx(fn) {
            await opts.adapters.tx(fn);
        },
        async fetchEntityById(id, fetchOpts) {
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
        }
        catch (error) {
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
        }
        catch (error) {
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
