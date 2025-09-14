# HERA Procedure Review Checklist

## Before Starting (TEACH)
- [ ] Identified the business process clearly
- [ ] Confirmed all entity/transaction types exist in catalog
- [ ] Listed required permissions/roles
- [ ] Reviewed similar existing procedures
- [ ] Confirmed no schema changes needed

## Procedure Card (EXECUTE)
- [ ] Smart code follows format: `HERA.{INDUSTRY}.{MODULE}.{PROC}.v{N}`
- [ ] Intent is one clear sentence
- [ ] Scope explicitly lists in/out of scope
- [ ] All inputs marked as required/optional
- [ ] Input sources specified (entity/dynamic/payload)
- [ ] Output transactions have clear rules
- [ ] Happy path steps are atomic and verifiable
- [ ] Error codes are specific and actionable

## Implementation (EXECUTE)
- [ ] Uses only Sacred Six tables
- [ ] All queries include organization_id
- [ ] Smart codes on all entities/transactions
- [ ] Transactions follow header + lines pattern
- [ ] Financial transactions balance
- [ ] Status managed via relationships
- [ ] Catalog types validated before use

## Testing (VERIFY)
- [ ] Test vectors cover happy path
- [ ] Test vectors cover each error case
- [ ] Input → output mappings documented
- [ ] Organization isolation tested
- [ ] Permissions tested
- [ ] Balancing tested (if financial)

## Documentation (LOG)
- [ ] Procedure card saved to `/procedures/{smart_code}.yml`
- [ ] Test cases saved to `/tests/procedures/{smart_code}.cases.json`
- [ ] SQL snippets extracted to `/snippets/sql/`
- [ ] TypeScript snippets extracted to `/snippets/typescript/`
- [ ] Catalog updates documented if needed

## Final Review
- [ ] No schema changes introduced
- [ ] Reusable patterns identified
- [ ] Performance considerations noted
- [ ] Monitoring/observability included
- [ ] Ready for production use