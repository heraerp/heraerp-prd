/**
 * Hook to get organization currency settings
 */

import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { formatCurrency, getOrganizationCurrency, getCurrencyConfig } from '@/lib/currency'

export function useOrganizationCurrency() {
  const { currentOrganization } = useHERAAuth()

  const currencyCode = getOrganizationCurrency(currentOrganization)
  const currencyConfig = getCurrencyConfig(currencyCode)

  const format = (
    amount: number | string | null | undefined,
    options?: Parameters<typeof formatCurrency>[2]
  ) => {
    return formatCurrency(amount, currencyCode, options)
  }

  return {
    currencyCode,
    currencySymbol: currencyConfig.symbol,
    currencyConfig,
    format,
    formatCurrency: format // alias for consistency
  }
}
