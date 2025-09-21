// Luxe Theme Components Export
// This file exports all luxe-themed UI components for consistent styling

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
} from './luxe-dialog'

export { Button, buttonVariants } from './luxe-button'
export { Input } from './luxe-input'
export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent } from './luxe-card'
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton
} from './luxe-select'

// Luxe color palette for use in components
export const LUXE_COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  lightText: '#E0E0E0',
  charcoalDark: '#0F0F0F',
  charcoalLight: '#232323',
  plum: '#5A2A40',
  emerald: '#0F6F5C',
  error: '#FF6B6B',
  success: '#0F6F5C',
  warning: '#D4AF37',
  info: '#5A2A40'
} as const

// Luxe styling utilities
export const luxeStyles = {
  // Gradient text
  gradientText: {
    background: `linear-gradient(135deg, ${LUXE_COLORS.champagne} 0%, ${LUXE_COLORS.gold} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text'
  },

  // Gold button
  goldButton: {
    background: `linear-gradient(135deg, ${LUXE_COLORS.gold} 0%, ${LUXE_COLORS.goldDark} 100%)`,
    color: LUXE_COLORS.black,
    boxShadow: '0 4px 6px rgba(212, 175, 55, 0.2)'
  },

  // Card styling
  card: {
    backgroundColor: LUXE_COLORS.charcoalLight,
    border: `1px solid ${LUXE_COLORS.bronze}20`,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
  },

  // Modal backdrop
  backdrop: {
    backgroundColor: 'rgba(11, 11, 11, 0.85)',
    backdropFilter: 'blur(12px)'
  },

  // Subtle gradient overlay
  gradientOverlay: {
    background: `radial-gradient(circle at 0% 0%, ${LUXE_COLORS.gold}08 0%, transparent 50%),
                 radial-gradient(circle at 100% 100%, ${LUXE_COLORS.plum}05 0%, transparent 50%)`
  }
}
