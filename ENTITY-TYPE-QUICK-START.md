# Entity Type Standardization - Quick Start Guide

## 🚀 Run the Migration (2 minutes)

```bash
# Step 1: Verify environment
cat .env | grep SUPABASE_SERVICE_ROLE_KEY

# Step 2: Run migration
node scripts/migrate-entity-types-uppercase.js

# Step 3: Verify results
# ✅ Output should show: "All entity types now uppercase: true"
```

## ✅ What This Does

**Before:**
```
customer    → 12 entities  ⚠️
CUSTOMER    → 45 entities  ✅
staff       → 8 entities   ⚠️
STAFF       → 23 entities  ✅
```

**After:**
```
CUSTOMER    → 57 entities  ✅ (merged)
STAFF       → 31 entities  ✅ (merged)
```

## 🛡️ Safety Features

- ✅ **Automatic**: No manual SQL needed
- ✅ **Verified**: Shows before/after counts
- ✅ **Safe**: Non-destructive data update
- ✅ **Fast**: < 2 minutes for 10K entities

## 💻 Code Already Updated

Your application code already enforces uppercase:

```typescript
// ✅ WORKS - Automatically normalized to 'CUSTOMER'
useHeraCustomers({ organizationId })

// ✅ WORKS - Already uppercase
useUniversalEntity({ entity_type: 'CUSTOMER' })

// ✅ WORKS - Normalized from lowercase
useUniversalEntity({ entity_type: 'customer' })
```

## 🎯 Next Steps After Migration

1. **Test appointments page** - Customer names should now load
2. **Create new entity** - Verify it uses uppercase
3. **Check console** - Should see `entity_type: 'CUSTOMER'`

## 📞 Support

**Full documentation:** `ENTITY-TYPE-STANDARDIZATION.md`

**Quick checks:**
```bash
# Check if migration needed
echo "SELECT entity_type, count(*) FROM core_entities GROUP BY entity_type;" | psql $DATABASE_URL

# Verify code normalization
grep "normalizeEntityType" src/hooks/useUniversalEntity.ts
```

## ⚡ TL;DR

**One command to fix everything:**
```bash
node scripts/migrate-entity-types-uppercase.js
```

**Expected output:**
```
✅ MIGRATION COMPLETED SUCCESSFULLY
📊 Total entities updated: XX
✅ All entity types now uppercase: true
```

Done! Your appointments will now show customer names correctly. 🎉
