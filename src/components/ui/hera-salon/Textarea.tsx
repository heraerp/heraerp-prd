import * as React from 'react'
import { cn } from '@/src/lib/utils-hera-salon'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md border bg-background px-3 py-2 text-sm shadow-hera-sm',
          'text-hera-ink-900 placeholder:text-hera-ink-500',
          'border-hera-line-200 focus-visible:border-transparent',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hera-primary-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'dark:bg-hera-card dark:border-hera-border dark:text-hera-ink',
          'resize-none',
          error && 'border-red-500 focus-visible:ring-red-300',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Textarea.displayName = 'Textarea'

export { Textarea }
