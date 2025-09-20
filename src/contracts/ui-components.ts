/**
 * HERA UI Component Contracts
 *
 * Single-source prop contracts for all UI components to prevent prop drift.
 * These contracts are enforced at both compile time and runtime.
 */

import { z } from 'zod'

import type { ReactNode } from 'react'

import { nonEmptyString } from './base'

// Base Modal Props Schema
export const BaseModalPropsSchema = z
  .object({
    isOpen: z.boolean(),
    onClose: z.function().args().returns(z.void())
  })
  .strict()

export type BaseModalProps = z.infer<typeof BaseModalPropsSchema>

// Create Grant Modal Props Schema
export const CreateGrantModalPropsSchema = BaseModalPropsSchema.extend({}).strict()

export type CreateGrantModalProps = z.infer<typeof CreateGrantModalPropsSchema>

// Review Grant Modal Props Schema
export const ReviewGrantModalPropsSchema = BaseModalPropsSchema.extend({
  applicationId: nonEmptyString('Application ID is required')
}).strict()

export type ReviewGrantModalProps = z.infer<typeof ReviewGrantModalPropsSchema>

// Create Program Modal Props Schema
export const CreateProgramModalPropsSchema = BaseModalPropsSchema.extend({}).strict()

export type CreateProgramModalProps = z.infer<typeof CreateProgramModalPropsSchema>

// Filter Bar Props Schema
export const FilterBarPropsSchema = z
  .object({
    filters: z.record(z.unknown()),
    onFiltersChange: z.function().args(z.record(z.unknown())).returns(z.void())
  })
  .strict()

export type FilterBarProps = z.infer<typeof FilterBarPropsSchema>

// Card Component Props Schema
export const CardPropsSchema = z
  .object({
    children: z.custom<ReactNode>(),
    className: z.string().optional()
  })
  .strict()

export type CardProps = z.infer<typeof CardPropsSchema>

// Button Props Schema
export const ButtonPropsSchema = z
  .object({
    children: z.custom<ReactNode>(),
    onClick: z.function().args().returns(z.void()).optional(),
    disabled: z.boolean().optional(),
    variant: z.enum(['default', 'outline', 'secondary', 'ghost', 'link']).optional(),
    size: z.enum(['sm', 'md', 'lg']).optional(),
    className: z.string().optional(),
    type: z.enum(['button', 'submit', 'reset']).optional()
  })
  .strict()

export type ButtonProps = z.infer<typeof ButtonPropsSchema>

// Input Props Schema
export const InputPropsSchema = z
  .object({
    value: z.union([z.string(), z.number()]).optional(),
    onChange: z.function().args(z.any()).returns(z.void()).optional(),
    placeholder: z.string().optional(),
    disabled: z.boolean().optional(),
    required: z.boolean().optional(),
    type: z.enum(['text', 'email', 'password', 'number', 'tel', 'url']).optional(),
    className: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional()
  })
  .strict()

export type InputProps = z.infer<typeof InputPropsSchema>

// Select Props Schema
export const SelectPropsSchema = z
  .object({
    value: z.string().optional(),
    onValueChange: z.function().args(z.string()).returns(z.void()).optional(),
    placeholder: z.string().optional(),
    disabled: z.boolean().optional(),
    children: z.custom<ReactNode>()
  })
  .strict()

export type SelectProps = z.infer<typeof SelectPropsSchema>

// Textarea Props Schema
export const TextareaPropsSchema = z
  .object({
    value: z.string().optional(),
    onChange: z.function().args(z.any()).returns(z.void()).optional(),
    placeholder: z.string().optional(),
    disabled: z.boolean().optional(),
    required: z.boolean().optional(),
    rows: z.number().int().positive().optional(),
    className: z.string().optional(),
    id: z.string().optional(),
    name: z.string().optional()
  })
  .strict()

export type TextareaProps = z.infer<typeof TextareaPropsSchema>

// Badge Props Schema
export const BadgePropsSchema = z
  .object({
    children: z.custom<ReactNode>(),
    variant: z.enum(['default', 'secondary', 'outline', 'destructive']).optional(),
    className: z.string().optional()
  })
  .strict()

export type BadgeProps = z.infer<typeof BadgePropsSchema>

// Label Props Schema
export const LabelPropsSchema = z
  .object({
    children: z.custom<ReactNode>(),
    htmlFor: z.string().optional(),
    className: z.string().optional()
  })
  .strict()

export type LabelProps = z.infer<typeof LabelPropsSchema>

// Skeleton Props Schema
export const SkeletonPropsSchema = z
  .object({
    className: z.string().optional()
  })
  .strict()

export type SkeletonProps = z.infer<typeof SkeletonPropsSchema>

// Dialog Props Schema
export const DialogPropsSchema = z
  .object({
    open: z.boolean(),
    onOpenChange: z.function().args(z.boolean()).returns(z.void()),
    children: z.custom<ReactNode>()
  })
  .strict()

export type DialogProps = z.infer<typeof DialogPropsSchema>

// Dialog Content Props Schema
export const DialogContentPropsSchema = z
  .object({
    children: z.custom<ReactNode>(),
    className: z.string().optional()
  })
  .strict()

export type DialogContentProps = z.infer<typeof DialogContentPropsSchema>

// Application Card Props Schema
export const ApplicationCardPropsSchema = z
  .object({
    application: z.record(z.unknown()), // GrantApplicationWithRelated
    onReview: z.function().args().returns(z.void())
  })
  .strict()

export type ApplicationCardProps = z.infer<typeof ApplicationCardPropsSchema>

// Program Card Props Schema
export const ProgramCardPropsSchema = z
  .object({
    program: z.record(z.unknown()), // GrantProgram
    onCreateGrantRound: z.function().args().returns(z.void())
  })
  .strict()

export type ProgramCardProps = z.infer<typeof ProgramCardPropsSchema>

// Table Props Schema
export const TablePropsSchema = z
  .object({
    data: z.array(z.record(z.unknown())),
    columns: z.array(
      z.object({
        key: z.string(),
        header: z.string(),
        sortable: z.boolean().optional()
      })
    ),
    onSort: z.function().args(z.string()).returns(z.void()).optional(),
    loading: z.boolean().optional(),
    className: z.string().optional()
  })
  .strict()

export type TableProps = z.infer<typeof TablePropsSchema>

// Pagination Props Schema
export const PaginationPropsSchema = z
  .object({
    currentPage: z.number().int().positive(),
    totalPages: z.number().int().nonnegative(),
    onPageChange: z.function().args(z.number()).returns(z.void()),
    showPageNumbers: z.boolean().optional(),
    className: z.string().optional()
  })
  .strict()

export type PaginationProps = z.infer<typeof PaginationPropsSchema>

// Loading State Props Schema
export const LoadingStatePropsSchema = z
  .object({
    isLoading: z.boolean(),
    loadingText: z.string().optional(),
    children: z.custom<ReactNode>()
  })
  .strict()

export type LoadingStateProps = z.infer<typeof LoadingStatePropsSchema>

// Error State Props Schema
export const ErrorStatePropsSchema = z
  .object({
    error: z.string(),
    onRetry: z.function().args().returns(z.void()).optional(),
    className: z.string().optional()
  })
  .strict()

export type ErrorStateProps = z.infer<typeof ErrorStatePropsSchema>

// Empty State Props Schema
export const EmptyStatePropsSchema = z
  .object({
    title: z.string(),
    description: z.string().optional(),
    action: z
      .object({
        label: z.string(),
        onClick: z.function().args().returns(z.void())
      })
      .optional(),
    className: z.string().optional()
  })
  .strict()

export type EmptyStateProps = z.infer<typeof EmptyStatePropsSchema>

// Status Badge Props Schema
export const StatusBadgePropsSchema = z
  .object({
    status: z.string(),
    variant: z.enum(['default', 'success', 'warning', 'error', 'info']).optional(),
    className: z.string().optional()
  })
  .strict()

export type StatusBadgeProps = z.infer<typeof StatusBadgePropsSchema>

// Search Input Props Schema
export const SearchInputPropsSchema = z
  .object({
    value: z.string(),
    onChange: z.function().args(z.string()).returns(z.void()),
    placeholder: z.string().optional(),
    onClear: z.function().args().returns(z.void()).optional(),
    className: z.string().optional()
  })
  .strict()

export type SearchInputProps = z.infer<typeof SearchInputPropsSchema>

// Form Field Props Schema
export const FormFieldPropsSchema = z
  .object({
    label: z.string(),
    error: z.string().optional(),
    required: z.boolean().optional(),
    children: z.custom<ReactNode>(),
    className: z.string().optional()
  })
  .strict()

export type FormFieldProps = z.infer<typeof FormFieldPropsSchema>

// Validation Functions for Runtime Checking
export const validateBaseModalProps = (props: unknown): BaseModalProps =>
  BaseModalPropsSchema.parse(props)

export const validateCreateGrantModalProps = (props: unknown): CreateGrantModalProps =>
  CreateGrantModalPropsSchema.parse(props)

export const validateReviewGrantModalProps = (props: unknown): ReviewGrantModalProps =>
  ReviewGrantModalPropsSchema.parse(props)

export const validateFilterBarProps = (props: unknown): FilterBarProps =>
  FilterBarPropsSchema.parse(props)

export const validateButtonProps = (props: unknown): ButtonProps => ButtonPropsSchema.parse(props)

// Type Guards
export const isValidModalProps = (props: unknown): props is BaseModalProps =>
  BaseModalPropsSchema.safeParse(props).success

export const isValidButtonProps = (props: unknown): props is ButtonProps =>
  ButtonPropsSchema.safeParse(props).success

// Default Props
export const DEFAULT_BUTTON_PROPS: Partial<ButtonProps> = {
  variant: 'default',
  size: 'md',
  type: 'button',
  disabled: false
}

export const DEFAULT_INPUT_PROPS: Partial<InputProps> = {
  type: 'text',
  disabled: false,
  required: false
}

export const DEFAULT_PAGINATION_PROPS: Partial<PaginationProps> = {
  showPageNumbers: true
}

// Component Display Names (for better debugging)
export const COMPONENT_DISPLAY_NAMES = {
  CREATE_GRANT_MODAL: 'CreateGrantModal',
  REVIEW_GRANT_MODAL: 'ReviewGrantModal',
  CREATE_PROGRAM_MODAL: 'CreateProgramModal',
  FILTER_BAR: 'FilterBar',
  APPLICATION_CARD: 'ApplicationCard',
  PROGRAM_CARD: 'ProgramCard',
  STATUS_BADGE: 'StatusBadge',
  SEARCH_INPUT: 'SearchInput',
  FORM_FIELD: 'FormField'
} as const
