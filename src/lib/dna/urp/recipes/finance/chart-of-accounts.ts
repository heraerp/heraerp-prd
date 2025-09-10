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
        if (!params.accountTypes) return accounts
        
        const types = params.accountTypes.split(',').map((t: string) => t.trim())
        return accounts.filter((acc: any) => {
          const accountType = acc.dynamicData?.find((d: any) => d.field_name === 'account_type')?.field_value_text
          return types.includes(accountType)
        })
      },
      outputKey: 'filteredAccounts'
    },
    
    {
      // Step 3: Build account hierarchy
      primitive: 'hierarchyBuilder',
      config: {
        entities: '{{filteredAccounts}}',
        relationshipType: 'parent_of',
        maxDepth: '{{hierarchyDepth}}',
        includeOrphans: true
      },
      outputKey: 'hierarchy'
    },
    
    {
      // Step 4: Fetch transactions for balance calculation
      primitive: 'transactionFacts',
      config: {
        transactionType: 'journal_entry',
        smartCodePattern: 'HERA.FIN.GL.TXN.*',
        groupBy: 'year',
        aggregations: ['sum'],
        includeLines: true
      },
      outputKey: 'transactions'
    },
    
    {
      // Step 5: Calculate account balances
      primitive: 'custom',
      handler: async (hierarchy, engine, params) => {
        const transactions = params.transactions || []
        const fiscalYear = params.fiscalYear
        
        // Helper function to calculate balance for an account
        const calculateBalance = (accountId: string): number => {
          let balance = 0
          
          transactions.forEach((txnGroup: any) => {
            if (txnGroup.group === String(fiscalYear)) {
              txnGroup.lineItems?.forEach((line: any) => {
                if (line.entity_id === accountId) {
                  balance += line.line_amount || 0
                }
              })
            }
          })
          
          return balance
        }
        
        // Recursive function to add balances to hierarchy
        const addBalances = (node: any): any => {
          const balance = calculateBalance(node.id)
          let childrenBalance = 0
          
          if (node.children && node.children.length > 0) {
            node.children = node.children.map((child: any) => {
              const childWithBalance = addBalances(child)
              childrenBalance += childWithBalance.totalBalance || 0
              return childWithBalance
            })
          }
          
          return {
            ...node,
            balance,
            childrenBalance,
            totalBalance: balance + childrenBalance,
            hasActivity: balance !== 0 || childrenBalance !== 0
          }
        }
        
        // Process hierarchy
        if (Array.isArray(hierarchy)) {
          return hierarchy.map(addBalances)
        } else {
          return addBalances(hierarchy)
        }
      }
    },
    
    {
      // Step 6: Add account metadata
      primitive: 'custom',
      handler: async (hierarchyWithBalances, engine, params) => {
        // Add formatted fields
        const formatAccount = (node: any): any => {
          const accountCode = node.dynamicData?.find((d: any) => d.field_name === 'account_code')?.field_value_text || node.entity_code
          const accountType = node.dynamicData?.find((d: any) => d.field_name === 'account_type')?.field_value_text
          const normalBalance = node.dynamicData?.find((d: any) => d.field_name === 'normal_balance')?.field_value_text || 'debit'
          
          return {
            ...node,
            accountCode,
            accountType,
            normalBalance,
            formattedBalance: new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD'
            }).format(node.totalBalance || 0),
            indentLevel: node.level || 0,
            children: node.children?.map(formatAccount)
          }
        }
        
        if (Array.isArray(hierarchyWithBalances)) {
          return hierarchyWithBalances.map(formatAccount)
        } else {
          return formatAccount(hierarchyWithBalances)
        }
      }
    },
    
    {
      // Step 7: Filter inactive accounts if needed
      primitive: 'custom',
      handler: async (formattedHierarchy, engine, params) => {
        if (params.includeInactive) return formattedHierarchy
        
        // Recursive filter
        const filterActive = (node: any): any => {
          if (node.status === 'inactive' && !node.hasActivity) {
            return null
          }
          
          if (node.children) {
            node.children = node.children
              .map(filterActive)
              .filter(Boolean)
          }
          
          return node
        }
        
        if (Array.isArray(formattedHierarchy)) {
          return formattedHierarchy.map(filterActive).filter(Boolean)
        } else {
          return filterActive(formattedHierarchy)
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