import * as React from 'react'
import { cn } from '@/lib/utils-hera-salon'
import { Eye, EyeOff } from 'lucide-react'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, leftIcon, rightIcon, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type

    return (
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-hera-ink-500">
            {leftIcon}
          </div>
        )}
        <input
          type={inputType}
          className={cn(
            'flex h-10 w-full rounded-md border bg-white px-3 py-2 text-sm shadow-hera-sm',
            'text-hera-ink-900 placeholder:text-hera-ink-500',
            'border-hera-line-200 focus-visible:border-transparent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hera-primary-400',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:bg-hera-card dark:border-hera-border dark:text-hera-ink',
            error && 'border-red-500 focus-visible:ring-red-300',
            leftIcon && 'pl-9',
            (rightIcon || isPassword) && 'pr-9',
            className
          )}
          ref={ref}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-hera-ink-500 hover:text-hera-ink-700"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </button>
        )}
        {rightIcon && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-hera-ink-500">
            {rightIcon}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

export { Input }
