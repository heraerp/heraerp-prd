/**
 * Currency Input Component
 * Provides formatted currency input with organization-specific currency settings
 */

import React, { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { useOrganizationCurrency } from '@/hooks/use-organization-currency'
import { cn } from '@/lib/utils'

interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'prefix'> {
  hideSymbol?: boolean
  symbolPosition?: 'before' | 'after' | 'none'
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, hideSymbol = false, symbolPosition, ...props }, ref) => {
    const { currencySymbol, currencyConfig } = useOrganizationCurrency()

    const position = symbolPosition || currencyConfig.symbolPosition
    const showSymbol = !hideSymbol && position !== 'none'

    return (
      <div className="relative">
        {showSymbol && position === 'before' && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {currencySymbol}
          </span>
        )}
        <Input
          ref={ref}
          type="number"
          step="0.01"
          className={cn(
            showSymbol && position === 'before' && 'pl-8',
            showSymbol && position === 'after' && 'pr-12',
            className
          )}
          {...props}
        />
        {showSymbol && position === 'after' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {currencySymbol}
          </span>
        )}
      </div>
    )
  }
)

CurrencyInput.displayName = 'CurrencyInput'

/**
 * Currency Display Component
 * Displays formatted currency values
 */
interface CurrencyDisplayProps {
  value: number | string | null | undefined
  className?: string
  showCode?: boolean
  compact?: boolean
}

export function CurrencyDisplay({
  value,
  className,
  showCode = false,
  compact = false
}: CurrencyDisplayProps) {
  const { format } = useOrganizationCurrency()

  return <span className={className}>{format(value, { showCode, compact })}</span>
}
