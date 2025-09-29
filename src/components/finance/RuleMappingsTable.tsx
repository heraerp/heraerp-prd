// ================================================================================
// RULE MAPPINGS TABLE COMPONENT
// Smart Code: HERA.UI.FINANCE.RULE_MAPPINGS_TABLE.v1
// Table for managing posting rule account mappings
// ================================================================================

'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Plus, Trash2, AlertCircle } from 'lucide-react'
import { Mapping } from '@/lib/schemas/financeRules'

interface RuleMappingsTableProps {
  mappings: Mapping[]
  onChange: (mappings: Mapping[]) => void
  errors?: Record<number, string>
}

export function RuleMappingsTable({ mappings, onChange, errors = {} }: RuleMappingsTableProps) {
  const addMapping = () => {
    const newMapping: Mapping = {
      account: '',
      side: 'debit',
      amount_source: 'gross',
      multiplier: 1,
      memo: undefined
    }
    onChange([...mappings, newMapping])
  }

  const removeMapping = (index: number) => {
    onChange(mappings.filter((_, i) => i !== index))
  }

  const updateMapping = (index: number, field: keyof Mapping, value: any) => {
    const updated = [...mappings]
    updated[index] = {
      ...updated[index],
      [field]: value
    }
    onChange(updated)
  }

  const getSideColor = (side: 'debit' | 'credit') => {
    return side === 'debit'
      ? 'text-green-700 dark:text-green-300'
      : 'text-blue-700 dark:text-blue-300'
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium ink dark:text-gray-300">Account Mappings</h3>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={addMapping}
          className="text-violet-600 hover:text-violet-700"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Mapping
        </Button>
      </div>

      {mappings.length === 0 ? (
        <div className="text-center py-8 border rounded-lg bg-gray-50 dark:bg-gray-800/30">
          <AlertCircle className="h-8 w-8 ink-muted mx-auto mb-2" />
          <p className="text-sm dark:ink-muted">
            No mappings defined. Add at least one mapping.
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Account</TableHead>
                <TableHead className="w-[100px]">Side</TableHead>
                <TableHead className="w-[140px]">Amount Source</TableHead>
                <TableHead className="w-[100px]">Multiplier</TableHead>
                <TableHead>Memo</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mappings.map((mapping, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Input
                      value={mapping.account}
                      onChange={e => updateMapping(index, 'account', e.target.value)}
                      placeholder="4100"
                      className={cn('font-mono text-sm w-full', errors[index] && 'border-red-500')}
                      aria-label={`Account code for mapping ${index + 1}`}
                    />
                  </TableCell>

                  <TableCell>
                    <Select
                      value={mapping.side}
                      onValueChange={(value: 'debit' | 'credit') =>
                        updateMapping(index, 'side', value)
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="hera-select-content">
                        <SelectItem value="debit" className="hera-select-item">
                          <span className={getSideColor('debit')}>Debit</span>
                        </SelectItem>
                        <SelectItem value="credit" className="hera-select-item">
                          <span className={getSideColor('credit')}>Credit</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Select
                      value={mapping.amount_source}
                      onValueChange={value => updateMapping(index, 'amount_source', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="hera-select-content">
                        <SelectItem value="net" className="hera-select-item">
                          Net
                        </SelectItem>
                        <SelectItem value="tax" className="hera-select-item">
                          Tax
                        </SelectItem>
                        <SelectItem value="gross" className="hera-select-item">
                          Gross
                        </SelectItem>
                        <SelectItem value="tip" className="hera-select-item">
                          Tip
                        </SelectItem>
                        <SelectItem value="discount" className="hera-select-item">
                          Discount
                        </SelectItem>
                        <SelectItem value="cogs" className="hera-select-item">
                          COGS
                        </SelectItem>
                        <SelectItem value="commission" className="hera-select-item">
                          Commission
                        </SelectItem>
                        <SelectItem value="custom" className="hera-select-item">
                          Custom
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  <TableCell>
                    <Input
                      type="number"
                      value={mapping.multiplier}
                      onChange={e =>
                        updateMapping(index, 'multiplier', parseFloat(e.target.value) || 1)
                      }
                      step="0.01"
                      className="text-sm w-full"
                      aria-label={`Multiplier for mapping ${index + 1}`}
                    />
                  </TableCell>

                  <TableCell>
                    <Input
                      value={mapping.memo || ''}
                      onChange={e => updateMapping(index, 'memo', e.target.value || undefined)}
                      placeholder="Optional memo"
                      className="text-sm w-full"
                      aria-label={`Memo for mapping ${index + 1}`}
                    />
                  </TableCell>

                  <TableCell>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMapping(index)}
                      className="h-8 w-8 p-0"
                      aria-label={`Remove mapping ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border-t">
              {Object.entries(errors).map(([index, error]) => (
                <div
                  key={index}
                  className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="h-3 w-3" />
                  <span>
                    Row {parseInt(index) + 1}: {error}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="text-xs dark:ink-muted">
        <p>• Account: GL account code (e.g., "4100" for sales revenue)</p>
        <p>• Amount Source: Which component of the transaction to use</p>
        <p>• Multiplier: Factor to apply (e.g., -1 for reversals, 0.05 for 5%)</p>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
