# HERA TEVL Methodology

## Teach-Execute-Verify-Log Loop

The TEVL loop ensures consistent, high-quality HERA procedure development:

### 1. **Teach (Recall)**
Summarize the relevant HERA rules in 5 bullets before starting any work:
- Sacred Six tables only (no schema changes)
- Smart Codes drive all business rules
- Organization_id isolation is mandatory
- Universal Transaction Pattern (header + lines)
- Output as HERA Procedure Card YAML

### 2. **Execute**
- Produce/extend the Procedure Card following the template
- Write minimal SQL/TypeScript implementation
- Use existing patterns and smart codes
- No schema migrations, only data operations

### 3. **Verify**
Return a checklist with:
- [ ] All writes include organization_id
- [ ] Smart codes follow naming convention
- [ ] Transactions balance (if financial)
- [ ] Entity/transaction types exist in catalog
- [ ] Test vectors with inputs → expected outputs

### 4. **Log**
- Save Procedure Card to `/procedures/HERA.{INDUSTRY}.{MODULE}.{PROC}.v{N}.yml`
- Save tests to `/tests/procedures/{smart_code}/`
- Include smart_code and version in all artifacts
- Update procedure registry if needed

## Usage
Always include this in prompts:
> "Follow TEVL and output a Procedure Card + tests; do not deviate."