import { test as base } from '@playwright/test'
import { SupabaseTestClient } from '../helpers/supabase-test-client'
import { ICE_CREAM_ORG_ID } from '../helpers/test-constants'

// Define types for our fixtures
export type ApiFixtures = {
  supabaseClient: SupabaseTestClient
  organizationId: string
  testIds: {
    timestamp: number
    uniqueId: string
  }
}

// Extend base test with our fixtures
export const test = base.extend<ApiFixtures>({
  supabaseClient: async ({}, use) => {
    const client = new SupabaseTestClient()
    await use(client)
  },
  
  organizationId: async ({}, use) => {
    // Use ice cream organization ID for tests
    await use(ICE_CREAM_ORG_ID)
  },
  
  testIds: async ({}, use) => {
    // Generate unique IDs for this test run
    const timestamp = Date.now()
    const uniqueId = `TEST-${timestamp}`
    
    await use({ timestamp, uniqueId })
  },
})

export { expect } from '@playwright/test'