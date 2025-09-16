import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils-hera-salon'

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-hera-primary-100 text-hera-primary-700 dark:bg-hera-primary-900/30 dark:text-hera-primary-400',
        secondary:
          'border-transparent bg-hera-bg text-hera-ink dark:bg-hera-bg-subtle dark:text-hera-ink',
        destructive:
          'border-transparent bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
        outline: 'border-hera-line-200 text-hera-ink dark:border-hera-border dark:text-hera-ink',
        success:
          'border-transparent bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
        warning:
          'border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        primary:
          'border-transparent bg-hera-primary-100 text-hera-primary-700 dark:bg-hera-primary-900/30 dark:text-hera-primary-400',
        pink: 'border-transparent bg-hera-pink-100 text-hera-pink-700 dark:bg-hera-pink-900/30 dark:text-hera-pink-400',
        teal: 'border-transparent bg-hera-teal-100 text-hera-teal-700 dark:bg-hera-teal-900/30 dark:text-hera-teal-400'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
