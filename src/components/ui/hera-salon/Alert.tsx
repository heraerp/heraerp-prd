import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils-hera-salon"
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"

const alertVariants = cva(
  "relative w-full rounded-lg border border-l-4 p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: 
          "bg-blue-50 border-blue-200 border-l-blue-500 text-blue-900 dark:bg-blue-950/10 dark:border-blue-800 dark:text-blue-200",
        destructive:
          "bg-red-50 border-red-200 border-l-red-500 text-red-900 dark:bg-red-950/10 dark:border-red-800 dark:text-red-200",
        success:
          "bg-green-50 border-green-200 border-l-green-500 text-green-900 dark:bg-green-950/10 dark:border-green-800 dark:text-green-200",
        warning:
          "bg-yellow-50 border-yellow-200 border-l-yellow-500 text-yellow-900 dark:bg-yellow-950/10 dark:border-yellow-800 dark:text-yellow-200",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => {
  const IconComponent = React.useMemo(() => {
    switch (variant) {
      case 'success':
        return CheckCircle2
      case 'warning':
        return AlertTriangle
      case 'destructive':
        return AlertCircle
      default:
        return Info
    }
  }, [variant])

  return (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <IconComponent className="h-4 w-4" />
      {props.children}
    </div>
  )
})
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-medium leading-none tracking-tight", className)}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm [&_p]:leading-relaxed", className)}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }