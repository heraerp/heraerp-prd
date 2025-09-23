-- Generic, multi-app version for entities with stock on hand
create or replace function public.fn_entities_with_soh(
  org_id uuid,
  -- choose one or both filters; both can be used together
  entity_type_filter text default 'product',         -- e.g. 'product' (uses CE.index idx_entities_org_type)
  smart_prefixes text[] default null,                -- e.g. array['HERA.SPA.PRODUCT.%','HERA.RETAIL.PRODUCT.%']

  -- optional branch scoping (no guesses about relationship names; you pass it)
  branch_entity_id uuid default null,
  branch_relationship_type text default null,

  limit_rows int default 500,
  offset_rows int default 0
)
returns table (
  id uuid,
  entity_code text,
  entity_name text,
  entity_type text,
  status text,
  smart_code text,
  qty_on_hand numeric,
  attributes jsonb
)
language sql
as $$
with base as (
  select e.id, e.entity_code, e.entity_name, e.entity_type, e.status, e.smart_code
  from public.core_entities e
  where e.organization_id = org_id
    and (entity_type_filter is null or e.entity_type = entity_type_filter)
    and (smart_prefixes is null or e.smart_code ilike any(smart_prefixes))
    and (
      branch_entity_id is null
      or exists (
          select 1
          from public.core_relationships cr
          where cr.organization_id = org_id
            and cr.from_entity_id = e.id
            and cr.to_entity_id   = branch_entity_id
            and (branch_relationship_type is null or cr.relationship_type = branch_relationship_type)
            and coalesce(cr.is_active, true) = true
      )
    )
),
soh as (
  select
    utl.entity_id,
    sum(
      case
        when ut.transaction_type in ('sale', 'stock_adjustment_out', 'stock_transfer_out', 'damage', 'loss')
          then -abs(coalesce(utl.quantity,0))
        when ut.transaction_type in ('goods_receipt', 'stock_adjustment_in', 'stock_transfer_in', 'purchase_return')
          then abs(coalesce(utl.quantity,0))
        else coalesce(utl.quantity,0)
      end
    ) as qty_on_hand
  from public.universal_transaction_lines utl
  join public.universal_transactions ut on ut.id = utl.transaction_id
  where utl.organization_id = org_id
    and ut.organization_id  = org_id
    and utl.entity_id in (select id from base)
    -- Only count finalized transactions
    and ut.status not in ('draft', 'cancelled', 'voided')
  group by utl.entity_id
),
dd as (
  -- attributes from core_dynamic_data, using typed columns
  select
    d.entity_id,
    jsonb_object_agg(
      d.field_name,
      case
        when d.field_value_json   is not null then d.field_value_json
        when d.field_value_number is not null then to_jsonb(d.field_value_number)
        when d.field_value_text   is not null and d.field_value_text ~ '^-?[0-9]+(\.[0-9]+)?$'
             then to_jsonb((d.field_value_text)::numeric)
        when d.field_value_boolean is not null then to_jsonb(d.field_value_boolean)
        when d.field_value_date is not null then to_jsonb(d.field_value_date)
        else to_jsonb(d.field_value_text)
      end
    ) as attributes
  from public.core_dynamic_data d
  where d.organization_id = org_id
    and d.entity_id in (select id from base)
  group by d.entity_id
)
select
  b.id, b.entity_code, b.entity_name, b.entity_type, b.status, b.smart_code,
  coalesce(s.qty_on_hand, 0) as qty_on_hand,
  coalesce(dd.attributes, '{}'::jsonb) as attributes
from base b
left join soh s on s.entity_id = b.id
left join dd  on dd.entity_id  = b.id
order by b.entity_name
limit limit_rows
offset offset_rows;
$$;

-- Keep current function as a wrapper (no breaking changes)
create or replace function public.fn_products_with_soh(org_id uuid)
returns table (
  id uuid,
  entity_code text,
  entity_name text,
  status text,
  smart_code text,
  qty_on_hand numeric,
  attributes jsonb
)
language sql
as $$
  select id, entity_code, entity_name, status, smart_code, qty_on_hand, attributes
  from public.fn_entities_with_soh(
    org_id           => org_id,
    entity_type_filter => 'product',
    smart_prefixes     => array['HERA.SALON.PRODUCT.%'],
    branch_entity_id   => null,
    branch_relationship_type => null,
    limit_rows => 500,
    offset_rows => 0
  );
$$;

-- Helper function for smart code negative transaction detection
create or replace function public.smart_is_negative_txn_static(smart_code text)
returns boolean
language sql
immutable
as $$
  select case
    when smart_code ilike '%.SALE.%' then true
    when smart_code ilike '%.DAMAGE.%' then true
    when smart_code ilike '%.LOSS.%' then true
    when smart_code ilike '%.ADJUSTMENT.OUT.%' then true
    when smart_code ilike '%.TRANSFER.OUT.%' then true
    when smart_code ilike '%.RETURN.TO.VENDOR.%' then true
    else false
  end;
$$;