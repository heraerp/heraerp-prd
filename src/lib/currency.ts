/**
 * Currency utilities for HERA ERP
 * Handles dynamic currency formatting based on organization and transaction settings
 */

import { Organization } from '@/src/types/organization'

// Currency configuration type
export interface CurrencyConfig {
  code: string
  symbol: string
  symbolPosition: 'before' | 'after'
  decimalSeparator: string
  thousandSeparator: string
  decimalPlaces: number
}

// Common currency configurations
export const CURRENCY_CONFIGS: Record<string, CurrencyConfig> = {
  USD: {
    code: 'USD',
    symbol: '$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  EUR: {
    code: 'EUR',
    symbol: '€',
    symbolPosition: 'before',
    decimalSeparator: ',',
    thousandSeparator: '.',
    decimalPlaces: 2
  },
  GBP: {
    code: 'GBP',
    symbol: '£',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  AED: {
    code: 'AED',
    symbol: 'د.إ',
    symbolPosition: 'after',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  INR: {
    code: 'INR',
    symbol: '₹',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  JPY: {
    code: 'JPY',
    symbol: '¥',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 0
  },
  CNY: {
    code: 'CNY',
    symbol: '¥',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  AUD: {
    code: 'AUD',
    symbol: 'A$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  CAD: {
    code: 'CAD',
    symbol: 'C$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  CHF: {
    code: 'CHF',
    symbol: 'CHF',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: "'",
    decimalPlaces: 2
  },
  SGD: {
    code: 'SGD',
    symbol: 'S$',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  MYR: {
    code: 'MYR',
    symbol: 'RM',
    symbolPosition: 'before',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  SAR: {
    code: 'SAR',
    symbol: 'ر.س',
    symbolPosition: 'after',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  },
  KWD: {
    code: 'KWD',
    symbol: 'د.ك',
    symbolPosition: 'after',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 3
  },
  BHD: {
    code: 'BHD',
    symbol: 'د.ب',
    symbolPosition: 'after',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 3
  },
  OMR: {
    code: 'OMR',
    symbol: 'ر.ع.',
    symbolPosition: 'after',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 3
  },
  QAR: {
    code: 'QAR',
    symbol: 'ر.ق',
    symbolPosition: 'after',
    decimalSeparator: '.',
    thousandSeparator: ',',
    decimalPlaces: 2
  }
}

/**
 * Get currency configuration for a given currency code
 * Falls back to USD if currency is not found
 */
export function getCurrencyConfig(currencyCode: string = 'USD'): CurrencyConfig {
  return CURRENCY_CONFIGS[currencyCode.toUpperCase()] || CURRENCY_CONFIGS.USD
}

/**
 * Format a number as currency using the specified currency code
 * @param amount - The amount to format
 * @param currencyCode - The currency code (USD, EUR, AED, etc.)
 * @param options - Additional formatting options
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currencyCode: string = 'USD',
  options?: {
    showCode?: boolean
    compact?: boolean
    hideSymbol?: boolean
  }
): string {
  // Handle null/undefined/empty values
  if (amount === null || amount === undefined || amount === '') {
    return formatCurrency(0, currencyCode, options)
  }

  // Convert to number
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  // Handle invalid numbers
  if (isNaN(numAmount)) {
    return formatCurrency(0, currencyCode, options)
  }

  const config = getCurrencyConfig(currencyCode)

  // Format with appropriate decimal places
  let formatted = numAmount.toFixed(config.decimalPlaces)

  // Add thousand separators
  const parts = formatted.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, config.thousandSeparator)

  // Join with decimal separator
  formatted = parts.join(config.decimalSeparator)

  // Add currency symbol or code
  if (options?.hideSymbol) {
    return formatted
  }

  if (options?.showCode) {
    return `${formatted} ${config.code}`
  }

  // Add symbol based on position
  if (config.symbolPosition === 'before') {
    return `${config.symbol}${formatted}`
  } else {
    return `${formatted} ${config.symbol}`
  }
}

/**
 * Parse a currency string to a number
 * @param value - The currency string to parse
 * @param currencyCode - The currency code for parsing rules
 */
export function parseCurrency(value: string, currencyCode: string = 'USD'): number {
  if (!value) return 0

  const config = getCurrencyConfig(currencyCode)

  // Remove currency symbol and code
  let cleaned = value.replace(config.symbol, '').replace(config.code, '').trim()

  // Replace thousand separators
  cleaned = cleaned.replace(new RegExp(`\\${config.thousandSeparator}`, 'g'), '')

  // Replace decimal separator with standard dot
  if (config.decimalSeparator !== '.') {
    cleaned = cleaned.replace(config.decimalSeparator, '.')
  }

  const parsed = parseFloat(cleaned)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * Get currency from organization settings
 * @param organization - The organization object
 */
export function getOrganizationCurrency(organization?: Organization | null): string {
  return organization?.currency_code || 'USD'
}

/**
 * Format currency for display in an organization context
 * @param amount - The amount to format
 * @param organization - The organization for currency settings
 * @param options - Additional formatting options
 */
export function formatOrganizationCurrency(
  amount: number | string | null | undefined,
  organization?: Organization | null,
  options?: Parameters<typeof formatCurrency>[2]
): string {
  const currencyCode = getOrganizationCurrency(organization)
  return formatCurrency(amount, currencyCode, options)
}

/**
 * Get list of all supported currencies
 */
export function getSupportedCurrencies(): Array<{
  code: string
  name: string
  symbol: string
}> {
  return [
    { code: 'USD', name: 'US Dollar', symbol: '$' },
    { code: 'EUR', name: 'Euro', symbol: '€' },
    { code: 'GBP', name: 'British Pound', symbol: '£' },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
    { code: 'SAR', name: 'Saudi Riyal', symbol: 'ر.س' },
    { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
    { code: 'BHD', name: 'Bahraini Dinar', symbol: 'د.ب' },
    { code: 'OMR', name: 'Omani Rial', symbol: 'ر.ع.' },
    { code: 'QAR', name: 'Qatari Riyal', symbol: 'ر.ق' }
  ]
}

/**
 * Currency input component props helper
 */
export function getCurrencyInputProps(currencyCode: string = 'USD') {
  const config = getCurrencyConfig(currencyCode)
  return {
    prefix: config.symbolPosition === 'before' ? config.symbol : undefined,
    suffix: config.symbolPosition === 'after' ? ` ${config.symbol}` : undefined,
    decimalSeparator: config.decimalSeparator,
    thousandSeparator: config.thousandSeparator,
    decimalScale: config.decimalPlaces,
    fixedDecimalScale: true
  }
}
