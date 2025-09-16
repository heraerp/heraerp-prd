/**
 * Chart of Accounts Service
 * Handles loading and building hierarchical GL account structure
 */

import { supabase } from '@/src/lib/supabase'

export interface GLAccountNode {
  id: string
  entity_code: string
  entity_name: string
  entity_type: string
  metadata: any
  organization_id: string
  // Hierarchy
  children: GLAccountNode[]
  parent?: GLAccountNode
  level: number
  // Balances
  debit_total: number
  credit_total: number
  current_balance: number
  balance_type: 'Dr' | 'Cr'
}

export class ChartOfAccountsService {
  /**
   * Load complete Chart of Accounts with hierarchy for an organization
   */
  static async loadChartOfAccounts(organizationId: string): Promise<{
    accounts: GLAccountNode[]
    rootAccounts: GLAccountNode[]
    accountMap: Record<string, GLAccountNode>
    totalAccounts: number
    error?: string
  }> {
    try {
      console.log('=== Loading Chart of Accounts ===')
      console.log('Organization ID:', organizationId)

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Step 1: Load all GL accounts
      const { data: glAccounts, error: accountsError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'gl_account')
        .order('entity_code')

      if (accountsError) {
        console.error('Error loading GL accounts:', accountsError)
        throw accountsError
      }

      console.log(`Loaded ${glAccounts?.length || 0} GL accounts`)

      if (!glAccounts || glAccounts.length === 0) {
        return {
          accounts: [],
          rootAccounts: [],
          accountMap: {},
          totalAccounts: 0,
          error: 'No GL accounts found for this organization'
        }
      }

      // Step 2: Load parent-child relationships
      const { data: relationships, error: relError } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('relationship_type', 'parent_of')

      if (relError) {
        console.error('Error loading relationships:', relError)
      }

      console.log(`Loaded ${relationships?.length || 0} parent-child relationships`)

      // Step 3: Load transaction lines for balances
      const { data: transactionLines, error: linesError } = await supabase
        .from('universal_transaction_lines')
        .select('*')
        .eq('organization_id', organizationId)

      if (linesError) {
        console.error('Error loading transaction lines:', linesError)
      }

      // Step 4: Calculate balances by account
      const balancesByAccount: Record<string, { debit: number; credit: number }> = {}

      if (transactionLines) {
        transactionLines.forEach((line: any) => {
          if (line.gl_account_id) {
            if (!balancesByAccount[line.gl_account_id]) {
              balancesByAccount[line.gl_account_id] = { debit: 0, credit: 0 }
            }

            // Check if amounts are in line_data or direct fields
            const debitAmount = line.line_data?.debit_amount || line.debit_amount || 0
            const creditAmount = line.line_data?.credit_amount || line.credit_amount || 0

            balancesByAccount[line.gl_account_id].debit += debitAmount
            balancesByAccount[line.gl_account_id].credit += creditAmount
          }
        })
      }

      console.log('Calculated balances for', Object.keys(balancesByAccount).length, 'accounts')

      // Step 5: Create account nodes with initial data
      const accountMap: Record<string, GLAccountNode> = {}
      const accountById: Record<string, GLAccountNode> = {}

      glAccounts.forEach((account: any) => {
        const balance = balancesByAccount[account.id] || { debit: 0, credit: 0 }
        const netBalance = balance.debit - balance.credit

        const node: GLAccountNode = {
          ...account,
          children: [],
          level: 0,
          debit_total: balance.debit,
          credit_total: balance.credit,
          current_balance: Math.abs(netBalance),
          balance_type: netBalance >= 0 ? 'Dr' : 'Cr'
        }

        accountMap[account.entity_code] = node
        accountById[account.id] = node
      })

      // Step 6: Build parent-child relationships
      const childToParentMap = new Map<string, string>()
      const rootAccountIds = new Set<string>(Object.keys(accountById))

      if (relationships && relationships.length > 0) {
        relationships.forEach((rel: any) => {
          const parentId = rel.from_entity_id
          const childId = rel.to_entity_id

          if (accountById[parentId] && accountById[childId]) {
            // Set up parent-child relationship
            accountById[parentId].children.push(accountById[childId])
            accountById[childId].parent = accountById[parentId]
            childToParentMap.set(childId, parentId)

            // Remove child from root accounts
            rootAccountIds.delete(childId)
          }
        })
      }

      console.log('Root accounts found:', rootAccountIds.size)

      // Step 7: Get root accounts and set levels
      const rootAccounts: GLAccountNode[] = []
      rootAccountIds.forEach(id => {
        const account = accountById[id]
        if (account) {
          rootAccounts.push(account)
          this.setAccountLevels(account, 1)
        }
      })

      // Step 8: Sort accounts
      this.sortAccounts(rootAccounts)

      // Step 9: Calculate rollup balances for header accounts
      rootAccounts.forEach(account => {
        this.calculateRollupBalances(account)
      })

      // Step 10: Create flat list of all accounts
      const allAccounts: GLAccountNode[] = []
      this.flattenAccounts(rootAccounts, allAccounts)

      console.log('=== Chart of Accounts Load Complete ===')
      console.log('Total accounts:', allAccounts.length)
      console.log('Root accounts:', rootAccounts.length)

      return {
        accounts: allAccounts,
        rootAccounts,
        accountMap,
        totalAccounts: allAccounts.length
      }
    } catch (error) {
      console.error('Failed to load Chart of Accounts:', error)
      return {
        accounts: [],
        rootAccounts: [],
        accountMap: {},
        totalAccounts: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Set account levels recursively
   */
  private static setAccountLevels(account: GLAccountNode, level: number): void {
    account.level = level
    account.children.forEach(child => {
      this.setAccountLevels(child, level + 1)
    })
  }

  /**
   * Sort accounts and their children recursively
   */
  private static sortAccounts(accounts: GLAccountNode[]): void {
    accounts.sort((a, b) => a.entity_code.localeCompare(b.entity_code))
    accounts.forEach(account => {
      if (account.children && account.children.length > 0) {
        this.sortAccounts(account.children)
      }
    })
  }

  /**
   * Calculate rollup balances for header accounts
   */
  private static calculateRollupBalances(account: GLAccountNode): {
    debit: number
    credit: number
  } {
    // If it's a detail account or has no children, return its own balances
    if ((account.metadata as any)?.account_type === 'detail' || account.children.length === 0) {
      return {
        debit: account.debit_total,
        credit: account.credit_total
      }
    }

    // For header accounts, sum up children's balances
    let totalDebit = 0
    let totalCredit = 0

    account.children.forEach(child => {
      const childBalances = this.calculateRollupBalances(child)
      totalDebit += childBalances.debit
      totalCredit += childBalances.credit
    })

    // Update the account's totals
    account.debit_total = totalDebit
    account.credit_total = totalCredit
    const netBalance = totalDebit - totalCredit
    account.current_balance = Math.abs(netBalance)
    account.balance_type = netBalance >= 0 ? 'Dr' : 'Cr'

    return { debit: totalDebit, credit: totalCredit }
  }

  /**
   * Flatten account hierarchy into a single array
   */
  private static flattenAccounts(accounts: GLAccountNode[], result: GLAccountNode[]): void {
    accounts.forEach(account => {
      result.push(account)
      if (account.children && account.children.length > 0) {
        this.flattenAccounts(account.children, result)
      }
    })
  }

  /**
   * Debug utility to print account hierarchy
   */
  static printAccountHierarchy(accounts: GLAccountNode[], indent: string = ''): void {
    accounts.forEach(account => {
      console.log(
        `${indent}${account.entity_code} - ${account.entity_name} (${account.balance_type} ${account.current_balance})`
      )
      if (account.children && account.children.length > 0) {
        this.printAccountHierarchy(account.children, indent + '  ')
      }
    })
  }
}
