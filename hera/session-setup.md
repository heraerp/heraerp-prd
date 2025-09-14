# HERA Session Setup Protocol

## When Starting a New Session with Claude

### 1. Initial Setup (Paste Once)
```
You are HERA's engineer.

NON-NEGOTIABLES
1) Sacred Six tables only:
   - core_organizations (WHO)
   - core_entities (WHAT)
   - core_dynamic_data (HOW)
   - core_relationships (WHY)
   - universal_transactions (WHEN, header)
   - universal_transaction_lines (DETAILS)
   No new tables. No schema migrations.
2) Smart Codes drive rules:
   HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{N}
   Versions are explicit. Rules come from smart codes or metadata.
3) Organization isolation:
   Every write must include organization_id. Never cross-org join without intent.
4) Universal Transaction Pattern:
   Every business activity = transaction header + lines; details live in *_lines.
5) AI-native fields:
   ai_confidence, ai_insights, metadata are first-class. Use them.
6) Guardrails:
   - Only create instances whose type exists in catalog (ENTITY_TYPE / TXN_TYPE / LINE_TYPE / REL_TYPE).
   - Use slugs for codes (lowercase_snake).
   - Enforce lifecycles from catalog metadata.

OUTPUT CONTRACT
When asked to design/implement a process, ALWAYS produce a "HERA Procedure Card" in YAML,
plus the smallest working SQL/TypeScript needed. Never propose schema changes.

Follow TEVL and output a Procedure Card + tests; do not deviate.
```

### 2. Reference Key Files
```
Key HERA files for reference:
- Golden Rules: /hera/golden-rules/sacred-six.md, smart-codes.md, guardrails.md
- Procedure Template: /hera/procedures/PROCEDURE_TEMPLATE.yml
- Example Procedures: 
  - /hera/procedures/HERA.RESTAURANT.BUNDLE.ORDER.v1.yml
  - /hera/procedures/HERA.SALES.SALES_ORDER.TO_INVOICE.v1.yml
- Checklists: /hera/checklists/anti-drift-checklist.md
- Catalog: /hera/catalog/example-org/catalog.json
```

### 3. For Continuing Work
```
Recall in 5 bullets: Sacred Six, Smart Codes, Universal Transaction pattern,
catalog enforcement, and TEVL loop. Then continue with [specific task].

Previous work:
- [Link to relevant procedure cards]
- [Current version numbers]
```

### 4. For Long Sessions (Reinforcement)
Every ~10 interactions, paste:
```
Quick check against anti-drift mantra:
✓ Six tables only, no schema changes
✓ Types resolved from catalog; slugs lower_snake
✓ Lifecycles & rule packs respected
✓ All writes include organization_id
✓ Transactions: header + lines, balanced if financial
✓ Emit audit JSON & tests
```

## Version Management Protocol

### When Updating a Procedure
1. **Check current version**
   ```bash
   ls /hera/procedures/HERA.SALES.ORDER.*.yml | sort -V
   ```

2. **Bump version in smart code**
   - v1 → v2 (never v1.0.0 or v1.1)
   - Update filename to match

3. **Document changes**
   ```yaml
   metadata:
     version_history:
       v1: "Initial implementation"
       v2: "Added partial shipment support"
   ```

4. **Update test cases**
   - Copy v1 tests to v2
   - Add new test cases for new functionality
   - Keep v1 tests for regression

### Example Version Bump
```bash
# Copy and update
cp procedures/HERA.SALES.ORDER.CREATE.v1.yml procedures/HERA.SALES.ORDER.CREATE.v2.yml
cp tests/procedures/HERA.SALES.ORDER.CREATE.v1.cases.json tests/procedures/HERA.SALES.ORDER.CREATE.v2.cases.json

# Edit v2 files with new functionality
# Update smart_code from v1 to v2
# Add version_history to metadata
```

## Persistence Checklist

Before ending a session:
- [ ] All procedure cards saved to `/hera/procedures/`
- [ ] All test cases saved to `/hera/tests/procedures/`
- [ ] Reusable patterns extracted to `/hera/snippets/`
- [ ] Catalog updates documented if needed
- [ ] Version numbers bumped for modifications
- [ ] README updated with new procedures

## Git Commit Pattern
```bash
git add hera/
git commit -m "feat(hera): Add HERA.SALES.ORDER.CREATE.v2 with partial shipment support"
git push
```