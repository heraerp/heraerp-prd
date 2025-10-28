# HERA Sacred Invariants - Auto-Learning Claude Autopilot

## 🛡️ Sacred Six Schema Rules (IMMUTABLE)
- Sacred Six schema is immutable (no new columns, no alters to core tables)
- Business fields MUST live in `core_dynamic_data`, NEVER as table columns
- All writes MUST go via `/api/v2` → `{hera_entities_crud_v2|hera_transactions_post_v2}`
- NEVER call `supabase.rpc()` directly from client code; SDK talks to `/api/v2` only

## 🔐 Security & Actor Rules (MANDATORY)
- Stamp actor on ALL writes; org MUST be resolved & enforced
- Smart Code regex MUST pass on entities/UT/UTL/relationships: `^HERA\.[A-Z0-9]{3,15}(?:\.[A-Z0-9_]{2,30}){3,8}\.v[0-9]+$`
- GL MUST balance per transaction currency; `.GL.` lines MUST have `line_data.side`
- Organization isolation MUST be enforced at all layers (Edge → RPC → RLS)

## 🧠 Learning Rules (AUTO-IMPROVEMENT)
- When fixing bugs, extract patterns and add to knowledge base
- Track success rate of different fix approaches
- Evolve prompts based on successful fixes
- Learn from both failures and successes
- Update bug patterns when new failure types are encountered

## 📊 Metrics & Observability (TRACKED)
- All fixes MUST be traced with request IDs
- Success/failure rates MUST be tracked per fix type
- Performance impact of fixes MUST be measured
- Knowledge base effectiveness MUST be monitored

## 🚨 Guardrails (NEVER BYPASS)
- Sacred Six immutability checks before ANY database change
- Actor coverage validation (≥95% required)
- GL balance validation (zero tolerance for imbalance)
- Smart Code pattern validation on all entities
- Organization boundary enforcement on all operations

## 🔄 Self-Improvement Loop
1. **Detect** → Identify failure patterns
2. **Learn** → Extract knowledge from successful fixes
3. **Adapt** → Update prompts and strategies
4. **Validate** → Test improved approaches
5. **Retain** → Store successful patterns for future use