import { Playbook, validate, enforce, transform, post, audit, tx } from '../core/dsl';

export const PRODUCT_PLAYBOOK_V1: Playbook = {
  id: 'HERA.SALON.PRODUCT.PLAYBOOK.v1',
  entityType: 'PRODUCT',
  version: 'v1',
  steps: [
    validate('schema:required', (ctx) => {
      const name = ctx.entity.payload?.entity_name;
      if (!name) throw new Error('Product name is required');
      const market = ctx.util.getDynamic('price_market');
      if (market == null) throw new Error('price_market is required');
      return 'base fields ok';
    }),

    enforce('normalize:codes', (ctx) => {
      // Ensure consistent smart codes exist
      ctx.util.setDynamic('price_market', Number(ctx.util.getDynamic('price_market')), {
        smartCode: 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1',
        type: 'number',
      });
      const cost = ctx.util.getDynamic('price_cost');
      if (cost != null) {
        ctx.util.setDynamic('price_cost', Number(cost), {
          smartCode: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1',
          type: 'number',
        });
      }
    }),

    transform('derive:margins', (ctx) => {
      const m = Number(ctx.util.getDynamic('price_market') ?? 0);
      const c = Number(ctx.util.getDynamic('price_cost') ?? 0);
      const margin = m - c;
      ctx.state.margin = margin;
      ctx.util.setDynamic('margin', margin, {
        smartCode: 'HERA.SALON.PRODUCT.DYN.MARGIN.v1',
        type: 'number',
      });
    }),

    tx('persist:all', [
      post('persist:headers', async (ctx) => {
        ctx.out.headers = {
          entity_type: 'PRODUCT',
          entity_name: ctx.entity.payload.entity_name,
          smart_code: ctx.entity.smartCode, // e.g., HERA.SALON.PRODUCT.ENTITY.ITEM.v1
        };
      }),
      post('persist:relationships', async (ctx) => {
        const catId = ctx.entity.payload?.metadata?.relationships?.HAS_CATEGORY?.[0];
        if (catId) {
          ctx.out.relationships ??= [];
          ctx.out.relationships.push({
            type: 'HAS_CATEGORY',
            from: ctx.entity.id!, // set by adapter or pre-step
            to: catId,
            smartCode: 'HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1',
          });
        }
      }),
      post('persist:dynfields', async (ctx) => {
        // already staged via setDynamic -> adapter will map to ctx.out.dynamicFields
      }),
    ]),

    audit('audit:trail', (ctx) => {
      ctx.util.log('product_upserted', {
        org: ctx.orgId,
        entity: ctx.entity.id,
        margin: ctx.state.margin,
      });
    }),
  ],
};