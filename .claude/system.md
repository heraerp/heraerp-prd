# HERA Platform Invariants - Multi-Tenant System Laws

You are implementing a multi-tenant HERA module (/retail/customers).
Platform invariants you MUST obey:

## Sacred Six Architecture (No Bespoke Business Tables)

**ONLY these tables exist**: `core_entities`, `core_dynamic_data`, `core_relationships`, `core_organizations`, `universal_transactions`, `universal_transaction_lines`. 

All rows carry `organization_id` and audit stamps `created_by`/`updated_by`. Business attributes go to `core_dynamic_data`; relationships go to `core_relationships`. Never add custom columns to the Six.

## Security Flow (Actor-Everywhere Pattern)

JWT → `resolve_user_identity_v1` → org context (Header > JWT claim > default) → membership check → Guardrails → RPC write → RLS isolation → Rules Engine trace. 

All writes must stamp actor via `p_actor_user_id`.

## Guardrails v2.0 (Runtime Enforcement)

- **ORG-FILTER-REQUIRED**: Every payload must include matching `organization_id`
- **SMARTCODE-REQUIRED**: Global regex validation on all entities and dynamic fields
- **GL-BALANCED-PER-CURRENCY**: For `.GL.` lines in financial transactions

## Single Shared UI Route (No Per-Tenant Pages)

Path: `/retail/customers` serves all organizations. Never replicate pages per tenant. 

Per-tenant customization is data-driven:
- **Fields/validation/layout**: `core_dynamic_data` + app YAML metadata
- **Branding/features**: `core_organizations.settings` (JSON)
- **Links/hierarchies**: `core_relationships`
- **Posting/finance policies**: JSON bundles

## API v2 Gateway Only (No Direct DB Access)

All writes go through API v2 Edge gateway → `hera_entities_crud_v2` / `hera_transactions_post_v2`. Never call DB directly from UI.

Headers required:
```
Authorization: Bearer <jwt_token>
X-Organization-Id: <org_uuid>
Content-Type: application/json
```

## Output Requirements

Your implementation must include tests that verify:
- **RLS isolation**: Cross-org access attempts return 403
- **Actor stamping**: `created_by`/`updated_by` present on ≥95% of Sacred Six writes
- **Smart Code compliance**: HERA DNA regex validation on all entities and fields
- **GL balance**: When applicable for financial operations

## Critical References

- **Sacred Six schema**: `/docs/schema/hera-sacred-six-schema.yaml`
- **Security flow**: Actor + membership checks with defense-in-depth
- **Single shared app**: Universal route + data-driven customization
- **Finance guardrail**: GL balance enforcement for `.GL.` smart codes

## Forbidden Patterns

❌ Schema changes or new tables
❌ Per-tenant route duplication  
❌ Direct database access from UI
❌ Missing Smart Codes on entities or dynamic fields
❌ Bypassing API v2 security gateway
❌ Cross-org data leakage via missing `organization_id` filters