# PWM Encryption Quick Start Guide

## 🚀 5-Minute Setup

### 1. Environment Setup (30 seconds)

Add to `.env.local`:
```bash
PWM_MASTER_KEY=dev-pwm-master-key-2024
ENCRYPTION_MASTER_KEY=dev-encryption-master-key-2024
```

### 2. Basic Usage (2 minutes)

```typescript
// Automatic encryption (recommended)
import { createSecureWealthEntity } from '@/lib/pwm/secure-api'

const account = await createSecureWealthEntity({
  entity_type: 'account',
  entity_name: 'Checking Account',
  sensitive_data: {
    account_number: '123456789',  // Encrypted automatically
    routing_number: '987654321'   // Encrypted automatically
  }
}, organizationId)
```

### 3. UI Access (1 minute)

Navigate to: `http://localhost:3000/pwm` → Click "Security" tab

### 4. Test It (1.5 minutes)

```typescript
// Create test entity
const test = await createSecureWealthEntity({
  entity_type: 'account',
  entity_name: 'Test Account',
  sensitive_data: {
    account_number: 'TEST123',
    ssn: '123-45-6789'
  }
}, 'test-org')

// Retrieve and verify
const retrieved = await getSecureWealthEntity(test.entity_id, 'test-org')
console.log(retrieved.sensitive_data) // Should show decrypted values
```

## 📋 Cheat Sheet

### Automatically Encrypted Fields

| Entity Fields | Transaction Fields |
|--------------|-------------------|
| account_number | confirmation_number |
| ssn | account_reference |
| tax_id | counterparty_details |
| routing_number | regulatory_notes |
| beneficiary_info | |
| private_notes | |
| advisor_contact | |
| bank_details | |

### Key Management Options

| Mode | Setup Required | Best For |
|------|---------------|----------|
| **Automatic** ✅ | None | 99% of users |
| **Simple Key** 🔑 | Click button | Extra security |
| **Advanced** 🛡️ | Generate RSA | Experts only |

### Common Operations

```typescript
// Encrypt any data
import { encryptData } from '@/lib/pwm/encryption'
const encrypted = encryptData('sensitive', organizationId)

// Decrypt data
import { decryptData } from '@/lib/pwm/encryption'
const decrypted = decryptData(encrypted, organizationId)

// Check encryption status
const response = await fetch('/api/v1/pwm/encrypt', {
  headers: { 'Organization-ID': organizationId }
})
const status = await response.json()
```

## 🔍 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Encryption failed" | Check .env.local has master keys |
| "Decryption failed" | Use same organizationId |
| "Key not found" | Restart dev server after adding .env |
| Slow performance | Use batch operations |

## 🎯 Best Practices Summary

1. **Always use automatic mode** unless you have specific requirements
2. **Never log sensitive data** after decryption
3. **Use organization-specific operations** for multi-tenant security
4. **Test encryption** in development before production
5. **Keep master keys secure** and never commit to git

## 📚 More Resources

- Full Documentation: `/docs/PWM_ENCRYPTION.md`
- API Reference: `/src/lib/pwm/encryption.ts`
- UI Components: `/src/components/pwm/EncryptionControls.tsx`
- Support: Create GitHub issue

**Remember**: Encryption is automatic - you don't need to do anything special for basic protection!