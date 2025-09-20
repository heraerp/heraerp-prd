#!/usr/bin/env node

/**
 * Setup demo organization settings
 * Creates default settings for the salon demo organization
 */

import dotenv from 'dotenv'
import { universalApiClient } from './hera-api-client.js'

dotenv.config()

const DEMO_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

async function setupDemoSettings() {
  console.log('🎯 Setting up demo organization settings...')

  // Set organization context
  universalApiClient.setOrganizationId(DEMO_ORG_ID)

  try {
    // 1. Create default sales policy
    console.log('📋 Creating sales policy...')
    await universalApiClient.setDynamicField(
      DEMO_ORG_ID, // Using org ID as entity ID for org-level settings
      'SALES_POLICY.v1',
      {
        vatEnabled: true,
        vatRate: 5,
        vatInclusive: false,
        roundingEnabled: true,
        roundingPrecision: 2,
        tipEnabled: true,
        tipOptions: [10, 15, 20],
        defaultTipPercentage: 15,
        serviceChargeEnabled: false,
        serviceChargePercentage: 0,
        discountEnabled: true,
        maxDiscountPercentage: 50,
        commissionEnabled: true,
        defaultCommissionPercentage: 30
      },
      'HERA.SALON.SETTINGS.SALES_POLICY.v1'
    )
    console.log('✅ Sales policy created')

    // 2. Create default notification policy
    console.log('📋 Creating notification policy...')
    await universalApiClient.setDynamicField(
      DEMO_ORG_ID,
      'NOTIFICATIONS_POLICY.v1',
      {
        emailEnabled: true,
        smsEnabled: false,
        whatsappEnabled: true,
        pushEnabled: false,
        appointmentReminders: true,
        reminderHoursBefore: 24,
        marketingOptIn: false,
        birthdayWishes: true,
        loyaltyUpdates: true
      },
      'HERA.SALON.SETTINGS.NOTIFICATIONS.v1'
    )
    console.log('✅ Notification policy created')

    // 3. Create system settings
    console.log('📋 Creating system settings...')
    await universalApiClient.setDynamicField(
      DEMO_ORG_ID,
      'SYSTEM_SETTINGS.v1',
      {
        timezone: 'Asia/Dubai',
        currency: 'AED',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '12h',
        weekStartsOn: 'sunday',
        language: 'en',
        theme: 'light',
        workingHours: {
          monday: { open: '09:00', close: '21:00' },
          tuesday: { open: '09:00', close: '21:00' },
          wednesday: { open: '09:00', close: '21:00' },
          thursday: { open: '09:00', close: '21:00' },
          friday: { open: '09:00', close: '21:00' },
          saturday: { open: '09:00', close: '21:00' },
          sunday: { open: '10:00', close: '19:00' }
        }
      },
      'HERA.SALON.SETTINGS.SYSTEM.v1'
    )
    console.log('✅ System settings created')

    // 4. Create role grants
    console.log('📋 Creating role grants...')
    await universalApiClient.setDynamicField(
      DEMO_ORG_ID,
      'ROLE_GRANTS.v1',
      {
        owner: ['*'],
        admin: ['appointments:*', 'customers:*', 'inventory:*', 'reports:*', 'settings:read'],
        manager: ['appointments:*', 'customers:*', 'inventory:read', 'reports:read'],
        stylist: ['appointments:read', 'appointments:update', 'customers:read'],
        receptionist: ['appointments:*', 'customers:*'],
        customer: ['appointments:read:own', 'customers:read:own']
      },
      'HERA.SALON.SETTINGS.ROLE_GRANTS.v1'
    )
    console.log('✅ Role grants created')

    console.log('\n✨ Demo organization settings setup complete!')
    
  } catch (error) {
    console.error('❌ Error setting up demo settings:', error)
    process.exit(1)
  }
}

// Run the setup
setupDemoSettings()