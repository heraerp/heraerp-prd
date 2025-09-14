# HERA Knowledge Base

## Purpose
This directory contains the persistent HERA engineering knowledge base, ensuring consistent application of HERA principles across all development sessions.

## Directory Structure
```
/hera/
  /golden-rules/         # Immutable HERA principles
    sacred-six.md        # The 6 sacred tables
    smart-codes.md       # Smart code system and format
    guardrails.md        # Core validation rules
    
  /catalog/              # Organization-specific type definitions
    {org_id}/           
      catalog.json       # Entity, transaction, relationship, line types
      
  /procedures/           # YAML Procedure Cards (authoritative)
    HERA.{INDUSTRY}.{MODULE}.{PROC}.v{N}.yml
    
  /tests/               
    procedures/          # Test cases for each procedure
      {smart_code}.cases.json
      
  /snippets/            
    sql/                # Reusable SQL patterns
    typescript/         # Reusable TypeScript patterns
    
  /checklists/          
    procedure_review.md  # Comprehensive review checklist
    anti-drift-checklist.md  # Pre-write validation
    pre-write-mantra.md  # 6-point mantra
    
  /prompts/             
    reusable-prompts.md  # Copy-paste prompts
    quick-reference.md   # Essential patterns

## Session Setup Guide

### 1. Start Every Session
```
Recall in 5 bullets: Sacred Six, Smart Codes, Universal Transaction pattern,
catalog enforcement, and TEVL loop. Then continue.
```

### 2. Reference Key Files
- System prompt: `/hera/golden-rules/`
- Current procedures: `/hera/procedures/`
- Catalog definitions: `/hera/catalog/{org_id}/catalog.json`
- Test cases: `/hera/tests/procedures/`

### 3. For Long Sessions
- Start with recall anchor
- Link relevant Procedure Cards
- Reference anti-drift checklist periodically

### 4. Version Management
When updating a procedure:
- Bump version: v1 → v2
- Update filename: `HERA.SALES.ORDER.CREATE.v1.yml` → `HERA.SALES.ORDER.CREATE.v2.yml`
- Keep old version for reference
- Document changes in procedure metadata

## Core Principles (Never Forget)

### TEVL Loop
1. **Teach**: Summarize relevant HERA rules (5 bullets)
2. **Execute**: Create Procedure Card + minimal SQL/TS
3. **Verify**: Checklist + test vectors
4. **Log**: Save to proper locations

### Anti-Drift Mantra
```
✓ Six tables only, no schema changes
✓ Types resolved from catalog; slugs lower_snake
✓ Lifecycles & rule packs respected
✓ All writes include organization_id
✓ Transactions: header + lines, balanced if financial
✓ Emit audit JSON & tests
```

## Quick Commands

### Create New Procedure
```bash
# Copy template
cp procedures/PROCEDURE_TEMPLATE.yml procedures/HERA.{INDUSTRY}.{MODULE}.{PROC}.v1.yml

# Create test file
echo '{"smart_code": "HERA.{INDUSTRY}.{MODULE}.{PROC}.v1", "test_cases": []}' > tests/procedures/HERA.{INDUSTRY}.{MODULE}.{PROC}.v1.cases.json
```

### Validate Procedure
```bash
# Check against guardrails
grep -E "organization_id|smart_code|entity_type|transaction_type" procedures/*.yml

# Verify test coverage
ls procedures/*.yml | xargs -I {} basename {} .yml | sort > /tmp/procs.txt
ls tests/procedures/*.cases.json | xargs -I {} basename {} .cases.json | sort > /tmp/tests.txt
diff /tmp/procs.txt /tmp/tests.txt
```

## Commit Guidelines
- Commit all changes under `/hera/`
- Use meaningful commit messages referencing smart codes
- Tag major procedure versions
- Never modify golden rules without team consensus

## Additional Resources
- CLAUDE.md - Overall project guidelines
- TEVL Methodology - `/docs/HERA-TEVL-METHODOLOGY.md`
- Universal API - `/src/lib/universal-api.ts`
- MCP Tools - `/mcp-server/`