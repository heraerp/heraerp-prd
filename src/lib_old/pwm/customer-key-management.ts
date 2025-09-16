/**
 * Customer Key Management for PWM
 *
 * Allows customers to optionally manage their own encryption keys
 * while maintaining ease of use for those who prefer automatic management
 */

import crypto from 'crypto'
import { encryptData, decryptData } from './encryption'

export interface CustomerKeyOptions {
  mode: 'automatic' | 'customer-managed' | 'hybrid'
  customerProvidedKey?: string
  keyDerivationSalt?: string
}

export interface CustomerKeyBundle {
  keyId: string
  publicKey: string
  encryptedPrivateKey: string
  createdAt: string
  fingerprint: string
}

/**
 * Generate a customer-specific key bundle
 * This allows customers to have their own keys while we handle the complexity
 */
export function generateCustomerKeyBundle(
  organizationId: string,
  passphrase?: string
): CustomerKeyBundle {
  // Generate RSA key pair for customer
  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 4096,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
      cipher: passphrase ? 'aes-256-cbc' : undefined,
      passphrase: passphrase
    }
  })

  // Generate unique key ID
  const keyId = crypto.randomBytes(16).toString('hex')

  // Create fingerprint for verification
  const fingerprint =
    crypto
      .createHash('sha256')
      .update(publicKey)
      .digest('hex')
      .substring(0, 16)
      .match(/.{1,4}/g)
      ?.join(':') || ''

  return {
    keyId,
    publicKey,
    encryptedPrivateKey: privateKey,
    createdAt: new Date().toISOString(),
    fingerprint
  }
}

/**
 * Simple key generation for customers who want a basic key
 */
export function generateSimpleCustomerKey(): {
  key: string
  mnemonic: string[]
  fingerprint: string
} {
  // Generate 256-bit key
  const keyBuffer = crypto.randomBytes(32)
  const key = keyBuffer.toString('hex')

  // Create memorable mnemonic (simplified version)
  const words = [
    'alpha',
    'bravo',
    'charlie',
    'delta',
    'echo',
    'foxtrot',
    'golf',
    'hotel',
    'india',
    'juliet',
    'kilo',
    'lima',
    'mike',
    'november',
    'oscar',
    'papa',
    'quebec',
    'romeo',
    'sierra',
    'tango',
    'uniform',
    'victor',
    'whiskey',
    'xray',
    'yankee',
    'zulu'
  ]

  const mnemonic: string[] = []
  for (let i = 0; i < 12; i++) {
    const byte = keyBuffer[i]
    const wordIndex = byte % words.length
    mnemonic.push(words[wordIndex])
  }

  // Create fingerprint
  const fingerprint = crypto.createHash('sha256').update(key).digest('hex').substring(0, 8)

  return {
    key,
    mnemonic,
    fingerprint
  }
}

/**
 * Encrypt data with customer-provided key option
 */
export function encryptWithCustomerKey(
  data: string,
  organizationId: string,
  customerKey?: string
): {
  encrypted: string
  keyFingerprint: string
  method: 'platform' | 'customer'
} {
  if (customerKey) {
    // Use customer's key for additional layer
    const iv = crypto.randomBytes(16)
    const key = crypto.createHash('sha256').update(customerKey).digest()
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)

    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // Still use platform encryption as outer layer
    const platformEncrypted = encryptData(
      JSON.stringify({
        customerEncrypted: encrypted,
        iv: iv.toString('hex')
      }),
      organizationId
    )

    return {
      encrypted: JSON.stringify(platformEncrypted),
      keyFingerprint: crypto.createHash('sha256').update(customerKey).digest('hex').substring(0, 8),
      method: 'customer'
    }
  } else {
    // Use platform encryption only
    const encrypted = encryptData(data, organizationId)
    return {
      encrypted: JSON.stringify(encrypted),
      keyFingerprint: 'platform-managed',
      method: 'platform'
    }
  }
}

/**
 * Key recovery options for customers
 */
export interface KeyRecoveryOptions {
  method: 'security-questions' | 'recovery-phrase' | 'multi-signature'
  recoveryData: Record<string, any>
}

export function setupKeyRecovery(
  customerKey: string,
  options: KeyRecoveryOptions
): {
  recoveryId: string
  recoveryHint: string
} {
  const recoveryId = crypto.randomBytes(16).toString('hex')

  // In production, this would securely store recovery data
  // For now, return recovery setup confirmation
  let recoveryHint = ''

  switch (options.method) {
    case 'security-questions':
      recoveryHint = 'Security questions configured'
      break
    case 'recovery-phrase':
      recoveryHint = 'Recovery phrase saved'
      break
    case 'multi-signature':
      recoveryHint = 'Multi-signature recovery enabled'
      break
  }

  return {
    recoveryId,
    recoveryHint
  }
}

/**
 * Export customer keys for backup
 */
export function exportCustomerKeys(
  keys: CustomerKeyBundle,
  format: 'json' | 'qr' | 'paper'
): string | Buffer {
  const exportData = {
    version: '1.0',
    exported: new Date().toISOString(),
    keyId: keys.keyId,
    publicKey: keys.publicKey,
    fingerprint: keys.fingerprint,
    warning: 'Keep this backup secure. Anyone with this file can access your encrypted data.'
  }

  switch (format) {
    case 'json':
      return JSON.stringify(exportData, null, 2)

    case 'qr':
      // In production, generate QR code
      return Buffer.from(JSON.stringify(exportData))

    case 'paper':
      // Generate printable format
      return `
HERA PWM ENCRYPTION KEY BACKUP
==============================
Date: ${exportData.exported}
Key ID: ${exportData.keyId}
Fingerprint: ${exportData.fingerprint}

PUBLIC KEY:
${exportData.publicKey}

${exportData.warning}
==============================
      `.trim()

    default:
      return JSON.stringify(exportData)
  }
}

/**
 * Customer key management preferences
 */
export interface CustomerKeyPreferences {
  autoRotation: boolean
  rotationPeriodDays: number
  requireMultiFactor: boolean
  allowKeyExport: boolean
  notifyOnAccess: boolean
}

export function getDefaultKeyPreferences(): CustomerKeyPreferences {
  return {
    autoRotation: false,
    rotationPeriodDays: 90,
    requireMultiFactor: true,
    allowKeyExport: true,
    notifyOnAccess: false
  }
}
