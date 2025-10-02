import type { EntityPreset, RelationshipDef } from './types.js';

export function withMixins<T extends EntityPreset>(
  base: T,
  mixins: Array<Partial<Pick<T, 'dynamicFields' | 'relationships' | 'metadata'>>>
): T {
  return mixins.reduce<T>((acc, m) => {
    const rels = [...(acc.relationships ?? [])];
    for (const r of m.relationships ?? []) {
      if (!rels.find(x => x.type === r.type)) rels.push(r as RelationshipDef);
    }
    return {
      ...acc,
      dynamicFields: overlayFields(acc.dynamicFields, m.dynamicFields ?? []),
      relationships: rels,
      metadata: { ...(acc.metadata ?? {}), ...(m.metadata ?? {}) }
    };
  }, base);
}

function overlayFields(base: EntityPreset['dynamicFields'], over: EntityPreset['dynamicFields']) {
  const byName = new Map(base.map(f => [f.name, f]));
  for (const f of over) {
    const existing = byName.get(f.name);
    byName.set(f.name, existing ? { ...existing, ...f, ui: { ...(existing.ui ?? {}), ...(f.ui ?? {}) } } : f);
  }
  return Array.from(byName.values());
}

// Example mixins
export const TAGGABLE = {
  relationships: [
    {
      type: 'HAS_TAG',
      smart_code: 'HERA.CORE.REL.HAS_TAG.v1',
      cardinality: 'many' as const
    }
  ]
};