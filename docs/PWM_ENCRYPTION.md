# PWM Encryption System Documentation

## Overview

HERA's Personal Wealth Management (PWM) module includes enterprise-grade encryption to protect sensitive financial data. The system provides flexible key management options ranging from fully automatic to customer-controlled encryption.

## Architecture

### Encryption Stack

```
┌─────────────────────────────┐
│    Customer Application     │
├─────────────────────────────┤
│  Optional Customer Key      │ ← Customer-managed layer (optional)
├─────────────────────────────┤
│  Platform Encryption        │ ← Always active (AES-256)
├─────────────────────────────┤
│  HERA Universal Storage     │ ← Encrypted data in core_dynamic_data
└─────────────────────────────┘
```

### Key Derivation

```
Organization ID + Master Key
         ↓
    PBKDF2-SHA512
    (100,000 iterations)
         ↓
  Unique 256-bit Key
         ↓
    AES-256 Encryption
```

## Protected Data Fields

The following sensitive fields are automatically encrypted:

### Entity Fields
- `account_number` - Bank account numbers
- `ssn` - Social Security Numbers
- `tax_id` - Tax identification numbers
- `routing_number` - Bank routing numbers
- `beneficiary_info` - Beneficiary details
- `private_notes` - Confidential notes
- `advisor_contact` - Financial advisor information
- `bank_details` - Banking information

### Transaction Fields
- `confirmation_number` - Transaction confirmations
- `account_reference` - Account references
- `counterparty_details` - Counterparty information
- `regulatory_notes` - Compliance notes

## Key Management Options

### 1. Automatic Mode (Default) ✅

**Best for**: Most users who want security without complexity

```typescript
// No configuration needed - encryption happens automatically
const entity = await createSecureWealthEntity({
  entity_type: 'account',
  entity_name: 'Investment Account',
  sensitive_data: {
    account_number: '123456789' // Automatically encrypted
  }
}, organizationId)
```

**Features**:
- Zero configuration required
- Platform manages all keys
- Automatic key rotation
- Recovery support available

### 2. Simple Customer Key 🔑

**Best for**: Users wanting additional control

```typescript
// Generate a customer key
const { key, mnemonic, fingerprint } = generateSimpleCustomerKey()

// Use customer key for encryption
const result = encryptWithCustomerKey(
  sensitiveData,
  organizationId,
  customerKey // Optional additional layer
)
```

**Features**:
- One-click key generation
- 12-word recovery phrase
- Downloadable backups
- Double encryption (customer + platform)

### 3. Advanced Mode 🛡️

**Best for**: Security experts and regulated industries

```typescript
// Generate RSA-4096 key pair
const keyBundle = generateCustomerKeyBundle(organizationId, passphrase)

// Export for secure storage
const backup = exportCustomerKeys(keyBundle, 'json')
```

**Features**:
- RSA-4096 asymmetric encryption
- Key fingerprints for verification
- Multiple export formats
- Full cryptographic control

## API Usage

### Encryption Endpoint

```bash
POST /api/v1/pwm/encrypt
Content-Type: application/json
Organization-ID: org-123

{
  "action": "encrypt",
  "data": "sensitive-data-string"
}

# Response
{
  "success": true,
  "encrypted_data": {
    "encryptedData": "...",
    "iv": "...",
    "tag": "...",
    "salt": "..."
  }
}
```

### Decryption Endpoint

```bash
POST /api/v1/pwm/encrypt
Content-Type: application/json
Organization-ID: org-123

{
  "action": "decrypt",
  "encryptedData": {
    "encryptedData": "...",
    "iv": "...",
    "tag": "...",
    "salt": "..."
  }
}

# Response
{
  "success": true,
  "decrypted_data": "original-sensitive-data"
}
```

### Validation Endpoint

```bash
GET /api/v1/pwm/encrypt
Organization-ID: org-123

# Response
{
  "success": true,
  "encryption_status": {
    "is_configured": true,
    "algorithm": "AES-256-GCM",
    "protected_fields": [...]
  }
}
```

## Implementation Guide

### 1. Basic Setup

```typescript
// Import encryption utilities
import { encryptData, decryptData } from '@/lib/pwm/encryption'

// Encrypt data
const encrypted = encryptData('sensitive-data', organizationId)

// Decrypt data
const decrypted = decryptData(encrypted, organizationId)
```

### 2. Secure Entity Management

```typescript
import { 
  createSecureWealthEntity,
  getSecureWealthEntity,
  updateSecureWealthEntity
} from '@/lib/pwm/secure-api'

// Create entity with encrypted fields
const account = await createSecureWealthEntity({
  entity_type: 'account',
  entity_name: 'Private Banking',
  sensitive_data: {
    account_number: '123456789',
    routing_number: '987654321',
    ssn: '123-45-6789'
  }
}, organizationId)

// Retrieve and auto-decrypt
const retrieved = await getSecureWealthEntity(
  account.entity_id,
  organizationId
)
console.log(retrieved.sensitive_data.account_number) // Decrypted
```

### 3. Customer Key Integration

```typescript
import { CustomerKeyManagement } from '@/components/pwm/CustomerKeyManagement'

// In your React component
<CustomerKeyManagement organizationId={organizationId} />

// This provides UI for:
// - Choosing encryption mode
// - Generating customer keys
// - Downloading backups
// - Managing key preferences
```

## Security Best Practices

### 1. Environment Configuration

```bash
# Production .env
PWM_MASTER_KEY=<use-strong-random-key>
ENCRYPTION_MASTER_KEY=<use-different-strong-key>

# Never commit keys to version control
# Use secure key management services (AWS KMS, Azure Key Vault, etc.)
```

### 2. Key Rotation

```typescript
// Implement regular key rotation
const rotateKeys = async (organizationId: string) => {
  // 1. Generate new keys
  // 2. Re-encrypt existing data
  // 3. Update key references
  // 4. Archive old keys securely
}
```

### 3. Access Control

```typescript
// Always verify organization access
const validateAccess = (userId: string, organizationId: string) => {
  // Verify user belongs to organization
  // Check user permissions
  // Log access for audit trail
}
```

### 4. Audit Logging

```typescript
import { logEncryptionAccess } from '@/lib/pwm/secure-api'

// Log all encryption operations
await logEncryptionAccess({
  timestamp: new Date().toISOString(),
  action: 'decrypt',
  entity_id: entityId,
  user_id: userId,
  organization_id: organizationId,
  field_names: ['account_number'],
  success: true
})
```

## Compliance Features

### GDPR Compliance
- ✅ Right to erasure (crypto-shredding)
- ✅ Data portability (export encrypted data)
- ✅ Privacy by design
- ✅ Audit trails

### Financial Regulations
- ✅ PCI DSS compliant encryption
- ✅ SOX audit trails
- ✅ FINRA data protection
- ✅ Basel III compliance ready

### Healthcare (Future)
- 🟡 HIPAA compliance ready
- 🟡 HITECH Act support
- 🟡 HL7 FHIR compatibility

## Troubleshooting

### Common Issues

1. **"Encryption failed" error**
   - Check master key configuration
   - Verify organization ID is valid
   - Ensure proper permissions

2. **"Decryption failed" error**
   - Verify using same organization ID
   - Check data integrity
   - Confirm key hasn't changed

3. **Performance concerns**
   - Use batch operations for multiple fields
   - Consider caching decrypted data in memory
   - Implement lazy decryption

### Debug Mode

```typescript
// Enable encryption debugging
const debug = process.env.NODE_ENV === 'development'

if (debug) {
  console.log('Encryption input:', data)
  console.log('Organization:', organizationId)
  console.log('Key fingerprint:', getKeyFingerprint())
}
```

## Migration Guide

### From Unencrypted to Encrypted

```typescript
// 1. Read existing unencrypted data
const entities = await getWealthEntities(organizationId)

// 2. Encrypt sensitive fields
for (const entity of entities) {
  const encrypted = await migrateToEncryption(entity)
  await updateEntity(encrypted)
}

// 3. Verify migration
const validation = await validateEncryptionMigration(organizationId)
```

## Performance Considerations

### Optimization Tips

1. **Batch Operations**
```typescript
// Instead of encrypting one by one
const encrypted = items.map(item => encryptData(item, orgId))

// Use batch encryption
const encrypted = await batchEncrypt(items, orgId)
```

2. **Selective Decryption**
```typescript
// Only decrypt fields when needed
const entity = await getEntity(id)
if (userNeedsToSeeSensitiveData) {
  entity.sensitive = await decryptFields(entity.encrypted_fields)
}
```

3. **Caching Strategy**
```typescript
// Cache decrypted data in memory (with TTL)
const cache = new Map()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const getCachedOrDecrypt = async (key: string) => {
  if (cache.has(key)) {
    return cache.get(key)
  }
  const decrypted = await decrypt(key)
  cache.set(key, decrypted)
  setTimeout(() => cache.delete(key), CACHE_TTL)
  return decrypted
}
```

## Future Enhancements

### Planned Features
- 🔄 Automatic key rotation scheduler
- 🔐 Hardware security module (HSM) support
- 🌍 Multi-region key management
- 📱 Mobile biometric key unlock
- 🤖 AI-powered anomaly detection
- 🔍 Searchable encryption support

## Support

For issues or questions:
- Check troubleshooting guide above
- Review security best practices
- Contact HERA support team
- Submit issues to GitHub repository

Remember: **Security is not optional** - when in doubt, use automatic encryption!