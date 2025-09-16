/**
 * PWM Encryption API Route
 *
 * Handles encryption/decryption requests for PWM sensitive data
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  encryptData,
  decryptData,
  encryptSensitiveFields,
  decryptSensitiveFields,
  validateEncryptionSetup,
  EncryptedData,
  SensitiveWealthFields
} from '@/lib/pwm/encryption'

interface EncryptRequest {
  action: 'encrypt' | 'decrypt' | 'validate'
  data?: string
  sensitiveFields?: SensitiveWealthFields
  encryptedData?: EncryptedData
  encryptedFields?: Record<string, EncryptedData>
}

export async function POST(request: NextRequest) {
  try {
    const organizationId = request.headers.get('organization-id')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID header required' }, { status: 400 })
    }

    const body: EncryptRequest = await request.json()

    switch (body.action) {
      case 'encrypt':
        if (body.data) {
          // Encrypt single data string
          const encrypted = encryptData(body.data, organizationId)
          return NextResponse.json({
            success: true,
            encrypted_data: encrypted
          })
        } else if (body.sensitiveFields) {
          // Encrypt sensitive fields object
          const encryptedFields = encryptSensitiveFields(body.sensitiveFields, organizationId)
          return NextResponse.json({
            success: true,
            encrypted_fields: encryptedFields
          })
        } else {
          return NextResponse.json(
            { error: 'No data or sensitiveFields provided for encryption' },
            { status: 400 }
          )
        }

      case 'decrypt':
        if (body.encryptedData) {
          // Decrypt single encrypted data
          const decrypted = decryptData(body.encryptedData, organizationId)
          return NextResponse.json({
            success: true,
            decrypted_data: decrypted.data
          })
        } else if (body.encryptedFields) {
          // Decrypt sensitive fields object
          const decryptedFields = decryptSensitiveFields(body.encryptedFields, organizationId)
          return NextResponse.json({
            success: true,
            decrypted_fields: decryptedFields
          })
        } else {
          return NextResponse.json(
            { error: 'No encryptedData or encryptedFields provided for decryption' },
            { status: 400 }
          )
        }

      case 'validate':
        const validation = validateEncryptionSetup()
        return NextResponse.json({
          success: true,
          validation: {
            is_valid: validation.isValid,
            errors: validation.errors,
            timestamp: new Date().toISOString()
          }
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action. Must be encrypt, decrypt, or validate' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('PWM Encryption API error:', error)
    return NextResponse.json(
      {
        error: 'Encryption operation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const organizationId = request.headers.get('organization-id')
    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID header required' }, { status: 400 })
    }

    // Return encryption status and configuration
    const validation = validateEncryptionSetup()

    return NextResponse.json({
      success: true,
      encryption_status: {
        is_configured: validation.isValid,
        errors: validation.errors,
        algorithm: 'AES-256-GCM',
        key_derivation: 'PBKDF2-SHA512',
        last_check: new Date().toISOString()
      },
      protected_fields: [
        'account_number',
        'ssn',
        'tax_id',
        'routing_number',
        'beneficiary_info',
        'private_notes',
        'advisor_contact',
        'bank_details',
        'confirmation_number',
        'account_reference',
        'counterparty_details',
        'regulatory_notes'
      ]
    })
  } catch (error) {
    console.error('PWM Encryption status error:', error)
    return NextResponse.json(
      {
        error: 'Failed to get encryption status',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
