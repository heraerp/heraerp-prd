# HERA Network International Payment Gateway Integration

**Version**: 1.0
**Date**: January 2025
**Status**: Planning Phase
**Target System**: HERA Salon POS

---

## Executive Summary

This document outlines the comprehensive integration plan for Network International payment gateway into the HERA Salon POS system, enabling enterprise-grade card payment processing with physical card reader support for UAE salon businesses.

### Key Objectives
- Enable secure card payment processing through Network International gateway
- Support physical card reader terminals (tap/chip/swipe)
- Maintain PCI DSS compliance (card data never touches HERA servers)
- Provide seamless payment experience for salon staff and customers
- Complete audit trail integration with HERA's universal transaction system

### Business Impact
- **Setup Time**: 5-6 weeks
- **Initial Investment**: 3,500-7,000 AED (gateway setup + terminal hardware)
- **Per Transaction Cost**: 2.0-3.5% + 1-2 AED
- **Compliance**: Full PCI DSS compliance through gateway provider
- **Customer Experience**: Professional tap-to-pay card processing

---

## Architecture Overview

### 3-Tier Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tier 1: POS UI                            │
│  ┌──────────────────┐  ┌──────────────────┐  ┌───────────────┐ │
│  │ PaymentDialog    │  │ Card Reader      │  │ Payment       │ │
│  │ Component        │→ │ Component        │→ │ Status Modal  │ │
│  └──────────────────┘  └──────────────────┘  └───────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              ↓ API Calls
┌─────────────────────────────────────────────────────────────────┐
│                   Tier 2: Payment Service Layer                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Create Order │  │ Process      │  │ Webhook Handler      │  │
│  │ API          │  │ Payment API  │  │ (Async Updates)      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │         Network International API Client                  │  │
│  │  - Authentication (outlet ref + API key)                  │  │
│  │  - Request signing and encryption                         │  │
│  │  - Response validation                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTPS API
┌─────────────────────────────────────────────────────────────────┐
│              Tier 3: Network International Gateway               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Payment          │  │ Terminal         │  │ Webhook      │  │
│  │ Processing       │  │ Management       │  │ Delivery     │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Physical Card Terminals                      │  │
│  │  - Verifone V200c / V400c (Desktop)                       │  │
│  │  - Ingenico Move 5000 (Mobile)                            │  │
│  │  - PAX A920 (Smart POS)                                   │  │
│  │  Connection: TCP/Bluetooth/USB                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Integration Options

#### Option 1: Physical Terminal Integration (Recommended for Salons)
- **Use Case**: In-person card payments at salon locations
- **Hardware**: Physical card reader terminals (Verifone, Ingenico, PAX)
- **Connection**: Terminal connects to Network Intl via TCP/Bluetooth
- **HERA Integration**: Send payment request → Terminal processes → Webhook confirms
- **Customer Experience**: Tap/insert card at terminal like any retail store
- **Cost**: 1,500-5,000 AED per terminal + per-transaction fees

#### Option 2: Online Payment Gateway
- **Use Case**: Online bookings, deposits, advance payments
- **Hardware**: None required (web-based)
- **Connection**: Direct API integration with payment page
- **HERA Integration**: Redirect to payment page → Customer pays → Return to HERA
- **Customer Experience**: Web-based card entry form
- **Cost**: Lower setup, same per-transaction fees

#### Option 3: Hybrid Approach (Full Solution)
- Physical terminals for walk-in payments
- Online gateway for advance bookings
- Unified transaction management in HERA

---

## Implementation Plan

### Phase 1: Foundation Setup (Week 1)

#### 1.1 Network International Account Setup
- [ ] Register business account at Network International
- [ ] Complete KYC verification (trade license, Emirates ID, bank details)
- [ ] Obtain API credentials:
  - Outlet reference ID
  - API key
  - Terminal IDs (if physical terminals ordered)
- [ ] Set up sandbox environment for testing

#### 1.2 Environment Configuration
```bash
# .env.local
NETWORK_INTL_API_KEY=your-api-key
NETWORK_INTL_OUTLET_REF=your-outlet-ref
NETWORK_INTL_ENVIRONMENT=sandbox # or production
NETWORK_INTL_WEBHOOK_SECRET=your-webhook-secret
NETWORK_INTL_API_BASE_URL=https://api-gateway.sandbox.ngenius-payments.com
```

#### 1.3 Database Schema Updates
Store payment configuration in `core_dynamic_data`:

```typescript
// Branch Terminal Configuration
{
  entity_id: branch_entity_id,
  field_name: 'payment_terminal_id',
  field_value_text: 'TERM12345',
  field_type: 'text',
  smart_code: 'HERA.SALON.POS.TERMINAL.CONFIG.V1'
}

// Organization Payment Settings
{
  entity_id: organization_entity_id,
  field_name: 'network_intl_outlet_ref',
  field_value_text: 'outlet-ref-123',
  field_type: 'text',
  smart_code: 'HERA.SALON.PAYMENT.GATEWAY.CONFIG.V1'
}
```

### Phase 2: Core Payment Library (Week 2)

#### 2.1 File Structure
```
src/lib/payments/network-international/
├── client.ts              # API client for Network Intl
├── terminal.ts            # Terminal integration
├── types.ts               # TypeScript interfaces
├── validation.ts          # Payment validation
├── encryption.ts          # Security utilities
└── config.ts              # Configuration management
```

#### 2.2 Network International API Client (`client.ts`)

```typescript
import axios, { AxiosInstance } from 'axios'
import crypto from 'crypto'

export interface NetworkIntlConfig {
  apiKey: string
  outletRef: string
  environment: 'sandbox' | 'production'
  baseUrl: string
}

export interface CreateOrderRequest {
  action: 'SALE' | 'AUTH'
  amount: {
    currencyCode: string
    value: number // Amount in fils (1 AED = 100 fils)
  }
  merchantOrderReference: string
  emailAddress?: string
  billingAddress?: {
    firstName: string
    lastName: string
  }
}

export interface CreateOrderResponse {
  orderReference: string
  state: 'AWAITING_3DS' | 'STARTED' | 'AUTHORIZED' | 'CAPTURED'
  _links: {
    payment: {
      href: string
    }
  }
}

export interface PaymentResponse {
  orderReference: string
  state: 'STARTED' | 'AUTHORIZED' | 'CAPTURED' | 'FAILED'
  amount: {
    currencyCode: string
    value: number
  }
  authResponse?: {
    success: boolean
    resultCode: string
    resultMessage: string
  }
}

export class NetworkInternationalClient {
  private client: AxiosInstance
  private config: NetworkIntlConfig

  constructor(config: NetworkIntlConfig) {
    this.config = config
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/vnd.ni-payment.v2+json',
        'Accept': 'application/vnd.ni-payment.v2+json'
      }
    })
  }

  /**
   * Create a payment order
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      const response = await this.client.post(
        `/transactions/outlets/${this.config.outletRef}/orders`,
        request
      )
      return response.data
    } catch (error) {
      console.error('[NetworkIntl] Failed to create order:', error)
      throw new Error('Failed to create payment order')
    }
  }

  /**
   * Process payment through terminal
   */
  async processTerminalPayment(
    orderReference: string,
    terminalId: string
  ): Promise<PaymentResponse> {
    try {
      const response = await this.client.post(
        `/transactions/outlets/${this.config.outletRef}/orders/${orderReference}/payments/terminal`,
        {
          terminalId,
          action: 'SALE'
        }
      )
      return response.data
    } catch (error) {
      console.error('[NetworkIntl] Terminal payment failed:', error)
      throw new Error('Terminal payment processing failed')
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(orderReference: string): Promise<PaymentResponse> {
    try {
      const response = await this.client.get(
        `/transactions/outlets/${this.config.outletRef}/orders/${orderReference}`
      )
      return response.data
    } catch (error) {
      console.error('[NetworkIntl] Failed to get payment status:', error)
      throw new Error('Failed to retrieve payment status')
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = process.env.NETWORK_INTL_WEBHOOK_SECRET!
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    return computedSignature === signature
  }

  /**
   * Refund a payment
   */
  async refundPayment(
    orderReference: string,
    amount: number
  ): Promise<PaymentResponse> {
    try {
      const response = await this.client.post(
        `/transactions/outlets/${this.config.outletRef}/orders/${orderReference}/refund`,
        {
          amount: {
            currencyCode: 'AED',
            value: amount
          }
        }
      )
      return response.data
    } catch (error) {
      console.error('[NetworkIntl] Refund failed:', error)
      throw new Error('Payment refund failed')
    }
  }
}

// Export singleton instance
export const networkIntlClient = new NetworkInternationalClient({
  apiKey: process.env.NETWORK_INTL_API_KEY!,
  outletRef: process.env.NETWORK_INTL_OUTLET_REF!,
  environment: process.env.NETWORK_INTL_ENVIRONMENT as 'sandbox' | 'production',
  baseUrl: process.env.NETWORK_INTL_API_BASE_URL!
})
```

#### 2.3 Terminal Integration (`terminal.ts`)

```typescript
import { networkIntlClient } from './client'

export interface TerminalConfig {
  terminalId: string
  branchId: string
  branchName: string
  connectionType: 'tcp' | 'bluetooth' | 'usb'
  ipAddress?: string
  port?: number
}

export interface TerminalPaymentRequest {
  amount: number
  currency: string
  reference: string
  terminalId: string
  onProgress?: (status: TerminalPaymentStatus) => void
}

export type TerminalPaymentStatus =
  | 'initializing'
  | 'waiting_for_card'
  | 'processing'
  | 'success'
  | 'failed'
  | 'cancelled'

export class TerminalIntegration {
  private terminals: Map<string, TerminalConfig> = new Map()

  /**
   * Register a terminal for a branch
   */
  registerTerminal(config: TerminalConfig): void {
    this.terminals.set(config.branchId, config)
    console.log(`[Terminal] Registered terminal ${config.terminalId} for branch ${config.branchName}`)
  }

  /**
   * Get terminal for a branch
   */
  getTerminalForBranch(branchId: string): TerminalConfig | undefined {
    return this.terminals.get(branchId)
  }

  /**
   * Process payment through terminal
   */
  async processPayment(request: TerminalPaymentRequest): Promise<{
    success: boolean
    orderReference?: string
    error?: string
  }> {
    try {
      // Step 1: Create order in Network International
      request.onProgress?.('initializing')

      const order = await networkIntlClient.createOrder({
        action: 'SALE',
        amount: {
          currencyCode: request.currency,
          value: Math.round(request.amount * 100) // Convert to fils
        },
        merchantOrderReference: request.reference
      })

      // Step 2: Send payment request to terminal
      request.onProgress?.('waiting_for_card')

      const paymentResult = await networkIntlClient.processTerminalPayment(
        order.orderReference,
        request.terminalId
      )

      // Step 3: Wait for payment completion
      request.onProgress?.('processing')

      // Poll for payment status (or use webhook)
      let attempts = 0
      const maxAttempts = 30 // 30 seconds timeout

      while (attempts < maxAttempts) {
        const status = await networkIntlClient.getPaymentStatus(order.orderReference)

        if (status.state === 'CAPTURED') {
          request.onProgress?.('success')
          return {
            success: true,
            orderReference: order.orderReference
          }
        }

        if (status.state === 'FAILED') {
          request.onProgress?.('failed')
          return {
            success: false,
            error: status.authResponse?.resultMessage || 'Payment failed'
          }
        }

        // Wait 1 second before checking again
        await new Promise(resolve => setTimeout(resolve, 1000))
        attempts++
      }

      // Timeout
      request.onProgress?.('failed')
      return {
        success: false,
        error: 'Payment timeout'
      }

    } catch (error) {
      request.onProgress?.('failed')
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Payment processing failed'
      }
    }
  }
}

// Export singleton instance
export const terminalIntegration = new TerminalIntegration()
```

#### 2.4 TypeScript Types (`types.ts`)

```typescript
export interface PaymentGatewayConfig {
  provider: 'network_international'
  outlet_ref: string
  api_key: string
  environment: 'sandbox' | 'production'
  webhook_secret: string
}

export interface PaymentOrder {
  order_reference: string
  transaction_id: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'success' | 'failed' | 'refunded'
  payment_method: 'card_terminal' | 'online_gateway'
  terminal_id?: string
  customer_id?: string
  branch_id: string
  created_at: string
  completed_at?: string
  error_message?: string
}

export interface PaymentWebhookPayload {
  eventId: string
  eventName: string
  order: {
    reference: string
    amount: {
      currencyCode: string
      value: number
    }
    merchantOrderReference: string
  }
  payment: {
    state: string
    pan: string // Masked card number
    scheme: string // VISA, MASTERCARD, etc.
  }
  timestamp: string
}

export interface RefundRequest {
  order_reference: string
  amount: number
  reason: string
  requested_by: string
}
```

### Phase 3: API Routes (Week 3)

#### 3.1 Create Order API (`/api/v2/payments/network-intl/create-order/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { networkIntlClient } from '@/lib/payments/network-international/client'
import { universalApi } from '@/lib/universal-api-v2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency, transaction_id, branch_id, terminal_id } = body

    // Validate request
    if (!amount || !currency || !transaction_id || !branch_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create order in Network International
    const order = await networkIntlClient.createOrder({
      action: 'SALE',
      amount: {
        currencyCode: currency,
        value: Math.round(amount * 100)
      },
      merchantOrderReference: transaction_id
    })

    // Store order reference in transaction metadata
    await universalApi.update({
      table: 'universal_transactions',
      id: transaction_id,
      data: {
        metadata: {
          payment_gateway: 'network_international',
          order_reference: order.orderReference,
          terminal_id: terminal_id,
          payment_state: order.state
        }
      }
    })

    return NextResponse.json({
      success: true,
      order_reference: order.orderReference,
      state: order.state,
      payment_url: order._links.payment.href
    })

  } catch (error) {
    console.error('[API] Create order failed:', error)
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    )
  }
}
```

#### 3.2 Process Payment API (`/api/v2/payments/network-intl/process-payment/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { terminalIntegration } from '@/lib/payments/network-international/terminal'
import { universalApi } from '@/lib/universal-api-v2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { transaction_id, branch_id, amount, currency } = body

    // Get terminal for branch
    const terminal = terminalIntegration.getTerminalForBranch(branch_id)
    if (!terminal) {
      return NextResponse.json(
        { error: 'No terminal configured for this branch' },
        { status: 400 }
      )
    }

    // Process payment through terminal
    const result = await terminalIntegration.processPayment({
      amount,
      currency,
      reference: transaction_id,
      terminalId: terminal.terminalId
    })

    if (result.success) {
      // Update transaction status
      await universalApi.update({
        table: 'universal_transactions',
        id: transaction_id,
        data: {
          transaction_status: 'completed',
          metadata: {
            payment_gateway: 'network_international',
            order_reference: result.orderReference,
            payment_completed_at: new Date().toISOString()
          }
        }
      })

      return NextResponse.json({
        success: true,
        order_reference: result.orderReference
      })
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('[API] Payment processing failed:', error)
    return NextResponse.json(
      { error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}
```

#### 3.3 Webhook Handler (`/api/v2/payments/network-intl/webhook/route.ts`)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { networkIntlClient } from '@/lib/payments/network-international/client'
import { universalApi } from '@/lib/universal-api-v2'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-webhook-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing webhook signature' },
        { status: 401 }
      )
    }

    // Verify webhook signature
    const isValid = networkIntlClient.verifyWebhookSignature(body, signature)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      )
    }

    // Parse webhook payload
    const payload = JSON.parse(body)
    const { order, payment } = payload

    // Find transaction by merchant reference
    const transactions = await universalApi.read({
      table: 'universal_transactions',
      filters: [
        { field: 'id', operator: 'eq', value: order.merchantOrderReference }
      ]
    })

    if (!transactions.data || transactions.data.length === 0) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    const transaction = transactions.data[0]

    // Update transaction status based on payment state
    let newStatus = transaction.transaction_status
    if (payment.state === 'CAPTURED') {
      newStatus = 'completed'
    } else if (payment.state === 'FAILED') {
      newStatus = 'failed'
    }

    await universalApi.update({
      table: 'universal_transactions',
      id: transaction.id,
      data: {
        transaction_status: newStatus,
        metadata: {
          ...transaction.metadata,
          payment_state: payment.state,
          card_scheme: payment.scheme,
          masked_pan: payment.pan,
          webhook_received_at: new Date().toISOString()
        }
      }
    })

    // If payment successful, trigger auto-journal posting
    if (payment.state === 'CAPTURED') {
      // This will create the GL journal entry
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/v2/auto-journal/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transaction_id: transaction.id })
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[Webhook] Processing failed:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
```

### Phase 4: UI Components (Week 4)

#### 4.1 Card Reader Component (`NetworkIntlCardReader.tsx`)

```typescript
'use client'

import React, { useState } from 'react'
import { CreditCard, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TerminalPaymentStatus } from '@/lib/payments/network-international/terminal'

interface NetworkIntlCardReaderProps {
  amount: number
  currency: string
  transactionId: string
  branchId: string
  onSuccess: (orderReference: string) => void
  onError: (error: string) => void
  onCancel: () => void
}

export function NetworkIntlCardReader({
  amount,
  currency,
  transactionId,
  branchId,
  onSuccess,
  onError,
  onCancel
}: NetworkIntlCardReaderProps) {
  const [status, setStatus] = useState<TerminalPaymentStatus>('initializing')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const processPayment = async () => {
    try {
      setStatus('initializing')

      // Create order
      const createOrderResponse = await fetch('/api/v2/payments/network-intl/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          transaction_id: transactionId,
          branch_id: branchId
        })
      })

      if (!createOrderResponse.ok) {
        throw new Error('Failed to create payment order')
      }

      setStatus('waiting_for_card')

      // Process payment through terminal
      const processResponse = await fetch('/api/v2/payments/network-intl/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_id: transactionId,
          branch_id: branchId,
          amount,
          currency
        })
      })

      const result = await processResponse.json()

      if (result.success) {
        setStatus('success')
        onSuccess(result.order_reference)
      } else {
        setStatus('failed')
        setErrorMessage(result.error)
        onError(result.error)
      }

    } catch (error) {
      setStatus('failed')
      const message = error instanceof Error ? error.message : 'Payment failed'
      setErrorMessage(message)
      onError(message)
    }
  }

  React.useEffect(() => {
    processPayment()
  }, [])

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-6">
      {/* Status Icon */}
      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center">
        {status === 'initializing' && <Loader2 className="w-12 h-12 animate-spin text-blue-600" />}
        {status === 'waiting_for_card' && <CreditCard className="w-12 h-12 text-blue-600 animate-pulse" />}
        {status === 'processing' && <Loader2 className="w-12 h-12 animate-spin text-blue-600" />}
        {status === 'success' && <CheckCircle className="w-12 h-12 text-green-600" />}
        {status === 'failed' && <XCircle className="w-12 h-12 text-red-600" />}
      </div>

      {/* Status Text */}
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">
          {currency} {amount.toFixed(2)}
        </h3>
        <p className="text-gray-600">
          {status === 'initializing' && 'Connecting to payment terminal...'}
          {status === 'waiting_for_card' && 'Please tap, insert or swipe card'}
          {status === 'processing' && 'Processing payment...'}
          {status === 'success' && 'Payment successful!'}
          {status === 'failed' && 'Payment failed'}
        </p>
        {status === 'failed' && errorMessage && (
          <p className="text-sm text-red-600">{errorMessage}</p>
        )}
      </div>

      {/* Cancel Button */}
      {(status === 'initializing' || status === 'waiting_for_card') && (
        <Button variant="outline" onClick={onCancel}>
          Cancel Payment
        </Button>
      )}
    </div>
  )
}
```

#### 4.2 Update PaymentDialog.tsx

Add new tab for card reader:

```typescript
// Add to existing TabsList in PaymentDialog.tsx
<TabsTrigger value="card_reader">
  <CreditCard className="w-4 h-4" />
  Card Reader
</TabsTrigger>

// Add to TabsContent sections
<TabsContent value="card_reader" className="space-y-4">
  <NetworkIntlCardReader
    amount={remainingAmount}
    currency="AED"
    transactionId={ticket.id}
    branchId={branchId}
    onSuccess={(orderReference) => {
      // Add payment to list
      const newPayment = {
        id: crypto.randomUUID(),
        type: 'card',
        amount: remainingAmount,
        reference: orderReference
      }
      setPayments([...payments, newPayment])
    }}
    onError={(error) => {
      console.error('Card reader payment failed:', error)
    }}
    onCancel={() => {
      // Switch back to manual card entry
      setActivePaymentMethod('card')
    }}
  />
</TabsContent>
```

### Phase 5: Testing & Deployment (Week 5)

#### 5.1 Sandbox Testing Checklist
- [ ] Create test order through API
- [ ] Process payment with test terminal
- [ ] Verify webhook delivery and signature
- [ ] Test payment success flow
- [ ] Test payment failure scenarios
- [ ] Test refund processing
- [ ] Verify GL posting integration
- [ ] Test with multiple currencies
- [ ] Test concurrent payments
- [ ] Performance testing (response times)

#### 5.2 Production Deployment
- [ ] Switch to production environment
- [ ] Update API credentials
- [ ] Configure production webhook URL
- [ ] Set up monitoring and alerts
- [ ] Train salon staff on card reader usage
- [ ] Create troubleshooting guide
- [ ] Monitor first production transactions
- [ ] Gather user feedback

---

## Customer Integration Guide

### For Salon Owners: How to Integrate Card Readers

#### Step 1: Sign Up with Network International
1. Visit Network International website
2. Apply for merchant account
3. Provide business documents:
   - Trade license
   - Emirates ID
   - Bank account details
   - VAT certificate (if applicable)
4. Wait for approval (typically 3-5 business days)

#### Step 2: Choose Card Reader Hardware

**Option A: Desktop Terminal (Recommended for Fixed Locations)**
- **Verifone V200c**: 1,500-2,000 AED
- Features: Contactless, chip, swipe, receipt printer
- Best for: Reception desks, checkout counters

**Option B: Mobile Terminal (Recommended for On-the-Go)**
- **Ingenico Move 5000**: 2,000-3,000 AED
- Features: Wireless, battery-powered, 4G connectivity
- Best for: Mobile stylists, home visits

**Option C: Smart POS (Premium Option)**
- **PAX A920**: 3,500-5,000 AED
- Features: Android OS, touchscreen, app ecosystem
- Best for: Multi-function needs (POS + card reader in one)

#### Step 3: HERA Configuration
1. Go to HERA Settings → Payment Gateway
2. Enter Network International credentials:
   - Outlet reference ID
   - API key
   - Terminal ID(s)
3. Assign terminals to branches (if multi-location)
4. Test with sandbox transaction

#### Step 4: Staff Training
- How to initiate card payment from kanban
- How to guide customers through tap/insert/swipe
- What to do if payment fails
- How to process refunds
- Troubleshooting common issues

#### Step 5: Go Live
1. Process first test transaction with real card
2. Verify transaction appears in HERA
3. Check GL journal entry creation
4. Monitor for 24 hours
5. Full rollout to all staff

---

## Cost Analysis

### Initial Setup Costs
| Item | Cost (AED) | Notes |
|------|------------|-------|
| Network Intl Account Setup | 500-1,000 | One-time registration |
| Security Deposit | 1,000-1,500 | Refundable after 6 months |
| Hardware (per terminal) | 1,500-5,000 | Depends on terminal model |
| **Total Initial Investment** | **3,000-7,500** | Per location |

### Ongoing Costs
| Item | Cost | Notes |
|------|------|-------|
| Per Transaction Fee | 2.0-3.5% | Depends on card type |
| Authorization Fee | 1-2 AED | Per transaction |
| Monthly Rental (if applicable) | 50-150 AED | For rented terminals |
| Chargeback Fee | 100-200 AED | Only if disputed |

### Cost Example for Typical Salon
**Assumptions**:
- 200 card transactions per month
- Average transaction: 250 AED
- Transaction fee: 2.5%

**Monthly Costs**:
- Transaction fees: 200 × 250 × 2.5% = 1,250 AED
- Authorization fees: 200 × 1.5 = 300 AED
- Terminal rental: 100 AED
- **Total Monthly Cost**: 1,650 AED

**Annual Cost**: ~19,800 AED

**ROI Consideration**:
- Increased sales due to card acceptance: +15-30%
- Reduced cash handling time: -20 mins/day = 10 hours/month
- Professional image improvement
- Complete audit trail for accounting

---

## Security & Compliance

### PCI DSS Compliance
- **Level**: Level 4 (least stringent for low-volume merchants)
- **Card Data**: Never stored in HERA (handled by Network Intl)
- **Tokenization**: Card details replaced with tokens
- **Encryption**: All API communication over HTTPS
- **Webhook Security**: HMAC-SHA256 signature verification

### UAE Central Bank Requirements
- Anti-money laundering (AML) compliance
- Transaction monitoring and reporting
- Customer identification verification
- Record retention (5 years minimum)

### Data Residency
- Payment data stored in UAE data centers
- Compliant with UAE data protection laws
- GDPR-ready for European customers

---

## Troubleshooting Guide

### Common Issues

#### Issue 1: "Terminal not responding"
**Symptoms**: Payment request times out, terminal shows no activity
**Causes**:
- Terminal not connected to internet
- Incorrect terminal ID in configuration
- Terminal not registered with Network International

**Solutions**:
1. Check terminal internet connection (WiFi/4G/Ethernet)
2. Verify terminal ID matches in HERA settings
3. Contact Network International to confirm terminal activation
4. Restart terminal and try again

#### Issue 2: "Payment declined"
**Symptoms**: Card reader shows "Declined" message
**Causes**:
- Insufficient funds
- Card expired
- Card blocked by bank
- Incorrect PIN (for chip cards)

**Solutions**:
1. Ask customer to try different card
2. Contact customer's bank if persistent
3. Offer alternative payment method

#### Issue 3: "Webhook not received"
**Symptoms**: Payment successful on terminal but HERA doesn't update
**Causes**:
- Webhook URL not configured
- Firewall blocking webhook
- Invalid webhook signature

**Solutions**:
1. Verify webhook URL in Network Intl dashboard
2. Check server firewall settings
3. Review webhook logs for signature errors
4. Manually poll payment status as fallback

---

## Success Metrics

### Key Performance Indicators (KPIs)

| Metric | Target | Measurement |
|--------|--------|-------------|
| Payment Success Rate | >95% | Successful payments / Total attempts |
| Average Processing Time | <30 seconds | Time from initiate to confirmation |
| Staff Adoption Rate | >90% | Staff using card reader / Total staff |
| Customer Satisfaction | >4.5/5 | Post-payment survey |
| Chargeback Rate | <0.1% | Disputed transactions / Total |
| System Uptime | >99.5% | Available hours / Total hours |

### Business Impact Tracking
- Increase in card payment percentage
- Reduction in cash handling time
- Improvement in cash flow (immediate settlement)
- Reduction in payment reconciliation errors
- Customer payment preference trends

---

## Next Steps

### Immediate Actions (This Week)
1. **Decision**: Approve Network International as payment gateway
2. **Budget**: Allocate funds for setup and hardware
3. **Timeline**: Confirm 5-6 week implementation schedule

### Implementation Actions (Weeks 1-5)
1. Register with Network International
2. Order card reader hardware
3. Implement payment library and API routes
4. Develop UI components
5. Test in sandbox environment
6. Train staff
7. Go live with monitored rollout

### Post-Implementation Actions (Week 6+)
1. Monitor first 100 transactions closely
2. Gather staff and customer feedback
3. Optimize payment flow based on usage patterns
4. Expand to additional salon locations
5. Consider online booking payment integration

---

## Support & Resources

### Network International Support
- **Phone**: +971 4 428 5500
- **Email**: support@network.ae
- **Portal**: https://portal.network.ae
- **Documentation**: https://docs.network.ae

### HERA Integration Support
- **Documentation**: `/docs/salon/pos.md`
- **API Reference**: `/docs/api/v2/payments.md`
- **Troubleshooting**: This document, section 8

### Training Resources
- Staff training video (to be created)
- Quick reference card (to be created)
- Customer FAQ (to be created)

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | January 2025 | Claude AI | Initial comprehensive integration plan |

---

**End of Document**
