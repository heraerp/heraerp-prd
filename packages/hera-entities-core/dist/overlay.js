// deep merge limited to our structure; arrays are merged by name/type
export function withOverlay(base, overlay) {
    const merged = {
        ...base,
        ...overlay,
        dynamicFields: mergeFields(base.dynamicFields, overlay.dynamicFields),
        relationships: mergeRels(base.relationships ?? [], overlay.relationships ?? []),
        policy: mergePolicy(base.policy, overlay.policy),
        metadata: { ...(base.metadata ?? {}), ...(overlay.metadata ?? {}) }
    };
    return merged;
}
function mergeFields(base, over) {
    if (!over || over.length === 0)
        return base.slice();
    const byName = new Map(base.map(f => [f.name, f]));
    for (const f of over) {
        const existing = byName.get(f.name);
        byName.set(f.name, existing ? { ...existing, ...f, ui: { ...(existing.ui ?? {}), ...(f.ui ?? {}) } } : f);
    }
    return Array.from(byName.values());
}
function mergeRels(base, over) {
    const byType = new Map(base.map(r => [r.type, r]));
    for (const r of over) {
        const existing = byType.get(r.type);
        byType.set(r.type, existing ? { ...existing, ...r } : r);
    }
    return Array.from(byType.values());
}
function mergePolicy(base, over) {
    if (!base && !over)
        return undefined;
    return {
        canCreate: over?.canCreate ?? base?.canCreate,
        canEdit: over?.canEdit ?? base?.canEdit,
        canDelete: over?.canDelete ?? base?.canDelete
    };
}
// Utility to evaluate visibility consistently
export function isVisible(field, role, capabilities) {
    const v = field.ui?.visible;
    if (typeof v === 'function')
        return v(role, capabilities);
    return v !== false;
}
