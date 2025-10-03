/* ------------------------------------------
 * Step helpers (builders)
 * ----------------------------------------*/
export const validate = (id, fn) => async (ctx) => {
    try {
        const msg = await fn(ctx);
        return { kind: 'validate', id, status: 'ok', message: msg || 'validated' };
    }
    catch (e) {
        return { kind: 'validate', id, status: 'failed', message: e?.message, error: e };
    }
};
export const enforce = (id, fn) => async (ctx) => {
    try {
        await fn(ctx);
        return { kind: 'enforce', id, status: 'ok' };
    }
    catch (e) {
        return { kind: 'enforce', id, status: 'failed', message: e?.message, error: e };
    }
};
export const transform = (id, fn) => async (ctx) => {
    try {
        await fn(ctx);
        return { kind: 'transform', id, status: 'ok' };
    }
    catch (e) {
        return { kind: 'transform', id, status: 'failed', message: e?.message, error: e };
    }
};
export const post = (id, fn) => async (ctx) => {
    try {
        await fn(ctx);
        return { kind: 'post', id, status: 'ok' };
    }
    catch (e) {
        return { kind: 'post', id, status: 'failed', message: e?.message, error: e };
    }
};
export const audit = (id, fn) => async (ctx) => {
    try {
        await fn(ctx);
        return { kind: 'audit', id, status: 'ok' };
    }
    catch (e) {
        return { kind: 'audit', id, status: 'failed', message: e?.message, error: e };
    }
};
export const branch = (id, cond, whenTrue, whenFalse = []) => async (ctx) => {
    const list = cond(ctx) ? whenTrue : whenFalse;
    // executor will expand composite steps, so just mark as ok here
    ctx.state.__branch = id;
    for (const s of list) {
        const r = await s(ctx);
        if (r.status === 'failed')
            return { kind: 'branch', id, status: 'failed', message: r.message, error: r.error };
    }
    return { kind: 'branch', id, status: 'ok' };
};
export const tx = (id, steps) => async (ctx) => {
    try {
        await ctx.util.tx(async () => {
            for (const s of steps) {
                const r = await s(ctx);
                if (r.status === 'failed')
                    throw new Error(`[${id}] step failed: ${s.name || 'anon'} — ${r.message}`);
            }
        });
        return { kind: 'tx', id, status: 'ok' };
    }
    catch (e) {
        return { kind: 'tx', id, status: 'rolled_back', message: e?.message, error: e };
    }
};
