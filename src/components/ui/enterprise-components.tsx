/**
 * Enterprise UI Components
 * 
 * Reusable components that follow HERA's enterprise-grade design patterns
 * with proper color contrast and accessibility
 */

import { ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  AlertCircle, 
  Info,
  LucideIcon 
} from 'lucide-react'

// Types
export type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default'

interface StatusConfig {
  badge: string
  icon: LucideIcon
  iconClass: string
}

const STATUS_CONFIG: Record<StatusType, StatusConfig> = {
  success: {
    badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle,
    iconClass: 'text-emerald-600 dark:text-emerald-400'
  },
  warning: {
    badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    icon: Clock,
    iconClass: 'text-amber-600 dark:text-amber-400'
  },
  error: {
    badge: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    icon: XCircle,
    iconClass: 'text-red-600 dark:text-red-400'
  },
  info: {
    badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    icon: Info,
    iconClass: 'text-blue-600 dark:text-blue-400'
  },
  default: {
    badge: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700',
    icon: Info,
    iconClass: 'text-gray-600 dark:text-gray-400'
  }
}

// Page Layout Components

export interface EnterprisePageProps {
  children: ReactNode
  className?: string
}

export function EnterprisePage({ children, className }: EnterprisePageProps) {
  return (
    <div className={cn("min-h-screen bg-gray-50 dark:bg-gray-950", className)}>
      <div className="container mx-auto py-6 space-y-6">
        {children}
      </div>
    </div>
  )
}

export interface EnterprisePageHeaderProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EnterprisePageHeader({ 
  title, 
  description, 
  action,
  className 
}: EnterprisePageHeaderProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            {title}
          </h1>
          {description && (
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        {action && action}
      </div>
    </div>
  )
}

// Card Components

export interface EnterpriseCardProps {
  title?: string
  description?: string
  children: ReactNode
  className?: string
  status?: StatusType
  action?: ReactNode
  interactive?: boolean
}

export function EnterpriseCard({ 
  title, 
  description, 
  children,
  className,
  status,
  action,
  interactive = false
}: EnterpriseCardProps) {
  return (
    <Card className={cn(
      "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
      interactive && "transition-all duration-200 hover:shadow-lg",
      className
    )}>
      {(title || description || status || action) && (
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              {title && (
                <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {title}
                </CardTitle>
              )}
              {description && (
                <CardDescription className="text-gray-700 dark:text-gray-300 mt-1">
                  {description}
                </CardDescription>
              )}
            </div>
            {status && <EnterpriseStatusBadge status={status} />}
            {action && action}
          </div>
        </CardHeader>
      )}
      <CardContent className="text-gray-700 dark:text-gray-300">
        {children}
      </CardContent>
    </Card>
  )
}

// Stat Card Component

export interface EnterpriseStatCardProps {
  title: string
  value: string | number
  unit?: string
  icon?: LucideIcon
  iconColor?: string
  className?: string
}

export function EnterpriseStatCard({
  title,
  value,
  unit,
  icon: Icon,
  iconColor,
  className
}: EnterpriseStatCardProps) {
  return (
    <Card className={cn(
      "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700",
      className
    )}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon className={cn("h-5 w-5", iconColor || "text-gray-600 dark:text-gray-400")} />
          )}
          <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</span>
          {unit && (
            <span className="text-sm text-gray-600 dark:text-gray-400">{unit}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Status Components

export interface EnterpriseStatusBadgeProps {
  status: StatusType
  label?: string
  showIcon?: boolean
  className?: string
}

export function EnterpriseStatusBadge({ 
  status, 
  label,
  showIcon = true,
  className 
}: EnterpriseStatusBadgeProps) {
  const config = STATUS_CONFIG[status]
  const Icon = config.icon

  return (
    <Badge className={cn("gap-1", config.badge, className)}>
      {showIcon && <Icon className="h-3 w-3" />}
      {label || status.charAt(0).toUpperCase() + status.slice(1)}
    </Badge>
  )
}

// Info/Alert Card Component

export interface EnterpriseInfoCardProps {
  title: string
  description?: string
  type?: 'info' | 'warning' | 'success' | 'error'
  items?: string[]
  children?: ReactNode
  className?: string
}

export function EnterpriseInfoCard({
  title,
  description,
  type = 'info',
  items,
  children,
  className
}: EnterpriseInfoCardProps) {
  const config = STATUS_CONFIG[type]
  const Icon = config.icon

  const gradientMap = {
    info: 'from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 border-blue-200 dark:border-blue-800',
    warning: 'from-amber-50 to-orange-50 dark:from-gray-800 dark:to-gray-900 border-amber-200 dark:border-amber-800',
    success: 'from-emerald-50 to-green-50 dark:from-gray-800 dark:to-gray-900 border-emerald-200 dark:border-emerald-800',
    error: 'from-red-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 border-red-200 dark:border-red-800'
  }

  const bulletColorMap = {
    info: 'text-blue-600 dark:text-blue-400',
    warning: 'text-amber-600 dark:text-amber-400',
    success: 'text-emerald-600 dark:text-emerald-400',
    error: 'text-red-600 dark:text-red-400'
  }

  return (
    <Card className={cn(
      "bg-gradient-to-br",
      gradientMap[type],
      className
    )}>
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            type === 'info' && "bg-blue-100 dark:bg-blue-900/50",
            type === 'warning' && "bg-amber-100 dark:bg-amber-900/50",
            type === 'success' && "bg-emerald-100 dark:bg-emerald-900/50",
            type === 'error' && "bg-red-100 dark:bg-red-900/50"
          )}>
            <Icon className={cn("h-5 w-5", config.iconClass)} />
          </div>
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {description}
              </CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      {(items || children) && (
        <CardContent>
          {items && (
            <ul className="space-y-3 text-sm">
              {items.map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className={cn("font-semibold mt-0.5", bulletColorMap[type])}>→</span>
                  <span className="text-gray-700 dark:text-gray-300">{item}</span>
                </li>
              ))}
            </ul>
          )}
          {children}
        </CardContent>
      )}
    </Card>
  )
}

// Button Components

export interface EnterpriseButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  onClick?: () => void
  disabled?: boolean
  icon?: LucideIcon
}

export function EnterpriseButton({
  children,
  variant = 'primary',
  size = 'md',
  className,
  onClick,
  disabled,
  icon: Icon
}: EnterpriseButtonProps) {
  const variantClasses = {
    primary: "bg-blue-600 dark:bg-blue-700 text-white hover:opacity-90",
    secondary: "border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800",
    ghost: "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100",
    danger: "bg-red-600 dark:bg-red-700 text-white hover:opacity-90"
  }

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg"
  }

  return (
    <Button
      onClick={onClick}
      disabled={disabled}
      variant={variant === 'secondary' ? 'outline' : variant === 'ghost' ? 'ghost' : 'default'}
      className={cn(
        variantClasses[variant],
        sizeClasses[size],
        "font-semibold",
        className
      )}
    >
      {Icon && <Icon className="h-4 w-4 mr-2" />}
      {children}
    </Button>
  )
}

// Feature List Component

export interface EnterpriseFeatureListProps {
  features: string[]
  bulletColor?: string
  className?: string
}

export function EnterpriseFeatureList({ 
  features, 
  bulletColor,
  className 
}: EnterpriseFeatureListProps) {
  return (
    <ul className={cn("text-sm space-y-1", className)}>
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
          <span className={cn(
            "font-semibold mt-0.5", 
            bulletColor || "text-gray-600 dark:text-gray-400"
          )}>
            •
          </span>
          <span>{feature}</span>
        </li>
      ))}
    </ul>
  )
}

// Text Components

export function EnterpriseTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h1 className={cn("text-3xl font-bold text-gray-900 dark:text-gray-100", className)}>
      {children}
    </h1>
  )
}

export function EnterpriseSubtitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("text-gray-600 dark:text-gray-400 mt-1", className)}>
      {children}
    </p>
  )
}

export function EnterpriseSectionTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={cn("text-lg font-semibold text-gray-900 dark:text-gray-100", className)}>
      {children}
    </h2>
  )
}