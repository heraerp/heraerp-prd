# HERA Retail Laptop Module

This module extends the universal Retail core with laptop-specific
presets and Finance DNA posting rules.

**Contains**
- `seeds/catalog.json` – brand/category/SKU sample data
- `seeds/pricing.json` – price list bindings
- `seeds/sample-po.json` – purchase order example
- `seeds/sample-grn.json` – goods receipt example
- Compatible with `scripts/bootstrap-retail.ts`

**Run bootstrap**
```bash
HERA_TOKEN='<access_token>' \
HERA_ORG_ID='<organization_uuid>' \
LOCAL_API=http://localhost:3000/api/v2 \
npm run bootstrap:retail
```

The script will emit a complete retail workflow:
PO → GRN → POS invoice → ledger validation.

---

✅ Result:
Your repo now has self-documented, reproducible setup instructions directly embedded in the script header and module readme—perfect for onboarding and automated CI bootstrap.
