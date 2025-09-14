# HERA Smart Code System

Smart Codes provide intelligent business context to every data point.

## Format
```
HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v{VERSION}
```

## Components
- **HERA**: Always starts with HERA
- **INDUSTRY**: REST, HLTH, MFG, FIN, SALES, HR, EDU, etc.
- **MODULE**: Functional area within industry
- **TYPE**: ENT (entity), TXN (transaction), REL (relationship), DYN (dynamic), PROC (procedure), LINE (line item)
- **SUBTYPE**: Specific business object or action
- **VERSION**: v1, v2, v3 (explicit integers only)

## Examples
```
HERA.REST.POS.TXN.SALE.v1          # Restaurant point-of-sale transaction
HERA.HLTH.PAT.ENT.PROFILE.v1       # Healthcare patient entity
HERA.MFG.PROD.REL.BOM.v1           # Manufacturing BOM relationship
HERA.FIN.GL.DYN.BALANCE.v1         # GL account balance dynamic data
HERA.SALES.ORDER.PROC.INVOICE.v1   # Sales order to invoice procedure
HERA.HR.EMP.ENT.STAFF.v1           # HR employee entity
```

## What Smart Codes Drive
1. **Business Rules**: Validation, calculations, workflows
2. **UI Selection**: Which components to render
3. **API Routing**: How to process requests
4. **GL Posting**: Automatic account determination
5. **Reporting**: Categorization and grouping
6. **AI Training**: Classification for ML models

## Validation Rules
- Must match regex: `^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v[0-9]+$`
- Industry and module codes should be 2-4 characters
- Type codes are fixed (ENT, TXN, REL, DYN, PROC, LINE)
- Version numbers are sequential integers

## Version Management
- Start with v1 for new procedures
- Increment to v2, v3 when logic changes
- Never use decimal versions (no v1.1 or v2.0.1)
- Keep old versions for compatibility