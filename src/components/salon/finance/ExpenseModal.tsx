'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { SalonLuxeModal, ValidationError } from '@/components/salon/shared/SalonLuxeModal'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Receipt,
  Sparkles,
  DollarSign,
  Calendar,
  Tag,
  CreditCard,
  FileText
} from 'lucide-react'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

// Expense form schema
const ExpenseFormSchema = z.object({
  name: z.string().min(1, 'Expense name is required'),
  vendor: z.string().min(1, 'Vendor is required'),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  expense_date: z.string().min(1, 'Expense date is required'),
  category: z.string().min(1, 'Category is required'),
  payment_method: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  receipt_url: z.string().optional(),
  reference_number: z.string().optional()
})

export type ExpenseForm = z.infer<typeof ExpenseFormSchema>

// Expense categories
const EXPENSE_CATEGORIES = [
  { value: 'Inventory', label: 'Inventory', color: SALON_LUXE_COLORS.plum.base },
  { value: 'Utilities', label: 'Utilities', color: SALON_LUXE_COLORS.emerald.base },
  { value: 'Marketing', label: 'Marketing', color: SALON_LUXE_COLORS.gold.base },
  { value: 'Salaries', label: 'Salaries', color: SALON_LUXE_COLORS.ruby.base },
  { value: 'Rent', label: 'Rent', color: SALON_LUXE_COLORS.bronze.base },
  { value: 'Maintenance', label: 'Maintenance', color: SALON_LUXE_COLORS.orange.base },
  { value: 'Other', label: 'Other', color: SALON_LUXE_COLORS.text.tertiary }
]

// Payment methods
const PAYMENT_METHODS = [
  { value: 'Cash', label: 'Cash' },
  { value: 'Card', label: 'Card' },
  { value: 'Bank Transfer', label: 'Bank Transfer' },
  { value: 'Other', label: 'Other' }
]

// Payment statuses
const PAYMENT_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'cancelled', label: 'Cancelled' }
]

export interface ExpenseEntity {
  id: string
  entity_name: string
  vendor?: string
  amount?: number
  expense_date?: string
  category?: string
  payment_method?: string
  status?: string
  description?: string
  receipt_url?: string
  reference_number?: string
}

interface ExpenseModalProps {
  open: boolean
  onClose: () => void
  expense?: ExpenseEntity | null
  onSave: (data: ExpenseForm) => Promise<void>
}

export function ExpenseModal({ open, onClose, expense, onSave }: ExpenseModalProps) {
  const [showValidationSummary, setShowValidationSummary] = useState(false)
  const [shakeButton, setShakeButton] = useState(false)

  const form = useForm<ExpenseForm>({
    resolver: zodResolver(ExpenseFormSchema),
    defaultValues: {
      name: '',
      vendor: '',
      amount: undefined,
      expense_date: new Date().toISOString().split('T')[0],
      category: '',
      payment_method: 'Cash',
      status: 'pending',
      description: '',
      receipt_url: '',
      reference_number: ''
    }
  })

  // Reset form when expense changes
  useEffect(() => {
    if (expense) {
      form.reset({
        name: expense.entity_name || '',
        vendor: expense.vendor || '',
        amount: expense.amount || undefined,
        expense_date: expense.expense_date
          ? new Date(expense.expense_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        category: expense.category || '',
        payment_method: expense.payment_method || 'Cash',
        status: expense.status || 'pending',
        description: expense.description || '',
        receipt_url: expense.receipt_url || '',
        reference_number: expense.reference_number || ''
      })
    } else {
      form.reset({
        name: '',
        vendor: '',
        amount: undefined,
        expense_date: new Date().toISOString().split('T')[0],
        category: '',
        payment_method: 'Cash',
        status: 'pending',
        description: '',
        receipt_url: '',
        reference_number: ''
      })
    }
  }, [expense, form])

  const handleSubmit = async (data: ExpenseForm) => {
    try {
      setShowValidationSummary(false)
      await onSave(data)
      form.reset()
    } catch (error) {
      console.error('Expense save error:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    setShowValidationSummary(false)
    onClose()
  }

  // Convert react-hook-form errors to ValidationError array
  const validationErrors: ValidationError[] = Object.entries(form.formState.errors).map(
    ([field, error]) => ({
      field,
      message: error?.message || 'Invalid value'
    })
  )

  // Show validation summary when there are errors
  useEffect(() => {
    if (form.formState.isSubmitted && Object.keys(form.formState.errors).length > 0) {
      setShowValidationSummary(true)
      setShakeButton(true)
      setTimeout(() => setShakeButton(false), 500)
    }
  }, [form.formState.isSubmitted, form.formState.errors])

  return (
    <>
      <style jsx global>{`
        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          10%,
          30%,
          50%,
          70%,
          90% {
            transform: translateX(-4px);
          }
          20%,
          40%,
          60%,
          80% {
            transform: translateX(4px);
          }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
      <SalonLuxeModal
        open={open}
        onClose={handleClose}
        title={expense ? 'Edit Expense' : 'Add New Expense'}
        description={
          expense
            ? 'Update expense details and payment status'
            : 'Track a new business expense'
        }
        icon={<Receipt className="w-7 h-7" />}
        size="xl"
        validationErrors={validationErrors}
        showValidationSummary={showValidationSummary}
        footer={
          <div className="flex items-center justify-between w-full">
            <p className="text-xs" style={{ color: SALON_LUXE_COLORS.text.secondary, opacity: 0.7 }}>
              <span style={{ color: SALON_LUXE_COLORS.gold.base }}>*</span> Required fields
            </p>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="outline-button"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={form.formState.isSubmitting}
                onClick={form.handleSubmit(handleSubmit)}
                className={`primary-button ${shakeButton ? 'animate-shake' : ''}`}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 rounded-full animate-spin border-t-transparent" />
                    {expense ? 'Updating...' : 'Saving...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {expense ? 'Update Expense' : 'Save Expense'}
                  </span>
                )}
              </Button>
            </div>
          </div>
        }
      >
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 pt-4">
            {/* Basic Information Section */}
            <div
              className="relative p-6 rounded-xl border backdrop-blur-sm"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.dark + 'E6',
                borderColor: SALON_LUXE_COLORS.bronze.base + '30',
                boxShadow: `0 4px 12px rgba(0,0,0,0.4)`
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: SALON_LUXE_COLORS.gold.base }}
                />
                <h3 className="text-lg font-semibold tracking-wide">Basic Information</h3>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium tracking-wide">
                        Expense Name <span style={{ color: SALON_LUXE_COLORS.gold.base }}>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Office Supplies"
                          className="h-11 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="vendor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium tracking-wide">
                        Vendor <span style={{ color: SALON_LUXE_COLORS.gold.base }}>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Vendor or supplier name"
                          className="h-11 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-5 mt-5">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium tracking-wide flex items-center gap-2">
                        <DollarSign
                          className="w-4 h-4"
                          style={{ color: SALON_LUXE_COLORS.ruby.base }}
                        />
                        Amount (AED) <span style={{ color: SALON_LUXE_COLORS.gold.base }}>*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span
                            className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-semibold"
                            style={{ color: SALON_LUXE_COLORS.ruby.base }}
                          >
                            AED
                          </span>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="h-12 rounded-lg pl-20 text-lg font-semibold"
                            onChange={e => {
                              const value = e.target.value
                              field.onChange(value === '' ? undefined : parseFloat(value))
                            }}
                            value={field.value || ''}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="expense_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium tracking-wide flex items-center gap-2">
                        <Calendar
                          className="w-4 h-4"
                          style={{ color: SALON_LUXE_COLORS.gold.base }}
                        />
                        Expense Date <span style={{ color: SALON_LUXE_COLORS.gold.base }}>*</span>
                      </FormLabel>
                      <FormControl>
                        <Input {...field} type="date" className="h-11 rounded-lg" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Category & Payment Section */}
            <div
              className="relative p-6 rounded-xl border backdrop-blur-sm"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.dark + 'E6',
                borderColor: SALON_LUXE_COLORS.bronze.base + '30',
                boxShadow: `0 4px 12px rgba(0,0,0,0.4)`
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: SALON_LUXE_COLORS.emerald.base }}
                />
                <h3 className="text-lg font-semibold tracking-wide">Category & Payment</h3>
              </div>

              <div className="grid grid-cols-3 gap-5">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium tracking-wide flex items-center gap-2">
                        <Tag className="w-4 h-4" style={{ color: SALON_LUXE_COLORS.gold.base }} />
                        Category <span style={{ color: SALON_LUXE_COLORS.gold.base }}>*</span>
                      </FormLabel>
                      <Select value={field.value || ''} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger
                            className="h-11 rounded-lg hera-select-trigger"
                            aria-describedby={undefined}
                          >
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="hera-select-content">
                          {EXPENSE_CATEGORIES.map(cat => (
                            <SelectItem key={cat.value} value={cat.value} className="hera-select-item">
                              <div className="flex items-center gap-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: cat.color }}
                                />
                                {cat.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="payment_method"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium tracking-wide flex items-center gap-2">
                        <CreditCard
                          className="w-4 h-4"
                          style={{ color: SALON_LUXE_COLORS.plum.base }}
                        />
                        Payment Method
                      </FormLabel>
                      <Select value={field.value || 'Cash'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger
                            className="h-11 rounded-lg hera-select-trigger"
                            aria-describedby={undefined}
                          >
                            <SelectValue placeholder="Select method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="hera-select-content">
                          {PAYMENT_METHODS.map(method => (
                            <SelectItem key={method.value} value={method.value} className="hera-select-item">
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium tracking-wide">Status</FormLabel>
                      <Select value={field.value || 'pending'} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger
                            className="h-11 rounded-lg hera-select-trigger"
                            aria-describedby={undefined}
                          >
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="hera-select-content">
                          {PAYMENT_STATUSES.map(status => (
                            <SelectItem key={status.value} value={status.value} className="hera-select-item">
                              {status.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Additional Details Section */}
            <div
              className="relative p-6 rounded-xl border backdrop-blur-sm"
              style={{
                backgroundColor: SALON_LUXE_COLORS.charcoal.dark + 'E6',
                borderColor: SALON_LUXE_COLORS.bronze.base + '30',
                boxShadow: `0 4px 12px rgba(0,0,0,0.4)`
              }}
            >
              <div className="flex items-center gap-2 mb-5">
                <div
                  className="w-1 h-6 rounded-full"
                  style={{ backgroundColor: SALON_LUXE_COLORS.gold.base }}
                />
                <h3 className="text-lg font-semibold tracking-wide">Additional Details</h3>
              </div>

              <div className="grid grid-cols-2 gap-5 mb-5">
                <FormField
                  control={form.control}
                  name="reference_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium tracking-wide flex items-center gap-2">
                        <FileText
                          className="w-4 h-4"
                          style={{ color: SALON_LUXE_COLORS.bronze.base }}
                        />
                        Reference Number
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Invoice or receipt number"
                          className="h-11 rounded-lg"
                        />
                      </FormControl>
                      <FormDescription
                        className="text-xs"
                        style={{ color: SALON_LUXE_COLORS.bronze.base, opacity: 0.7 }}
                      >
                        External invoice or receipt number
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receipt_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium tracking-wide">
                        Receipt URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://..."
                          className="h-11 rounded-lg"
                        />
                      </FormControl>
                      <FormDescription
                        className="text-xs"
                        style={{ color: SALON_LUXE_COLORS.bronze.base, opacity: 0.7 }}
                      >
                        Link to uploaded receipt or invoice
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium tracking-wide">
                      Description / Notes
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Add notes about this expense..."
                        className="min-h-[100px] rounded-lg resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </SalonLuxeModal>
    </>
  )
}
