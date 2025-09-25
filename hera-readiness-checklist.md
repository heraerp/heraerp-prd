# 🧾 HERA DNA Readiness Checklist

Generated: 2025-09-24T10:50:10.295215Z

## 1. Kernel (non-negotiable)
- [ ] **Smart Codes**
  - All entities, transactions, rules, playbooks, procedures labeled.
  - Format enforced: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V#`.
- [ ] **Universal Tables (Sacred Six)**
  - [ ] core_organizations
  - [ ] core_entities
  - [ ] core_dynamic_data
  - [ ] core_relationships
  - [ ] universal_transactions
  - [ ] universal_transaction_lines
- [ ] **Guardrail**
  - [ ] Blocks schema drift (TABLE-ONLY-6).
  - [ ] Enforces org isolation (ORG-FILTER-REQUIRED).
  - [ ] Validates smart codes (SMARTCODE-PRESENT).
  - [ ] Requires txn headers/lines (TXN-HEADER, TXN-LINE).
  - [ ] GL-BALANCED invariant on posting.
- [ ] **UCR (Universal Configuration Rules)**
  - [ ] Posting rules (cash, revenue, VAT, etc.).
  - [ ] Allowed statuses (appointment: booked, confirmed, checked_in, completed, canceled, no_show).
  - [ ] Commission/tax rules (later, optional).
- [ ] **Playbooks**
  - [ ] Appointment lifecycle: create → update → cancel/no_show → complete.
  - [ ] Error handling: rollback/notify.
- [ ] **DNA**
  - [ ] Finance DNA (JE auto-posting, GL balance check).
  - [ ] Fiscal DNA (periods, close, consolidation).
  - [ ] AI DNA (ai_confidence, ai_insights in all tables).
  - [ ] Reporting DNA (report recipes, KPIs, dashboard blocks).
- [ ] **Procedures**
  - [ ] Registered in core_entities.
  - [ ] Implemented in Postgres (SECURITY DEFINER).
  - [ ] Only write to Sacred Six.

## 2. Supporting Layers (to be production-ready)
- [ ] **Universal API (v2)**
  - [ ] /api/v2/universal/txn-emit
  - [ ] /api/v2/universal/entity-upsert
  - [ ] /api/v2/universal/relationship-upsert
- [ ] **Lifecycle / Status Model**
  - [ ] Appointment events (CREATE, UPDATE, CANCEL, NOSHOW, CHECKIN).
  - [ ] Idempotency via appointment_id.
- [ ] **RBAC & Org Security**
  - [ ] Row-level security (RLS) active.
  - [ ] Role-based permissions enforced.
  - [ ] Audit logging who/when did what.
- [ ] **Reference Data Packs**
  - [ ] Chart of accounts.
  - [ ] VAT/tax codes.
  - [ ] Currency list.
  - [ ] Calendar/period seeds.
- [ ] **Observability & Ops**
  - [ ] Logs & metrics.
  - [ ] GL balance monitor.
  - [ ] CI guard (schema drift, smartcode lint, JSON schema validation).
