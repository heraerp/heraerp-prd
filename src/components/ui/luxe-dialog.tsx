import * as React from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Luxe color palette
const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#B794F4',
  emerald: '#0F6F5C'
}

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    style={{
      backgroundColor: 'rgba(11, 11, 11, 0.90)', // Darker black with more opacity
      backdropFilter: 'blur(8px)'
    }}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 p-6 shadow-2xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] rounded-xl',
        'mx-auto my-8 max-h-[calc(100vh-4rem)] sm:max-h-[calc(100vh-8rem)] overflow-hidden',
        className
      )}
      style={{
        backgroundColor: COLORS.charcoal,
        border: `1px solid ${COLORS.bronze}33`,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.1)',
        position: 'fixed'
      }}
      {...props}
    >
      {/* Gradient overlay for depth */}
      <div
        className="absolute inset-0 pointer-events-none rounded-xl"
        style={{
          background: `radial-gradient(circle at 0% 0%, ${COLORS.gold}08 0%, transparent 50%),
                       radial-gradient(circle at 100% 100%, ${COLORS.plum}05 0%, transparent 50%)`
        }}
      />

      <div className="relative z-10">{children}</div>

      <DialogPrimitive.Close
        className="absolute right-4 top-4 rounded-lg transition-all hover:scale-110 focus:outline-none focus:ring-2 disabled:pointer-events-none p-2 z-50"
        style={{
          backgroundColor: `${COLORS.gold}20`,
          border: `1px solid ${COLORS.gold}40`,
          color: COLORS.gold
        }}
      >
        <X className="h-5 w-5" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>

      {/* ===== DATE INPUT CALENDAR ICON STYLING ===== */}
      <style jsx global>{`
        /* Make entire date input field clickable to open calendar picker */
        input[type="date"] {
          cursor: pointer !important;
          position: relative !important;
        }

        /* Webkit browsers (Chrome, Safari, Edge) - Make calendar icon cover entire field */
        input[type="date"]::-webkit-calendar-picker-indicator {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>') !important;
          cursor: pointer !important;
          opacity: 1 !important;
          filter: none !important;
          /* Make the clickable area cover the entire input field */
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100% !important;
          height: 100% !important;
          padding: 0 !important;
          margin: 0 !important;
          /* Position the icon on the right side */
          background-position: right 0.75rem center !important;
          background-repeat: no-repeat !important;
          background-size: 20px 20px !important;
        }

        /* Hover effect for calendar icon */
        input[type="date"]:hover::-webkit-calendar-picker-indicator {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23F0D06B" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>') !important;
          opacity: 1 !important;
        }

        /* Firefox - Make entire field clickable */
        input[type="date"]::-moz-calendar-picker-indicator {
          background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="%23D4AF37" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>') !important;
          cursor: pointer !important;
          opacity: 1 !important;
          filter: none !important;
          width: 100% !important;
          height: 100% !important;
        }

        /* Focus state for date inputs */
        input[type="date"]:focus {
          border-color: ${COLORS.gold} !important;
          box-shadow: 0 0 0 2px ${COLORS.gold}30 !important;
          outline: none !important;
        }

        /* Hover state for date inputs */
        input[type="date"]:hover {
          border-color: ${COLORS.gold}50 !important;
          box-shadow: 0 0 0 1px ${COLORS.gold}20 !important;
        }
      `}</style>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn('flex flex-col space-y-2 text-center sm:text-left pb-4 mb-4', className)}
    style={{
      borderBottom: `1px solid ${COLORS.bronze}20`
    }}
    {...props}
  />
)
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 pt-4 mt-4',
      className
    )}
    style={{
      borderTop: `1px solid ${COLORS.bronze}20`
    }}
    {...props}
  />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-xl font-semibold leading-none tracking-tight', className)}
    style={{
      background: `linear-gradient(135deg, ${COLORS.champagne} 0%, ${COLORS.gold} 100%)`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text'
    }}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm', className)}
    style={{
      color: COLORS.lightText,
      opacity: 0.8
    }}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
}
