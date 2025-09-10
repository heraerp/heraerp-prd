/**
 * Chart of Accounts Recipe
 * Smart Code: HERA.URP.RECIPE.FINANCE.COA.v1
 * 
 * Generates hierarchical chart of accounts with balances
 */

import type { ReportRecipe } from '../index'

export const chartOfAccountsRecipe: ReportRecipe = {
  name: 'HERA.URP.RECIPE.FINANCE.COA.v1',
  description: 'Hierarchical chart of accounts with current balances',
  smartCode: 'HERA.URP.RECIPE.FINANCE.COA.v1',
  category: 'finance',
  
  parameters: [
    {
      name: 'fiscalYear',
      type: 'number',
      required: false,
      default: new Date().getFullYear(),
      description: 'Fiscal year for balance calculation'
    },
    {
      name: 'includeInactive',
      type: 'boolean',
      required: false,
      default: false,
      description: 'Include inactive accounts'
    },
    {
      name: 'hierarchyDepth',
      type: 'number',
      required: false,
      default: 5,
      description: 'Maximum hierarchy depth to display'
    },
    {
      name: 'accountTypes',
      type: 'string',
      required: false,
      description: 'Comma-separated list of account types to include'
    }
  ],
  
  steps: [
    {
      // Step 1: Fetch GL accounts
      primitive: 'entityResolver',
      config: {
        entityType: 'gl_account',
        smartCodePattern: 'HERA.FIN.GL.ACC.*',
        includeDynamicData: true,
        includeDeleted: false
      },
      outputKey: 'accounts'
    },
    
    {
      // Step 2: Filter by account types if specified
      primitive: 'custom',
      handler: async (accounts, engine, params) => {
        console.log('🔍 COA Recipe Step 2: Filter by account types')
        console.log('- Input accounts:', Array.isArray(accounts) ? accounts.length : 'not array')
        console.log('- Account types param:', params.accountTypes)
        
        if (!params.accountTypes) {
          console.log('✅ No account types filter, returning all accounts')
          return accounts
        }
        
        const types = params.accountTypes.split(',').map((t: string) => t.trim())
        const filtered = accounts.filter((acc: any) => {
          const accountType = acc.dynamicData?.find((d: any) => d.field_name === 'account_type')?.field_value_text
          return types.includes(accountType)
        })
        
        console.log('📊 Filtered accounts:', filtered.length)
        return filtered
      },
      outputKey: 'filteredAccounts'
    },
    
    {
      // Step 3: Build account hierarchy (SIMPLIFIED FOR DEBUGGING)
      primitive: 'custom',
      handler: async (filteredAccounts, engine, params) => {
        console.log('🔍 COA Recipe Step 3: Build hierarchy (simplified)')
        console.log('- Input accounts:', Array.isArray(filteredAccounts) ? filteredAccounts.length : 'not array')
        
        // For now, just return accounts as flat list to debug
        if (Array.isArray(filteredAccounts) && filteredAccounts.length > 0) {
          console.log('📋 Sample account for hierarchy:', filteredAccounts[0])
          
          // Transform accounts to have flat structure
          const flatAccounts = filteredAccounts.map(account => ({
            ...account,
            children: [], // No hierarchy for debugging
            level: 0
          }))
          
          console.log('✅ Returning flat hierarchy with', flatAccounts.length, 'accounts')
          return flatAccounts
        } else {
          console.log('❌ No accounts to build hierarchy from')
          return []
        }
      },
      outputKey: 'hierarchy'
    },
    
    {
      // Step 4: Skip transactions for now (DEBUGGING)
      primitive: 'custom',
      handler: async (hierarchy, engine, params) => {
        console.log('🔍 COA Recipe Step 4: Skip transactions (debugging)')
        console.log('- Input hierarchy:', Array.isArray(hierarchy) ? hierarchy.length : 'not array')
        
        // Just pass through with dummy balances for debugging
        if (Array.isArray(hierarchy)) {
          const withBalances = hierarchy.map(account => ({
            ...account,
            balance: 0,
            childrenBalance: 0,
            totalBalance: 0,
            hasActivity: false
          }))
          
          console.log('✅ Added dummy balances to', withBalances.length, 'accounts')
          return withBalances
        } else {
          console.log('❌ Hierarchy is not array')
          return hierarchy
        }
      },
      outputKey: 'hierarchyWithBalances'
    },
    
    {
      // Step 5: Add account metadata (SIMPLIFIED FOR DEBUGGING)
      primitive: 'custom',
      handler: async (hierarchyWithBalances, engine, params) => {
        console.log('🔍 COA Recipe Step 5: Add metadata (simplified)')
        console.log('- Input accounts:', Array.isArray(hierarchyWithBalances) ? hierarchyWithBalances.length : 'not array')
        
        if (Array.isArray(hierarchyWithBalances) && hierarchyWithBalances.length > 0) {
          const formatted = hierarchyWithBalances.map(account => ({
            ...account,
            accountCode: account.entity_code,
            accountType: 'detail', // Simplified for debugging
            normalBalance: 'debit',
            formattedBalance: '$0.00',
            indentLevel: 0,
            children: []
          }))
          
          console.log('✅ Formatted', formatted.length, 'accounts')
          console.log('📋 Sample formatted account:', formatted[0])
          return formatted
        } else {
          console.log('❌ No accounts to format')
          return []
        }
      },
      outputKey: 'formattedAccounts'
    },
    
    {
      // Step 6: Final output (DEBUGGING)
      primitive: 'custom',
      handler: async (formattedAccounts, engine, params) => {
        console.log('🔍 COA Recipe Step 6: Final output')
        console.log('- Input accounts:', Array.isArray(formattedAccounts) ? formattedAccounts.length : 'not array')
        
        if (Array.isArray(formattedAccounts) && formattedAccounts.length > 0) {
          console.log('🎉 Final recipe output:', formattedAccounts.length, 'accounts')
          console.log('📋 Final sample account:', formattedAccounts[0])
          return formattedAccounts
        } else {
          console.log('❌ No accounts in final output')
          return []
        }
      }
    }
  ],
  
  cacheTTL: 300, // 5 minutes
  
  outputSchema: {
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        entity_name: { type: 'string' },
        accountCode: { type: 'string' },
        accountType: { type: 'string' },
        normalBalance: { type: 'string' },
        balance: { type: 'number' },
        childrenBalance: { type: 'number' },
        totalBalance: { type: 'number' },
        formattedBalance: { type: 'string' },
        indentLevel: { type: 'number' },
        hasActivity: { type: 'boolean' },
        children: { type: 'array' }
      }
    }
  }
}