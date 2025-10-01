'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEntities,
  getDynamicData,
  setDynamicDataBatch,
  upsertEntity,
  deleteEntity,
  DynamicFieldInput,
} from '@/lib/universal-api-v2-client';
import { useSalonContext } from '@/app/salon/SalonProvider';

export interface Product {
  id: string;
  entity_name: string;
  entity_code: string | null;
  smart_code: string;
  status: 'active' | 'archived';
  qty_on_hand: number;
  price: number | null;
  currency: string | null; // null if no price
  category: string | null;
  description: string | null;
  requires_inventory: boolean;
  created_at: string | null;
  updated_at: string | null;
}

const ENT_SMART = 'HERA.SALON.PROD.ENT.RETAIL.V1';
const DYN_SMART = 'HERA.SALON.PROD.DYN.V1';

const UNIVERSAL_BASE = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_UNIVERSAL_API_BASE_URL ?? 'http://localhost:3000';

export function useHeraProductsV2() {
  const { organizationId } = useSalonContext();
  const qc = useQueryClient();

  // READ: products + dynamic fields
  const productsQuery = useQuery<Product[]>({
    queryKey: ['hera', 'products', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      // 1) list product entities
      const entities = await getEntities(UNIVERSAL_BASE, {
        p_organization_id: organizationId!,
        p_entity_type: 'product',
        p_status: 'active',
      });

      // 2) for each, fetch dynamic data (simple approach first)
      const products: Product[] = [];
      for (const entity of entities) {
        if (!entity?.id || !entity?.smart_code || !entity?.entity_name) {
          console.warn('Invalid product entity shape, skipping:', entity);
          continue;
        }

        const dynRows = await getDynamicData(UNIVERSAL_BASE, {
          p_organization_id: organizationId!,
          p_entity_id: entity.id,
        });

        // normalize dynamic fields to a map
        const dyn: Record<string, any> = {};
        for (const row of dynRows) {
          const k = row.field_name;
          if (!k) continue;
          if (row.field_type === 'number') {
            dyn[k] = row.field_value_number ?? null;
          } else if (row.field_type === 'boolean') {
            dyn[k] = row.field_value_boolean ?? false;
          } else {
            dyn[k] = row.field_value ?? null;
          }
        }

        const hasPrice = dyn.price !== undefined && dyn.price !== null;
        const hasCurrency = dyn.currency !== undefined && dyn.currency !== null;

        // If price exists but currency missing — skip (data quality)
        if (hasPrice && !hasCurrency) {
          console.warn('Product has price but no currency, skipping:', entity.id);
          continue;
        }

        products.push({
          id: entity.id,
          entity_name: entity.entity_name,
          entity_code: entity.entity_code ?? null,
          smart_code: entity.smart_code,
          status: entity.status === 'archived' ? 'archived' : 'active',
          qty_on_hand: Number.isFinite(dyn.qty_on_hand) ? Number(dyn.qty_on_hand) : 0,
          price: hasPrice ? Number(dyn.price) : null,
          currency: hasPrice ? (dyn.currency as string | null) : null,
          category: (dyn.category as string | null) ?? null,
          description: (dyn.description as string | null) ?? entity.entity_description ?? null,
          requires_inventory: dyn.requires_inventory === true,
          created_at: entity.created_at ?? null,
          updated_at: entity.updated_at ?? null,
        });
      }

      return products;
    },
  });

  // CREATE
  const createProduct = useMutation({
    mutationFn: async (input: {
      name: string;
      code?: string | null;
      description?: string | null;
      price?: number | null;
      currency?: string | null;
      qty_on_hand?: number; // default 0
      category?: string | null;
      requires_inventory?: boolean;
    }) => {
      // 1) create core entity
      const up = await upsertEntity(UNIVERSAL_BASE, {
        p_organization_id: organizationId!,
        p_entity_type: 'product',
        p_entity_name: input.name,
        p_entity_code: input.code ?? null,
        p_entity_description: input.description ?? null,
        p_smart_code: ENT_SMART,
      });

      const entity = up.data;
      if (!entity?.id) throw new Error('Entity upsert returned no id');

      // 2) set dynamic fields
      const fields: DynamicFieldInput[] = [
        { field_name: 'qty_on_hand', field_type: 'number', field_value_number: input.qty_on_hand ?? 0 },
        { field_name: 'category', field_type: 'text', field_value: input.category ?? null },
        { field_name: 'requires_inventory', field_type: 'boolean', field_value_boolean: !!input.requires_inventory },
        { field_name: 'description', field_type: 'text', field_value: input.description ?? null },
      ];

      if (input.price !== undefined && input.price !== null) {
        fields.push({ field_name: 'price', field_type: 'number', field_value_number: input.price });
        fields.push({ field_name: 'currency', field_type: 'text', field_value: input.currency ?? 'AED' });
      }

      await setDynamicDataBatch(UNIVERSAL_BASE, {
        p_organization_id: organizationId!,
        p_entity_id: entity.id,
        p_smart_code: DYN_SMART,
        p_fields: fields,
      });

      return entity.id as string;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hera', 'products', organizationId] }),
  });

  // UPDATE (core + dynamic)
  const updateProduct = useMutation({
    mutationFn: async (input: {
      id: string;
      name?: string;
      code?: string | null;
      description?: string | null;
      price?: number | null;
      currency?: string | null;
      qty_on_hand?: number;
      category?: string | null;
      requires_inventory?: boolean;
    }) => {
      // 1) core update (only if provided)
      if (input.name || input.code !== undefined || input.description !== undefined) {
        await upsertEntity(UNIVERSAL_BASE, {
          p_organization_id: organizationId!,
          p_entity_type: 'product',
          p_entity_id: input.id,
          p_entity_name: input.name ?? '', // Zod enforces min(1); send old value if you store it in UI form
          p_entity_code: input.code ?? null,
          p_entity_description: input.description ?? null,
          p_smart_code: ENT_SMART,
        });
      }

      // 2) dynamic fields (only send what changed)
      const fields: DynamicFieldInput[] = [];
      if (input.qty_on_hand !== undefined)
        fields.push({ field_name: 'qty_on_hand', field_type: 'number', field_value_number: input.qty_on_hand });
      if (input.category !== undefined)
        fields.push({ field_name: 'category', field_type: 'text', field_value: input.category });
      if (input.requires_inventory !== undefined)
        fields.push({ field_name: 'requires_inventory', field_type: 'boolean', field_value_boolean: !!input.requires_inventory });
      if (input.description !== undefined)
        fields.push({ field_name: 'description', field_type: 'text', field_value: input.description });

      if (input.price !== undefined) {
        fields.push({
          field_name: 'price',
          field_type: 'number',
          field_value_number: input.price === null ? null : input.price,
        });
        // keep currency consistent: if price is null, null currency too
        fields.push({
          field_name: 'currency',
          field_type: 'text',
          field_value: input.price === null ? null : (input.currency ?? 'AED'),
        });
      } else if (input.currency !== undefined) {
        // currency changed without price change -> still set explicitly
        fields.push({ field_name: 'currency', field_type: 'text', field_value: input.currency });
      }

      if (fields.length > 0) {
        await setDynamicDataBatch(UNIVERSAL_BASE, {
          p_organization_id: organizationId!,
          p_entity_id: input.id,
          p_smart_code: DYN_SMART,
          p_fields: fields,
        });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hera', 'products', organizationId] }),
  });

  // DELETE
  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      await deleteEntity(UNIVERSAL_BASE, {
        p_organization_id: organizationId!,
        p_entity_id: id,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hera', 'products', organizationId] }),
  });

  return {
    productsQuery,
    createProduct,
    updateProduct,
    deleteProduct,
  };
}