'use client'
import '@/styles/dialog-overrides.css'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { universalApi } from '@/lib/universal-api-v2'
import { formatCurrency } from '@/lib/universal-helpers'
import Image from 'next/image'
import {
  ShoppingCart,
  Plus,
  Minus,
  X,
  CreditCard,
  DollarSign,
  Percent,
  User,
  Search,
  Receipt,
  Calculator,
  Loader2,
  Check,
  ArrowLeft,
  Grid3x3,
  List,
  Clock,
  Phone,
  ChevronRight,
  AlertCircle,
  Trash2,
  UserPlus,
  Star,
  Sparkles,
  ShoppingBag,
  Scissors,
  Palette,
  Waves,
  Heart,
  Eye,
  Droplet,
  Wind,
  Sun,
  Zap,
  Crown,
  Calendar,
  Users
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'
import Link from 'next/link'
import { useBranchFilter } from '@/hooks/useBranchFilter'
import { BranchSelector } from '@/components/ui/BranchSelector'
import { postEventWithBranch } from '@/lib/playbook/finance'
import { usePosCheckout, type PosCartItem, type PosPayment } from '@/hooks/usePosCheckout'

interface SalonPOSTerminalProps {
  organizationId: string
  smartCodes: Record<string, string>
  isDemoMode?: boolean
  defaultBranchId?: string
}

interface SalonService {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    category?: string
    price?: number
    description?: string
    image_url?: string
    available?: boolean
    duration?: number // in minutes
    tags?: string[]
    rating?: number
    popular?: boolean
    requires_consultation?: boolean
    recommended_addons?: string[]
  }
}

interface Stylist {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    role?: string
    specialties?: string[]
    experience_years?: number
    rating?: number
    image_url?: string
    available?: boolean
    schedule?: any[]
  }
}

interface CartItem {
  service: SalonService
  quantity: number
  stylist?: Stylist
  addons?: SalonService[]
  notes?: string
}

interface SalonChair {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    chair_number?: number
    station_type?: string // 'hair' | 'nail' | 'facial' | 'massage'
    status?: string // 'available' | 'occupied' | 'maintenance'
    location?: string
  }
}

// Category icons for salon services
const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Hair Cut': Scissors,
  'Hair Color': Palette,
  'Hair Styling': Waves,
  'Hair Treatment': Droplet,
  Facial: Heart,
  Makeup: Eye,
  'Manicure & Pedicure': Crown,
  'Special Packages': Sparkles,
  RETAIL: ShoppingBag,
  'Hair Services': Scissors,
  'Nail Services': Crown,
  'Spa Services': Heart,
  'Retail Products': ShoppingBag
}

// Beautiful gradient backgrounds for categories
const CATEGORY_GRADIENTS: Record<string, string> = {
  'Hair Cut': 'from-rose-400/20 to-pink-500/20',
  'Hair Color': 'from-purple-400/20 to-violet-500/20',
  'Hair Styling': 'from-blue-400/20 to-indigo-500/20',
  'Hair Treatment': 'from-emerald-400/20 to-teal-500/20',
  Facial: 'from-pink-400/20 to-rose-500/20',
  Makeup: 'from-amber-400/20 to-orange-500/20',
  'Manicure & Pedicure': 'from-fuchsia-400/20 to-purple-500/20',
  'Special Packages': 'from-violet-400/20 to-indigo-500/20',
  RETAIL: 'from-cyan-400/20 to-blue-500/20',
  'Hair Services': 'from-rose-400/20 to-pink-500/20',
  'Nail Services': 'from-fuchsia-400/20 to-purple-500/20',
  'Spa Services': 'from-pink-400/20 to-rose-500/20',
  'Retail Products': 'from-cyan-400/20 to-blue-500/20'
}

// Animated background component
const AnimatedBackground = () => (
  <div className="fixed inset-0 -z-10 overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
    <div className="absolute -top-40 -right-40 h-80 w-80 animate-blob rounded-full bg-purple-500 mix-blend-multiply blur-xl opacity-20"></div>
    <div className="absolute -bottom-40 -left-40 h-80 w-80 animate-blob rounded-full bg-pink-500 mix-blend-multiply blur-xl animation-delay-2000"></div>
    <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 animate-blob rounded-full bg-indigo-500 mix-blend-multiply blur-xl opacity-20 animation-delay-4000"></div>
  </div>
)

// Dialog components with glassmorphism
const Dialog = DialogPrimitive.Root
const DialogTrigger = DialogPrimitive.Trigger
const DialogPortal = DialogPrimitive.Portal
const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
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
        'fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border border-white/10 bg-background/10 backdrop-blur-xl p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]',
        className
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

export function SalonPOSTerminalGlass({
  organizationId,
  smartCodes,
  isDemoMode = false,
  defaultBranchId
}: SalonPOSTerminalProps) {
  const [loading, setLoading] = useState(true)
  const [services, setServices] = useState<SalonService[]>([])
  const [stylists, setStylists] = useState<Stylist[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [activeCartId, setActiveCartId] = useState<string | null>(null)
  const [cartMode, setCartMode] = useState<'legacy' | 'playbook'>('legacy')
  const [isCartCollapsed, setIsCartCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [appointmentDate, setAppointmentDate] = useState('')
  const [appointmentTime, setAppointmentTime] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)
  const [showPayment, setShowPayment] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'online'>('cash')
  const [discountPercent, setDiscountPercent] = useState(0)
  const [processing, setProcessing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [cashReceived, setCashReceived] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null)
  const [showStylistSelection, setShowStylistSelection] = useState(false)
  const [currentServiceForStylist, setCurrentServiceForStylist] = useState<SalonService | null>(
    null
  )
  const [chairs, setChairs] = useState<SalonChair[]>([])
  const [selectedChair, setSelectedChair] = useState<SalonChair | null>(null)
  const [receipt, setReceipt] = useState<any>(null)
  const [lineLoading, setLineLoading] = useState<boolean>(false)

  // New state for appointment loading
  const [showAppointmentLoader, setShowAppointmentLoader] = useState(false)
  const [appointmentSearchTerm, setAppointmentSearchTerm] = useState('')
  const [loadedAppointment, setLoadedAppointment] = useState<any | null>(null)
  const [searchResults, setSearchResults] = useState<{
    customers?: any[]
    appointments?: any[]
  } | null>(null)

  // Branch filter hook
  const {
    branchId,
    branches,
    loading: branchesLoading,
    setBranchId,
    selectedBranch
  } = useBranchFilter(defaultBranchId, 'pos-terminal')

  // POS Checkout hook (RPC pattern)
  const { processCheckout, isProcessing, error: checkoutError, clearError } = usePosCheckout()

  // Load initial data
  useEffect(() => {
    if (!isDemoMode) {
      universalApi.setOrganizationId(organizationId)
    }
    loadData()
  }, [isDemoMode, organizationId])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      if (isDemoMode) {
        // Use demo data
        setServices(generateDemoServices())
        setStylists(generateDemoStylists())
        setChairs(generateDemoChairs())
      } else {
        // Load real data from database
        // Load all entities and filter by smart codes
        const entitiesResponse = await universalApi.read('core_entities')
        const allEntities =
          entitiesResponse.success && entitiesResponse.data ? entitiesResponse.data : []

        // Filter entities by organization and smart codes
        const orgEntities = allEntities.filter(
          e => e.organization_id === organizationId && e.status === 'active'
        )

        // Filter services by smart code pattern
        const serviceData = orgEntities.filter(
          e =>
            e.smart_code &&
            (e.smart_code.startsWith('HERA.SALON.SVC.') || e.entity_type === 'service')
        )

        // Also include products (retail items) as services
        const productData = orgEntities.filter(
          e =>
            e.smart_code &&
            (e.smart_code.startsWith('HERA.SALON.PRD.') ||
              e.smart_code.startsWith('HERA.SALON.RETAIL.') ||
              e.entity_type === 'product')
        )

        // Combine services and products, ensuring products have RETAIL category
        const allServices = [
          ...serviceData,
          ...productData.map(p => ({
            ...p,
            metadata: {
              ...p.metadata,
              category: p.metadata?.category || 'RETAIL'
            }
          }))
        ]

        console.log(
          'Found services:',
          serviceData.length,
          'products:',
          productData.length,
          'total:',
          allServices.length
        )

        // Set the services we found
        if (allServices && allServices.length > 0) {
          setServices(allServices)
        } else {
          // Only create defaults if absolutely no services exist
          console.log('No services found, creating defaults...')
          await createDefaultSalonServices()
        }

        // Filter stylists by smart code or entity type
        const stylistData = orgEntities.filter(
          e =>
            e.smart_code &&
            (e.smart_code.startsWith('HERA.SALON.STAFF.') ||
              e.smart_code.startsWith('HERA.SALON.HR.') ||
              e.entity_type === 'employee')
        )

        console.log('Found stylists:', stylistData.length, stylistData)

        // Set the stylists we found
        if (stylistData && stylistData.length > 0) {
          setStylists(stylistData)
        } else {
          // Only create defaults if absolutely no stylists exist
          console.log('No stylists found, creating defaults...')
          await createDefaultStylists()
        }

        // Filter chairs/stations
        const chairData = orgEntities.filter(
          e =>
            e.entity_type === 'chair' ||
            (e.smart_code && e.smart_code.startsWith('HERA.SALON.CHAIR.'))
        )

        // Set the chairs we found
        if (chairData && chairData.length > 0) {
          setChairs(chairData)
        } else {
          // Only create defaults if absolutely no chairs exist
          console.log('No chairs found, creating defaults...')
          await createDefaultChairs()
        }
      }

      // Important: Set loading to false after data is loaded
      console.log('Data loaded successfully, setting loading to false')
      setLoading(false)
    } catch (err) {
      console.error('Error loading data:', err)
      setError('Failed to load data. Please refresh.')
      // Fall back to demo data on error
      setServices(generateDemoServices())
      setStylists(generateDemoStylists())
      setChairs(generateDemoChairs())
      setLoading(false)
    } finally {
      // Ensure loading is always set to false
      setLoading(false)
    }
  }

  const createDefaultSalonServices = async () => {
    const defaultServices = generateDemoServices()
    const createdServices: SalonService[] = []

    for (const service of defaultServices.slice(0, 15)) {
      // Create first 15 services
      try {
        const result = await universalApi.createEntity({
          entity_type: 'service',
          entity_name: service.entity_name,
          entity_code: service.entity_code,
          smart_code: smartCodes.SERVICE,
          metadata: service.metadata,
          organization_id: organizationId
        })

        if (result.success && result.data) {
          createdServices.push(result.data as SalonService)
        }
      } catch (err) {
        console.error('Error creating service:', err)
      }
    }

    setServices(createdServices.length > 0 ? createdServices : defaultServices)
  }

  const createDefaultStylists = async () => {
    const defaultStylists = generateDemoStylists()
    const createdStylists: Stylist[] = []

    for (const stylist of defaultStylists) {
      try {
        const result = await universalApi.createEntity({
          entity_type: 'employee',
          entity_name: stylist.entity_name,
          entity_code: stylist.entity_code,
          smart_code: smartCodes.STYLIST,
          metadata: stylist.metadata,
          organization_id: organizationId
        })

        if (result.success && result.data) {
          createdStylists.push(result.data as Stylist)
        }
      } catch (err) {
        console.error('Error creating stylist:', err)
      }
    }

    setStylists(createdStylists.length > 0 ? createdStylists : defaultStylists)
  }

  const createDefaultChairs = async () => {
    const defaultChairs = generateDemoChairs()
    const createdChairs: SalonChair[] = []

    for (const chair of defaultChairs) {
      try {
        const result = await universalApi.createEntity({
          entity_type: 'chair',
          entity_name: chair.entity_name,
          entity_code: chair.entity_code,
          smart_code: 'HERA.SALON.STATION.CHAIR.V1',
          metadata: chair.metadata,
          organization_id: organizationId
        })

        if (result.success && result.data) {
          createdChairs.push(result.data as SalonChair)
        }
      } catch (err) {
        console.error('Error creating chair:', err)
      }
    }

    setChairs(createdChairs.length > 0 ? createdChairs : defaultChairs)
  }

  // Generate demo services with images
  const generateDemoServices = (): SalonService[] => [
    // Hair Cut
    {
      id: '1',
      entity_name: 'Classic Haircut',
      entity_code: 'SVC-001',
      metadata: {
        category: 'Hair Cut',
        price: 35,
        description: 'Professional haircut with styling',
        available: true,
        duration: 45,
        image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400',
        rating: 4.8,
        popular: true,
        tags: ['Men', 'Women', 'Popular']
      }
    },
    {
      id: '2',
      entity_name: 'Premium Haircut & Style',
      entity_code: 'SVC-002',
      metadata: {
        category: 'Hair Cut',
        price: 55,
        description: 'Haircut with premium styling and consultation',
        available: true,
        duration: 60,
        image_url: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?w=400',
        rating: 4.9,
        popular: true,
        tags: ['Premium', 'Styling']
      }
    },
    {
      id: '3',
      entity_name: 'Kids Haircut',
      entity_code: 'SVC-003',
      metadata: {
        category: 'Hair Cut',
        price: 25,
        description: 'Fun and quick haircut for children',
        available: true,
        duration: 30,
        image_url: 'https://images.unsplash.com/photo-1595452767577-e3f0d1a1f7e3?w=400',
        rating: 4.7,
        tags: ['Kids']
      }
    },
    // Hair Color
    {
      id: '4',
      entity_name: 'Full Hair Color',
      entity_code: 'SVC-004',
      metadata: {
        category: 'Hair Color',
        price: 120,
        description: 'Complete hair coloring with premium products',
        available: true,
        duration: 120,
        image_url: 'https://images.unsplash.com/photo-1522336572468-97b06e8ef143?w=400',
        rating: 4.8,
        popular: true,
        requires_consultation: true,
        tags: ['Color', 'Transform']
      }
    },
    {
      id: '5',
      entity_name: 'Highlights',
      entity_code: 'SVC-005',
      metadata: {
        category: 'Hair Color',
        price: 150,
        description: 'Professional highlights for dimension',
        available: true,
        duration: 150,
        image_url: 'https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=400',
        rating: 4.9,
        popular: true,
        tags: ['Highlights', 'Trending']
      }
    },
    {
      id: '6',
      entity_name: 'Balayage',
      entity_code: 'SVC-006',
      metadata: {
        category: 'Hair Color',
        price: 200,
        description: 'Hand-painted balayage technique',
        available: true,
        duration: 180,
        image_url: 'https://images.unsplash.com/photo-1560869713-bf165a9cfac8?w=400',
        rating: 5.0,
        popular: true,
        tags: ['Balayage', 'Premium']
      }
    },
    // Hair Styling
    {
      id: '7',
      entity_name: 'Blowdry & Style',
      entity_code: 'SVC-007',
      metadata: {
        category: 'Hair Styling',
        price: 45,
        description: 'Professional blowdry and styling',
        available: true,
        duration: 45,
        image_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400',
        rating: 4.7,
        tags: ['Styling', 'Popular']
      }
    },
    {
      id: '8',
      entity_name: 'Special Event Updo',
      entity_code: 'SVC-008',
      metadata: {
        category: 'Hair Styling',
        price: 95,
        description: 'Elegant updo for special occasions',
        available: true,
        duration: 90,
        image_url: 'https://images.unsplash.com/photo-1553521041-d168abd31de3?w=400',
        rating: 4.9,
        popular: true,
        tags: ['Wedding', 'Event']
      }
    },
    {
      id: '9',
      entity_name: 'Beach Waves',
      entity_code: 'SVC-009',
      metadata: {
        category: 'Hair Styling',
        price: 55,
        description: 'Effortless beachy wave styling',
        available: true,
        duration: 60,
        image_url: 'https://images.unsplash.com/photo-1492106087820-71f1a00d2b11?w=400',
        rating: 4.8,
        tags: ['Waves', 'Summer']
      }
    },
    // Hair Treatment
    {
      id: '10',
      entity_name: 'Deep Conditioning',
      entity_code: 'SVC-010',
      metadata: {
        category: 'Hair Treatment',
        price: 65,
        description: 'Intensive moisture treatment',
        available: true,
        duration: 60,
        image_url: 'https://images.unsplash.com/photo-1550159930-40066082a4fc?w=400',
        rating: 4.8,
        tags: ['Treatment', 'Repair']
      }
    },
    {
      id: '11',
      entity_name: 'Keratin Treatment',
      entity_code: 'SVC-011',
      metadata: {
        category: 'Hair Treatment',
        price: 250,
        description: 'Smoothing keratin treatment',
        available: true,
        duration: 180,
        image_url: 'https://images.unsplash.com/photo-1519699047748-de8e457a634e?w=400',
        rating: 4.9,
        popular: true,
        requires_consultation: true,
        tags: ['Keratin', 'Premium']
      }
    },
    // Facial
    {
      id: '12',
      entity_name: 'Classic Facial',
      entity_code: 'SVC-012',
      metadata: {
        category: 'Facial',
        price: 85,
        description: 'Rejuvenating facial treatment',
        available: true,
        duration: 60,
        image_url: 'https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=400',
        rating: 4.8,
        popular: true,
        tags: ['Facial', 'Relaxing']
      }
    },
    {
      id: '13',
      entity_name: 'Anti-Aging Facial',
      entity_code: 'SVC-013',
      metadata: {
        category: 'Facial',
        price: 120,
        description: 'Advanced anti-aging treatment',
        available: true,
        duration: 90,
        image_url: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?w=400',
        rating: 4.9,
        tags: ['Anti-aging', 'Premium']
      }
    },
    // Makeup
    {
      id: '14',
      entity_name: 'Professional Makeup',
      entity_code: 'SVC-014',
      metadata: {
        category: 'Makeup',
        price: 75,
        description: 'Full face makeup application',
        available: true,
        duration: 60,
        image_url: 'https://images.unsplash.com/photo-1487412840181-e99b3022ea05?w=400',
        rating: 4.8,
        popular: true,
        tags: ['Makeup', 'Events']
      }
    },
    {
      id: '15',
      entity_name: 'Bridal Makeup',
      entity_code: 'SVC-015',
      metadata: {
        category: 'Makeup',
        price: 150,
        description: 'Premium bridal makeup with trial',
        available: true,
        duration: 120,
        image_url: 'https://images.unsplash.com/photo-1519125323398-675f0ddb6308?w=400',
        rating: 5.0,
        popular: true,
        tags: ['Bridal', 'Premium']
      }
    },
    // Manicure & Pedicure
    {
      id: '16',
      entity_name: 'Classic Manicure',
      entity_code: 'SVC-016',
      metadata: {
        category: 'Manicure & Pedicure',
        price: 35,
        description: 'Traditional manicure with polish',
        available: true,
        duration: 45,
        image_url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=400',
        rating: 4.7,
        tags: ['Nails', 'Classic']
      }
    },
    {
      id: '17',
      entity_name: 'Gel Manicure',
      entity_code: 'SVC-017',
      metadata: {
        category: 'Manicure & Pedicure',
        price: 55,
        description: 'Long-lasting gel polish manicure',
        available: true,
        duration: 60,
        image_url: 'https://images.unsplash.com/photo-1610992015732-2449b76344bc?w=400',
        rating: 4.8,
        popular: true,
        tags: ['Gel', 'Long-lasting']
      }
    },
    {
      id: '18',
      entity_name: 'Spa Pedicure',
      entity_code: 'SVC-018',
      metadata: {
        category: 'Manicure & Pedicure',
        price: 65,
        description: 'Luxurious spa pedicure experience',
        available: true,
        duration: 75,
        image_url: 'https://images.unsplash.com/photo-1519415510236-718bdfcd89c8?w=400',
        rating: 4.9,
        popular: true,
        tags: ['Spa', 'Relaxing']
      }
    },
    // Special Packages
    {
      id: '19',
      entity_name: 'Pamper Package',
      entity_code: 'SVC-019',
      metadata: {
        category: 'Special Packages',
        price: 199,
        description: 'Haircut, color, style & manicure',
        available: true,
        duration: 240,
        image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400',
        rating: 4.9,
        popular: true,
        tags: ['Package', 'Value']
      }
    },
    {
      id: '20',
      entity_name: 'Bridal Package',
      entity_code: 'SVC-020',
      metadata: {
        category: 'Special Packages',
        price: 450,
        description: 'Complete bridal preparation package',
        available: true,
        duration: 360,
        image_url: 'https://images.unsplash.com/photo-1519741347686-c1e0aadf4611?w=400',
        rating: 5.0,
        popular: true,
        tags: ['Bridal', 'Ultimate']
      }
    }
  ]

  // Generate demo stylists
  const generateDemoStylists = (): Stylist[] => [
    {
      id: '1',
      entity_name: 'Sarah Johnson',
      entity_code: 'STY-001',
      metadata: {
        role: 'Senior Stylist',
        specialties: ['Color Specialist', 'Balayage Expert'],
        experience_years: 8,
        rating: 4.9,
        image_url: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=400',
        available: true
      }
    },
    {
      id: '2',
      entity_name: 'Michael Chen',
      entity_code: 'STY-002',
      metadata: {
        role: 'Master Stylist',
        specialties: ["Men's Cuts", 'Beard Styling'],
        experience_years: 10,
        rating: 4.8,
        image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
        available: true
      }
    },
    {
      id: '3',
      entity_name: 'Emma Rodriguez',
      entity_code: 'STY-003',
      metadata: {
        role: 'Color Expert',
        specialties: ['Hair Color', 'Highlights', 'Color Correction'],
        experience_years: 6,
        rating: 4.9,
        image_url: 'https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=400',
        available: true
      }
    },
    {
      id: '4',
      entity_name: 'David Kim',
      entity_code: 'STY-004',
      metadata: {
        role: 'Style Director',
        specialties: ['Creative Cuts', 'Fashion Colors'],
        experience_years: 12,
        rating: 5.0,
        image_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
        available: true
      }
    }
  ]

  // Generate demo chairs/stations
  const generateDemoChairs = (): SalonChair[] => [
    // Hair Stations
    {
      id: 'chair-1',
      entity_name: 'Hair Station 1',
      entity_code: 'CHAIR-001',
      metadata: {
        chair_number: 1,
        station_type: 'hair',
        status: 'available',
        location: 'Main Floor'
      }
    },
    {
      id: 'chair-2',
      entity_name: 'Hair Station 2',
      entity_code: 'CHAIR-002',
      metadata: {
        chair_number: 2,
        station_type: 'hair',
        status: 'available',
        location: 'Main Floor'
      }
    },
    {
      id: 'chair-3',
      entity_name: 'Hair Station 3',
      entity_code: 'CHAIR-003',
      metadata: {
        chair_number: 3,
        station_type: 'hair',
        status: 'occupied',
        location: 'Main Floor'
      }
    },
    {
      id: 'chair-4',
      entity_name: 'Hair Station 4',
      entity_code: 'CHAIR-004',
      metadata: {
        chair_number: 4,
        station_type: 'hair',
        status: 'available',
        location: 'Main Floor'
      }
    },
    // Nail Stations
    {
      id: 'chair-5',
      entity_name: 'Nail Station 1',
      entity_code: 'CHAIR-005',
      metadata: {
        chair_number: 1,
        station_type: 'nail',
        status: 'available',
        location: 'Nail Bar'
      }
    },
    {
      id: 'chair-6',
      entity_name: 'Nail Station 2',
      entity_code: 'CHAIR-006',
      metadata: {
        chair_number: 2,
        station_type: 'nail',
        status: 'available',
        location: 'Nail Bar'
      }
    },
    {
      id: 'chair-7',
      entity_name: 'Pedicure Station 1',
      entity_code: 'CHAIR-007',
      metadata: {
        chair_number: 1,
        station_type: 'nail',
        status: 'maintenance',
        location: 'Nail Bar'
      }
    },
    // Facial Rooms
    {
      id: 'chair-8',
      entity_name: 'Facial Room 1',
      entity_code: 'CHAIR-008',
      metadata: {
        chair_number: 1,
        station_type: 'facial',
        status: 'available',
        location: 'Treatment Area'
      }
    },
    {
      id: 'chair-9',
      entity_name: 'Facial Room 2',
      entity_code: 'CHAIR-009',
      metadata: {
        chair_number: 2,
        station_type: 'facial',
        status: 'available',
        location: 'Treatment Area'
      }
    },
    // Massage Room
    {
      id: 'chair-10',
      entity_name: 'Massage Room 1',
      entity_code: 'CHAIR-010',
      metadata: {
        chair_number: 1,
        station_type: 'massage',
        status: 'available',
        location: 'Spa Area'
      }
    }
  ]

  // Helper function to get chairs by type
  const getChairsByType = (type: string) => {
    return chairs.filter(chair => chair.metadata?.station_type === type)
  }

  // Get unique categories
  const categories = [
    'all',
    ...new Set(services.map(item => item.metadata?.category).filter(Boolean))
  ]

  // Filter services
  const filteredServices = services.filter(item => {
    const matchesCategory =
      selectedCategory === 'all' || item.metadata?.category === selectedCategory
    const matchesSearch =
      item.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Cart functions
  const addToCart = async (service: SalonService, stylist?: Stylist) => {
    if (cartMode === 'playbook' && activeCartId) {
      // Use playbook API for Hair Talkz
      await addLine(service.id, 'SERVICE', 1, stylist?.id)
    } else {
      // Fallback to legacy mode
      setCart(prev => {
        const existing = prev.find(
          item => item.service.id === service.id && (!stylist || item.stylist?.id === stylist.id)
        )

        if (existing) {
          return prev.map(item =>
            item.service.id === service.id && (!stylist || item.stylist?.id === stylist.id)
              ? { ...item, quantity: item.quantity + 1 }
              : item
          )
        } else {
          return [...prev, { service, quantity: 1, stylist }]
        }
      })
    }
  }

  const updateQuantity = (serviceId: string, delta: number, stylistId?: string) => {
    setCart(
      prev =>
        prev
          .map(item => {
            if (item.service.id === serviceId && (!stylistId || item.stylist?.id === stylistId)) {
              const newQuantity = item.quantity + delta
              return newQuantity > 0 ? { ...item, quantity: newQuantity } : null
            }
            return item
          })
          .filter(Boolean) as CartItem[]
    )
  }

  const removeFromCart = (serviceId: string, stylistId?: string) => {
    setCart(prev =>
      prev.filter(
        item => !(item.service.id === serviceId && (!stylistId || item.stylist?.id === stylistId))
      )
    )
  }

  const handleServiceClick = (service: SalonService) => {
    setCurrentServiceForStylist(service)
    setShowStylistSelection(true)
  }

  const handleStylistSelect = async (stylist: Stylist | null) => {
    if (currentServiceForStylist && selectedChair) {
      const stylistToUse = stylist && stylist.id !== 'no-preference' ? stylist : undefined
      await addToCart(currentServiceForStylist, stylistToUse)
      setShowStylistSelection(false)
      setCurrentServiceForStylist(null)
      setSelectedStylist(null)
      setSelectedChair(null)
    }
  }

  // Playbook API functions
  const addLine = async (
    entityId: string,
    kind: 'SERVICE' | 'RETAIL',
    qty = 1,
    stylistId?: string
  ) => {
    if (!activeCartId || lineLoading) return
    setLineLoading(true)
    try {
      const body = {
        organization_id: organizationId,
        line_type: kind,
        entity_id: entityId,
        quantity: qty,
        ...(stylistId
          ? { staff_id: stylistId, staff_split: [{ staff_id: stylistId, pct: 100 }] }
          : {}),
        metadata: { source: 'MANUAL' }
      }
      await fetch(`/api/v1/salon/pos/carts/${activeCartId}/lines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
        body: JSON.stringify(body)
      })
      await refreshCart()
    } finally {
      setLineLoading(false)
    }
  }

  const updateLine = async (lineId: string, patch: any) => {
    if (!activeCartId) return
    await fetch(`/api/v1/salon/pos/carts/${activeCartId}/lines/${lineId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ organization_id: organizationId, ...patch })
    })
    await refreshCart()
  }

  const removeLine = async (lineId: string) => {
    if (!activeCartId) return
    await fetch(`/api/v1/salon/pos/carts/${activeCartId}/lines/${lineId}`, {
      method: 'DELETE',
      headers: { 'Idempotency-Key': crypto.randomUUID() }
    })
    await refreshCart()
  }

  const reprice = async ({
    discount,
    tip
  }: {
    discount?: { type: 'percent' | 'amount'; value: number; reason?: string }
    tip?: { amount: number; method: 'cash' | 'card' }
  } = {}) => {
    if (!activeCartId) return
    await fetch(`/api/v1/salon/pos/carts/${activeCartId}/reprice`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ organization_id: organizationId, discount, tip })
    })
    await refreshCart()
  }

  const refreshCart = async () => {
    if (!activeCartId) return
    try {
      const response = await fetch(`/api/v1/salon/pos/carts/${activeCartId}`, {
        headers: { 'Organization-Id': organizationId }
      })
      if (response.ok) {
        const data = await response.json()
        // Update cart state with fresh data
        // Note: This would need to be mapped from API format to UI format
        console.log('Cart refreshed:', data)
      }
    } catch (error) {
      console.error('Failed to refresh cart:', error)
    }
  }

  // Checkout API functions
  const checkoutStart = async () => {
    if (!activeCartId) return
    await fetch(`/api/v1/salon/pos/checkout/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ organization_id: organizationId, cart_id: activeCartId })
    })
  }

  const createPaymentIntent = async (method: 'card' | 'cash', amount: number) => {
    if (!activeCartId) return null
    const response = await fetch(`/api/v1/salon/pos/payments/intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({
        organization_id: organizationId,
        cart_id: activeCartId,
        method,
        amount
      })
    })
    return response.json() // { payment_intent_id, ... }
  }

  const capturePayment = async (intentId: string) => {
    await fetch(`/api/v1/salon/pos/payments/${intentId}/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ organization_id: organizationId })
    })
  }

  const commitSale = async () => {
    if (!activeCartId) return
    const response = await fetch(`/api/v1/salon/pos/checkout/${activeCartId}/commit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Idempotency-Key': crypto.randomUUID() },
      body: JSON.stringify({ organization_id: organizationId })
    })
    const data = await response.json()
    setReceipt(data?.receipt ?? null)
    // Show success toast, open receipt modal
  }

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.service.metadata?.price || 0) * item.quantity, 0)
  }

  const calculateDiscount = () => {
    return (calculateSubtotal() * discountPercent) / 100
  }

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscount()
  }

  const calculateTotalDuration = () => {
    return cart.reduce(
      (sum, item) => sum + (item.service.metadata?.duration || 0) * item.quantity,
      0
    )
  }

  const handleCheckout = () => {
    if (cart.length === 0) return
    setShowCheckout(true)
  }

  const handlePayment = async () => {
    setProcessing(true)

    try {
      // Ensure branch is selected
      if (!branchId) {
        alert('Please select a branch before processing payment.')
        setProcessing(false)
        return
      }

      // Map cart items to PosCartItem format
      const items: PosCartItem[] = cart.map(item => ({
        id: item.service.id,
        entity_id: item.service.id,
        name: item.service.entity_name,
        type: 'service',
        quantity: item.quantity,
        unit_price: item.service.metadata?.price || 0,
        discount: 0,
        staff_id: item.stylist?.id // ✅ Include staff ID from cart item
      }))

      // Determine primary staff ID (use first stylist from cart or selectedStylist)
      const primaryStaffId = cart.find(item => item.stylist)?.stylist?.id || selectedStylist?.id

      // Map payment to PosPayment format
      const payments: PosPayment[] = [
        {
          method: paymentMethod === 'online' ? 'card' : paymentMethod,
          amount: calculateTotal(),
          reference: paymentMethod === 'cash' ? `CASH-${Date.now()}` : `CARD-${Date.now()}`
        }
      ]

      // ✅ Use RPC-based checkout with staff assignment
      const result = await processCheckout({
        customer_id: undefined, // TODO: Add customer entity ID when available
        appointment_id: undefined,
        items,
        payments,
        tax_rate: 0.05, // 5% default tax
        discount_total: calculateDiscount(),
        notes: `POS Sale - ${cart.length} items${customerName ? ` - Customer: ${customerName}` : ''}`
      })

      console.log('[POS] Payment processed successfully:', result)

      // Clear cart and reset
      setCart([])
      setShowPayment(false)
      setShowCheckout(false)
      setCustomerName('')
      setCustomerPhone('')
      setCustomerEmail('')
      setDiscountPercent(0)
      setCashReceived('')

      // Show success message
      alert('Payment processed successfully!')
    } catch (err) {
      console.error('Payment error:', err)
      alert(`Payment failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
      if (checkoutError) {
        console.error('Checkout error details:', checkoutError)
      }
    } finally {
      setProcessing(false)
    }
  }

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? mins + 'min' : ''}`
    }
    return `${mins}min`
  }

  // Load appointment and create POS cart
  const handleLoadAppointment = async () => {
    if (!appointmentSearchTerm.trim()) return

    try {
      setProcessing(true)
      setError(null)

      let appointment = null
      const searchTerm = appointmentSearchTerm.trim()

      // Check if search term looks like an ID (UUID format) or code
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        searchTerm
      )
      const isCode = /^APT-/.test(searchTerm)

      if (isUuid || isCode) {
        // Direct appointment lookup by ID or code
        const appointmentResponse = await fetch(
          `/api/v1/salon/appointments/${searchTerm}?` +
            `organization_id=${organizationId}&` +
            `expand=planned_services,customer,staff,deposits,packages`
        )

        if (appointmentResponse.ok) {
          const data = await appointmentResponse.json()
          appointment = data.appointment
        }
      } else {
        // Search by customer name
        // First, find customers matching the name
        const customersResponse = await universalApi.read('core_entities')
        const allCustomers =
          customersResponse.success && customersResponse.data ? customersResponse.data : []

        // Filter customers by organization and name match
        const matchingCustomers = allCustomers.filter(
          e =>
            e.organization_id === organizationId &&
            e.entity_type === 'customer' &&
            e.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
        )

        if (matchingCustomers.length === 0) {
          throw new Error('No customers found with that name')
        }

        // If multiple customers match, show them for selection
        if (matchingCustomers.length > 1) {
          setSearchResults({ customers: matchingCustomers })
          setProcessing(false)
          return
        }

        // Single customer found
        const customer = matchingCustomers[0]

        // Find appointments for this customer
        // Since we don't have a direct API for this, we'll search through transactions
        const transactionsResponse = await universalApi.read('universal_transactions')
        const allTransactions =
          transactionsResponse.success && transactionsResponse.data ? transactionsResponse.data : []

        // Filter for appointment transactions (uppercase APPOINTMENT)
        const appointmentTransactions = allTransactions
          .filter(
            t =>
              t.organization_id === organizationId &&
              t.transaction_type === 'APPOINTMENT' &&
              (t.source_entity_id === customer.id || t.metadata?.customer_id === customer.id) &&
              t.status === 'active'
          )
          .sort(
            (a, b) =>
              new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
          )

        if (appointmentTransactions.length === 0) {
          throw new Error(`No appointments found for ${customer.entity_name}`)
        }

        // Use the most recent appointment
        const appointmentTxn = appointmentTransactions[0]

        // Try to fetch the appointment details
        const appointmentResponse = await fetch(
          `/api/v1/salon/appointments/${appointmentTxn.id}?` +
            `organization_id=${organizationId}&` +
            `expand=planned_services,customer,staff,deposits,packages`
        )

        if (appointmentResponse.ok) {
          const data = await appointmentResponse.json()
          appointment = data.appointment
        } else {
          // If API doesn't work, create a basic appointment object from transaction
          appointment = {
            id: appointmentTxn.id,
            code: appointmentTxn.transaction_code,
            customer: {
              id: customer.id,
              name: customer.entity_name
            },
            start_time: appointmentTxn.transaction_date,
            status: 'confirmed'
          }
        }
      }

      if (!appointment) {
        throw new Error('Appointment not found')
      }
      setLoadedAppointment(appointment)

      // Create POS cart from appointment
      const cartResponse = await fetch('/api/v1/salon/pos/carts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': `cart-${appointment.id}-${Date.now()}`
        },
        body: JSON.stringify({
          appointment_id: appointment.id,
          organization_id: organizationId
        })
      })

      if (!cartResponse.ok) {
        const error = await cartResponse.json()
        throw new Error(error.error || 'Failed to create cart')
      }

      const data = await cartResponse.json()
      const { cart: createdCart } = data
      setActiveCartId(createdCart.id)
      setCartMode(data._mode ?? 'legacy') // 'playbook' expected for Hair Talkz

      // Update customer info from appointment
      if (appointment.customer) {
        setCustomerName(appointment.customer.name || appointment.customer.entity_name)
        setCustomerPhone(appointment.customer.phone || '')
        setCustomerEmail(appointment.customer.email || '')
      }

      // Map cart lines to UI cart items
      const cartItems: CartItem[] = createdCart.lines.map((line: any) => {
        const stylist = appointment.staff?.find((s: any) =>
          line.staff_split?.some((split: any) => split.staff_id === s.id)
        )

        return {
          service: {
            id: line.entity_ref,
            entity_name: line.name,
            entity_code: line.code,
            metadata: {
              price: line.unit_price,
              duration: line.dynamic.duration_min
            }
          },
          quantity: line.qty,
          stylist: stylist
            ? {
                id: stylist.id,
                entity_name: stylist.name,
                entity_code: '',
                metadata: {}
              }
            : undefined,
          notes: `From appointment #${appointment.code}`
        }
      })

      setCart(cartItems)
      setShowAppointmentLoader(false)
      setAppointmentSearchTerm('')
    } catch (err) {
      console.error('Error loading appointment:', err)
      setError(err instanceof Error ? err.message : 'Failed to load appointment')
    } finally {
      setProcessing(false)
    }
  }

  console.log('Render check - loading:', loading, 'services:', services.length, 'error:', error)

  // Mobile detection and responsive logic
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024 // lg breakpoint
      setIsMobile(mobile)
      setIsCartCollapsed(mobile) // Auto-collapse on mobile
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Cart visibility debug probe removed after aligning structure with restaurant POS

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-gray-900 overflow-hidden">
      {/* Left Panel - Services */}
      <div className="flex-1 min-w-0 flex flex-col z-10">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="backdrop-blur-xl bg-background/10 border-b border-white/10 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-white">Hair Talkz — POS (Canary)</h1>
                    {cartMode === 'playbook' ? (
                      <span className="px-2 py-1 rounded-full bg-purple-100 text-purple-800 text-xs">
                        Playbook Mode
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full bg-gray-100 ink text-xs">
                        Legacy Mode
                      </span>
                    )}
                  </div>
                  <p className="text-sm ink-faint">Book services and process payments</p>
                </div>

                {/* Branch Selector */}
                <div className="w-64">
                  <BranchSelector
                    value={branchId}
                    branches={branches}
                    onChange={setBranchId}
                    loading={branchesLoading}
                    placeholder="Select branch..."
                    className="bg-white/10 border-white/20 text-white hover:bg-white/15"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Cart Toggle Button - Mobile/Tablet */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCartCollapsed(!isCartCollapsed)}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 lg:hidden"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                </Button>

                {/* Cart Collapse Toggle - Desktop */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCartCollapsed(!isCartCollapsed)}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200 hidden lg:flex"
                >
                  {isCartCollapsed ? (
                    <>
                      <ChevronRight className="h-4 w-4 mr-2" />
                      Show Cart
                    </>
                  ) : (
                    <>
                      <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                      Hide Cart
                    </>
                  )}
                </Button>

                {/* Appointment Loader Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAppointmentLoader(true)}
                  className="border-purple-500/30 text-purple-300 hover:bg-purple-500/20 hover:text-purple-200"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Load Appointment
                </Button>

                <Separator orientation="vertical" className="h-6 bg-white/20" />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'text-white/60 hover:text-white hover:bg-white/10',
                    viewMode === 'grid' ? 'bg-white/10 text-white' : ''
                  )}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    'text-white/60 hover:text-white hover:bg-white/10',
                    viewMode === 'list' ? 'bg-white/10 text-white' : ''
                  )}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Search and Categories */}
          <div className="backdrop-blur-xl bg-background/10 border-b border-white/10 px-6 py-4">
            <div className="mb-4 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-white/40"
              />
            </div>
            <ScrollArea className="w-full">
              <div className="flex gap-2 pb-2">
                {categories.map(category => {
                  const Icon = category !== 'all' ? CATEGORY_ICONS[category] : ShoppingBag
                  const gradient =
                    category !== 'all'
                      ? CATEGORY_GRADIENTS[category]
                      : 'from-gray-400/20 to-gray-500/20'

                  return (
                    <Button
                      key={category}
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className={cn(
                        'whitespace-nowrap border-white/10 text-white/60 hover:text-white hover:bg-white/10',
                        selectedCategory === category
                          ? `bg-gradient-to-r ${gradient} text-white border-transparent`
                          : ''
                      )}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {category === 'all' ? 'All Services' : category}
                    </Button>
                  )
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Services Grid/List */}
          <ScrollArea className="flex-1">
            <div className="p-6">
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {viewMode === 'grid' ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredServices.map(service => {
                    const Icon = CATEGORY_ICONS[service.metadata?.category || ''] || ShoppingBag
                    const gradient =
                      CATEGORY_GRADIENTS[service.metadata?.category || ''] ||
                      'from-gray-400/20 to-gray-500/20'

                    return (
                      <Card
                        key={service.id}
                        className={cn(
                          'group relative overflow-hidden cursor-pointer transition-all',
                          'hover:scale-[1.02] hover:shadow-xl',
                          'border-white/10 bg-gradient-to-br backdrop-blur-xl',
                          gradient
                        )}
                        onClick={() => handleServiceClick(service)}
                      >
                        {service.metadata?.image_url && (
                          <div className="relative h-48 w-full overflow-hidden">
                            <Image
                              src={service.metadata.image_url}
                              alt={service.entity_name}
                              fill
                              className="object-cover transition-transform group-hover:scale-110"
                            />
                            {service.metadata.popular && (
                              <Badge className="absolute right-2 top-2 bg-amber-500/90 text-white">
                                <Sparkles className="mr-1 h-3 w-3" />
                                Popular
                              </Badge>
                            )}
                          </div>
                        )}
                        <CardContent className="p-4">
                          <div className="mb-2 flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-white">{service.entity_name}</h3>
                              <p className="mt-1 text-sm ink-faint line-clamp-2">
                                {service.metadata?.description}
                              </p>
                            </div>
                            <Icon className="h-5 w-5 text-white/40 ml-2 flex-shrink-0" />
                          </div>

                          <div className="mt-3 flex items-center justify-between">
                            <div>
                              <p className="text-2xl font-bold text-white">
                                {formatCurrency(service.metadata?.price || 0)}
                              </p>
                              <div className="mt-1 flex items-center gap-3 text-xs ink-faint">
                                <span className="flex items-center">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {formatDuration(service.metadata?.duration || 0)}
                                </span>
                                {service.metadata?.rating && (
                                  <span className="flex items-center">
                                    <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    {service.metadata.rating}
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              size="icon"
                              variant="secondary"
                              className="bg-white/10 hover:bg-white/20 text-white"
                              disabled={lineLoading}
                              onClick={e => {
                                e.stopPropagation()
                                handleServiceClick(service)
                              }}
                            >
                              {lineLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredServices.map(service => {
                    const Icon = CATEGORY_ICONS[service.metadata?.category || ''] || ShoppingBag

                    return (
                      <Card
                        key={service.id}
                        className="cursor-pointer transition-all hover:shadow-lg border-white/10 bg-background/10 backdrop-blur-xl"
                        onClick={() => handleServiceClick(service)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            {service.metadata?.image_url && (
                              <Image
                                src={service.metadata.image_url}
                                alt={service.entity_name}
                                width={80}
                                height={80}
                                className="rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-white flex items-center gap-2">
                                    {service.entity_name}
                                    {service.metadata?.popular && (
                                      <Badge
                                        variant="secondary"
                                        className="bg-amber-500/20 text-amber-300"
                                      >
                                        Popular
                                      </Badge>
                                    )}
                                  </h3>
                                  <p className="mt-1 text-sm ink-faint">
                                    {service.metadata?.description}
                                  </p>
                                  <div className="mt-2 flex items-center gap-4 text-sm">
                                    <span className="flex items-center ink-faint">
                                      <Icon className="mr-1 h-4 w-4" />
                                      {service.metadata?.category}
                                    </span>
                                    <span className="flex items-center ink-faint">
                                      <Clock className="mr-1 h-4 w-4" />
                                      {formatDuration(service.metadata?.duration || 0)}
                                    </span>
                                    {service.metadata?.rating && (
                                      <span className="flex items-center ink-faint">
                                        <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        {service.metadata.rating}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className="text-xl font-bold text-white">
                                    {formatCurrency(service.metadata?.price || 0)}
                                  </p>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="mt-2 bg-white/10 hover:bg-white/20 text-white"
                                    disabled={lineLoading}
                                    onClick={e => {
                                      e.stopPropagation()
                                      handleServiceClick(service)
                                    }}
                                  >
                                    {lineLoading ? (
                                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                      <Plus className="mr-1 h-3 w-3" />
                                    )}
                                    Add
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div
        className={cn(
          'shrink-0 backdrop-blur-xl bg-background/10 border-l border-border/20 flex flex-col z-10 transition-all duration-300',
          // Mobile: Fixed overlay when not collapsed
          'lg:relative',
          isMobile && !isCartCollapsed && 'fixed inset-y-0 right-0 w-80 shadow-2xl',
          isMobile && isCartCollapsed && 'hidden',
          // Desktop: Responsive width
          !isMobile && isCartCollapsed && 'w-16',
          !isMobile && !isCartCollapsed && 'w-96'
        )}
      >
        <div className="flex h-full flex-col">
          <div
            className={cn(
              'border-b border-border/20 transition-all duration-300',
              isCartCollapsed ? 'px-2 py-4' : 'px-6 py-4'
            )}
          >
            <div className="flex items-center justify-between">
              {isCartCollapsed ? (
                // Collapsed view - Icon only with badge
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="relative">
                    <ShoppingCart className="h-6 w-6 text-white" />
                    {cart.length > 0 && (
                      <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-purple-600 text-white text-xs">
                        {cart.reduce((sum, item) => sum + item.quantity, 0)}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsCartCollapsed(false)}
                    className="p-1 h-6 w-6 ink-faint hover:text-white"
                  >
                    <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                // Expanded view - Full header
                <>
                  <h2 className="flex items-center text-lg font-semibold text-white">
                    <ShoppingCart className="mr-2 h-5 w-5" />
                    Cart ({cart.reduce((sum, item) => sum + item.quantity, 0)})
                  </h2>
                  {loadedAppointment && (
                    <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                      <Calendar className="h-3 w-3 mr-1" />
                      Appointment #{loadedAppointment.code}
                    </Badge>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Cart Items - Hidden when collapsed */}
          {!isCartCollapsed && (
            <ScrollArea className="flex-1">
              <div className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center">
                    <ShoppingBag className="mx-auto h-12 w-12 text-purple-400 mb-3" />
                    <p className="text-lg font-medium text-white">Your cart is empty</p>
                    <p className="text-sm ink-faint mt-1">Add services to get started</p>
                    <p className="text-xs text-white/40 mt-2">Basket is ready and visible</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <Card
                        key={`${item.service.id}-${item.stylist?.id || 'no-stylist'}-${index}`}
                        className="border-white/10 bg-white/5"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-medium text-white">{item.service.entity_name}</h4>
                              {item.stylist && (
                                <p className="text-sm ink-faint mt-1">
                                  with {item.stylist.entity_name}
                                </p>
                              )}
                              <p className="text-sm text-white/40">
                                {formatCurrency(item.service.metadata?.price || 0)} ×{' '}
                                {item.quantity}
                              </p>
                              <p className="text-sm text-white/40">
                                {formatDuration(
                                  (item.service.metadata?.duration || 0) * item.quantity
                                )}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 ink-faint hover:text-white hover:bg-white/10"
                                onClick={() =>
                                  updateQuantity(item.service.id, -1, item.stylist?.id)
                                }
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center text-sm text-white">
                                {item.quantity}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 ink-faint hover:text-white hover:bg-white/10"
                                onClick={() => updateQuantity(item.service.id, 1, item.stylist?.id)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-8 w-8 text-red-400 hover:text-red-300 hover:bg-red-900/20 ml-2"
                                onClick={() => removeFromCart(item.service.id, item.stylist?.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          )}

          {/* Cart Summary */}
          {cart.length > 0 && (
            <div className="border-t border-white/10 p-6">
              <div className="space-y-3">
                <div className="flex justify-between text-sm ink-faint">
                  <span>Subtotal</span>
                  <span>{formatCurrency(calculateSubtotal())}</span>
                </div>

                {discountPercent > 0 && (
                  <div className="flex justify-between text-sm text-green-400">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-{formatCurrency(calculateDiscount())}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm ink-faint">
                  <span>Total Duration</span>
                  <span>{formatDuration(calculateTotalDuration())}</span>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex justify-between text-lg font-semibold text-white">
                  <span>Total</span>
                  <span>{formatCurrency(calculateTotal())}</span>
                </div>

                <Button
                  onClick={handleCheckout}
                  className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  size="lg"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Book & Checkout
                </Button>
              </div>
            </div>
          )}

          {/* Collapsed Cart Summary - Show minimal info when collapsed and has items */}
          {isCartCollapsed && cart.length > 0 && (
            <div className="px-2 py-3 border-t border-border/20">
              <div className="text-center">
                <p className="text-xs ink-faint mb-1">Total</p>
                <p className="text-sm font-semibold text-white">
                  {formatCurrency(calculateTotal())}
                </p>
                <Button
                  size="sm"
                  onClick={handleCheckout}
                  className="w-full mt-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs"
                >
                  <Calendar className="mr-1 h-3 w-3" />
                  Book
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stylist & Chair Selection Dialog */}
      <Dialog open={showStylistSelection} onOpenChange={setShowStylistSelection}>
        <DialogContent className="max-w-3xl">
          <div className="text-white">
            <h3 className="text-xl font-semibold mb-6 text-center">Select Stylist & Chair</h3>
            <div className="grid grid-cols-2 gap-6">
              {/* Stylist Selection Column */}
              <div>
                <Label className="text-white/80 text-sm font-medium mb-3 block">
                  Choose Stylist
                </Label>
                <Select
                  value={selectedStylist?.id || ''}
                  onValueChange={value => {
                    const stylist = stylists.find(s => s.id === value)
                    setSelectedStylist(stylist || null)
                  }}
                >
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white hover:bg-white/15 focus:bg-white/15">
                    <SelectValue placeholder="Select a stylist..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 backdrop-blur-xl border-white/20">
                    <SelectItem value="no-preference" className="text-white hover:bg-white/10">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>No Preference</span>
                      </div>
                    </SelectItem>
                    {stylists.map(stylist => (
                      <SelectItem
                        key={stylist.id}
                        value={stylist.id}
                        className="text-white hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-3">
                            {stylist.metadata?.image_url && (
                              <Image
                                src={stylist.metadata.image_url}
                                alt={stylist.entity_name}
                                width={32}
                                height={32}
                                className="rounded-full object-cover"
                              />
                            )}
                            <div>
                              <p className="font-medium">{stylist.entity_name}</p>
                              <p className="text-xs ink-faint">
                                {stylist.metadata?.specialties?.slice(0, 2).join(', ')}
                              </p>
                            </div>
                          </div>
                          {stylist.metadata?.rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs">{stylist.metadata.rating}</span>
                            </div>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Stylist Info Card */}
                {selectedStylist && selectedStylist.id !== 'no-preference' && (
                  <Card className="mt-4 border-white/10 bg-white/5">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        {selectedStylist.metadata?.image_url && (
                          <Image
                            src={selectedStylist.metadata.image_url}
                            alt={selectedStylist.entity_name}
                            width={60}
                            height={60}
                            className="rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{selectedStylist.entity_name}</h4>
                          <p className="text-sm ink-faint mt-1">{selectedStylist.metadata?.role}</p>
                          {selectedStylist.metadata?.experience_years && (
                            <p className="text-xs text-white/50 mt-1">
                              {selectedStylist.metadata.experience_years}+ years experience
                            </p>
                          )}
                          {selectedStylist.metadata?.specialties && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {selectedStylist.metadata.specialties.map((specialty, i) => (
                                <Badge
                                  key={i}
                                  variant="secondary"
                                  className="text-xs bg-purple-500/20 text-purple-300 border-purple-500/30"
                                >
                                  {specialty}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Chair Selection Column */}
              <div>
                <Label className="text-white/80 text-sm font-medium mb-3 block">
                  Choose Chair/Station
                </Label>
                <Select
                  value={selectedChair?.id || ''}
                  onValueChange={value => {
                    const chair = chairs.find(c => c.id === value)
                    setSelectedChair(chair || null)
                  }}
                >
                  <SelectTrigger className="w-full bg-white/10 border-white/20 text-white hover:bg-white/15 focus:bg-white/15">
                    <SelectValue placeholder="Select a chair..." />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900/95 backdrop-blur-xl border-white/20">
                    {/* Hair Stations */}
                    <div className="px-2 py-1.5 text-xs font-medium text-white/50">
                      Hair Stations
                    </div>
                    {getChairsByType('hair').map(chair => (
                      <SelectItem
                        key={chair.id}
                        value={chair.id}
                        className="text-white hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                chair.metadata?.status === 'available'
                                  ? 'bg-green-400'
                                  : chair.metadata?.status === 'occupied'
                                    ? 'bg-red-400'
                                    : 'bg-yellow-400'
                              )}
                            />
                            <span>{chair.entity_name}</span>
                          </div>
                          <span className="text-xs text-white/50">{chair.metadata?.location}</span>
                        </div>
                      </SelectItem>
                    ))}

                    {/* Nail Stations */}
                    <div className="px-2 py-1.5 text-xs font-medium text-white/50 mt-2">
                      Nail Stations
                    </div>
                    {getChairsByType('nail').map(chair => (
                      <SelectItem
                        key={chair.id}
                        value={chair.id}
                        className="text-white hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                chair.metadata?.status === 'available'
                                  ? 'bg-green-400'
                                  : chair.metadata?.status === 'occupied'
                                    ? 'bg-red-400'
                                    : 'bg-yellow-400'
                              )}
                            />
                            <span>{chair.entity_name}</span>
                          </div>
                          <span className="text-xs text-white/50">{chair.metadata?.location}</span>
                        </div>
                      </SelectItem>
                    ))}

                    {/* Facial Rooms */}
                    <div className="px-2 py-1.5 text-xs font-medium text-white/50 mt-2">
                      Facial Rooms
                    </div>
                    {getChairsByType('facial').map(chair => (
                      <SelectItem
                        key={chair.id}
                        value={chair.id}
                        className="text-white hover:bg-white/10"
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <div
                              className={cn(
                                'w-2 h-2 rounded-full',
                                chair.metadata?.status === 'available'
                                  ? 'bg-green-400'
                                  : chair.metadata?.status === 'occupied'
                                    ? 'bg-red-400'
                                    : 'bg-yellow-400'
                              )}
                            />
                            <span>{chair.entity_name}</span>
                          </div>
                          <span className="text-xs text-white/50">{chair.metadata?.location}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Chair Status Legend */}
                <div className="mt-4 p-3 bg-white/5 rounded-lg">
                  <p className="text-xs font-medium ink-faint mb-2">Station Status</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="text-white/50">Available</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-red-400" />
                      <span className="text-white/50">Occupied</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="text-white/50">Maintenance</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowStylistSelection(false)
                  setSelectedStylist(null)
                  setSelectedChair(null)
                }}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (currentServiceForStylist) {
                    handleStylistSelect(selectedStylist)
                  }
                }}
                disabled={!selectedChair}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                <Check className="mr-2 h-4 w-4" />
                Confirm Selection
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={showCheckout} onOpenChange={setShowCheckout}>
        <DialogContent className="max-w-lg">
          <div className="text-white">
            <h3 className="text-lg font-semibold mb-4">Complete Booking</h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="customer-name" className="text-white/80">
                  Customer Name *
                </Label>
                <Input
                  id="customer-name"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Enter customer name"
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <Label htmlFor="customer-phone" className="text-white/80">
                  Phone Number *
                </Label>
                <Input
                  id="customer-phone"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="Enter phone number"
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div>
                <Label htmlFor="customer-email" className="text-white/80">
                  Email
                </Label>
                <Input
                  id="customer-email"
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder="Enter email (optional)"
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="appointment-date" className="text-white/80">
                    Appointment Date *
                  </Label>
                  <Input
                    id="appointment-date"
                    type="date"
                    value={appointmentDate}
                    onChange={e => setAppointmentDate(e.target.value)}
                    className="bg-white/10 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="appointment-time" className="text-white/80">
                    Preferred Time *
                  </Label>
                  <Input
                    id="appointment-time"
                    type="time"
                    value={appointmentTime}
                    onChange={e => setAppointmentTime(e.target.value)}
                    className="bg-white/10 border-white/10 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="discount" className="text-white/80">
                  Discount %
                </Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  max="100"
                  value={discountPercent}
                  onChange={e => setDiscountPercent(Number(e.target.value))}
                  className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
                />
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <div className="rounded-lg bg-white/5 p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between ink-faint">
                    <span>Services</span>
                    <span>{cart.reduce((sum, item) => sum + item.quantity, 0)} items</span>
                  </div>
                  <div className="flex justify-between ink-faint">
                    <span>Duration</span>
                    <span>{formatDuration(calculateTotalDuration())}</span>
                  </div>
                  <Separator className="bg-white/10" />
                  <div className="flex justify-between font-semibold text-white">
                    <span>Total</span>
                    <span>{formatCurrency(calculateTotal())}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowCheckout(false)}
                  className="flex-1 border-white/10 text-white hover:bg-white/10"
                >
                  Back
                </Button>
                <Button
                  onClick={() => {
                    if (customerName && customerPhone && appointmentDate && appointmentTime) {
                      setShowCheckout(false)
                      setShowPayment(true)
                    }
                  }}
                  disabled={!customerName || !customerPhone || !appointmentDate || !appointmentTime}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                >
                  Continue to Payment
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="max-w-md">
          <div className="text-white">
            <h3 className="text-lg font-semibold mb-4">Payment</h3>

            <Tabs
              defaultValue="cash"
              value={paymentMethod}
              onValueChange={v => setPaymentMethod(v as any)}
            >
              <TabsList className="grid w-full grid-cols-3 bg-white/10">
                <TabsTrigger value="cash" className="data-[state=active]:bg-white/20 text-white">
                  <DollarSign className="mr-2 h-4 w-4" />
                  Cash
                </TabsTrigger>
                <TabsTrigger value="card" className="data-[state=active]:bg-white/20 text-white">
                  <CreditCard className="mr-2 h-4 w-4" />
                  Card
                </TabsTrigger>
                <TabsTrigger value="online" className="data-[state=active]:bg-white/20 text-white">
                  <Zap className="mr-2 h-4 w-4" />
                  Online
                </TabsTrigger>
              </TabsList>

              <TabsContent value="cash" className="mt-4 space-y-4">
                <div>
                  <Label htmlFor="cash-amount" className="text-white/80">
                    Cash Received
                  </Label>
                  <Input
                    id="cash-amount"
                    type="number"
                    step="0.01"
                    value={cashReceived}
                    onChange={e => setCashReceived(e.target.value)}
                    placeholder="Enter amount"
                    className="bg-white/10 border-white/10 text-white placeholder:text-white/40"
                  />
                </div>
                {cashReceived && Number(cashReceived) >= calculateTotal() && (
                  <div className="rounded-lg bg-white/5 p-4">
                    <p className="text-sm ink-faint">Change</p>
                    <p className="text-xl font-semibold text-green-400">
                      {formatCurrency(Number(cashReceived) - calculateTotal())}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="card" className="mt-4">
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <CreditCard className="mx-auto mb-3 h-12 w-12 text-white/40" />
                  <p className="text-sm ink-faint">Ready for card payment</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatCurrency(calculateTotal())}
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="online" className="mt-4">
                <div className="rounded-lg bg-white/5 p-4 text-center">
                  <Zap className="mx-auto mb-3 h-12 w-12 text-white/40" />
                  <p className="text-sm ink-faint">Send payment link</p>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {formatCurrency(calculateTotal())}
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowPayment(false)
                  setShowCheckout(true)
                }}
                className="flex-1 border-white/10 text-white hover:bg-white/10"
              >
                Back
              </Button>
              <Button
                onClick={handlePayment}
                disabled={
                  processing ||
                  (paymentMethod === 'cash' &&
                    (!cashReceived || Number(cashReceived) < calculateTotal()))
                }
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {processing ? 'Processing...' : 'Complete Booking'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Appointment Loader Dialog */}
      <Dialog open={showAppointmentLoader} onOpenChange={setShowAppointmentLoader}>
        <DialogContent className="max-w-md">
          <div className="text-white">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-purple-400" />
              Load Appointment
            </h3>

            <div className="space-y-4">
              <div>
                <Label htmlFor="appointment-search" className="text-white/80">
                  Search by Appointment ID, Code, or Customer Name
                </Label>
                <div className="mt-2 relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                  <Input
                    id="appointment-search"
                    value={appointmentSearchTerm}
                    onChange={e => setAppointmentSearchTerm(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleLoadAppointment()}
                    placeholder="e.g., APT-2024-001, ID, or customer name"
                    className="pl-10 bg-white/10 border-white/10 text-white placeholder:text-white/40"
                    autoFocus
                  />
                </div>
                <p className="mt-1 text-xs text-white/50">
                  Search appointments by ID, code, or customer name (with optional date)
                </p>
              </div>

              {error && (
                <Alert variant="destructive" className="bg-red-900/20 border-red-500/30">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-200">{error}</AlertDescription>
                </Alert>
              )}

              {searchResults && searchResults.customers && searchResults.customers.length > 1 && (
                <div className="rounded-lg bg-white/5 p-4 space-y-2">
                  <p className="text-sm font-medium text-white">Multiple Customers Found</p>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {searchResults.customers.map(customer => (
                      <button
                        key={customer.id}
                        onClick={() => {
                          setAppointmentSearchTerm(customer.id)
                          setSearchResults(null)
                        }}
                        className="w-full text-left p-2 rounded hover:bg-white/10 text-sm text-white/80"
                      >
                        {customer.entity_name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loadedAppointment && (
                <div className="rounded-lg bg-white/5 p-4 space-y-2">
                  <p className="text-sm font-medium text-white">Appointment Details</p>
                  <div className="space-y-1 text-sm ink-faint">
                    <p>Customer: {loadedAppointment.customer?.name || 'Unknown'}</p>
                    <p>
                      Date/Time:{' '}
                      {loadedAppointment.start_time
                        ? new Date(loadedAppointment.start_time).toLocaleString()
                        : 'N/A'}
                    </p>
                    <p>Services: {loadedAppointment.planned_services?.length || 0}</p>
                    <p>Status: {loadedAppointment.status}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAppointmentLoader(false)
                  setAppointmentSearchTerm('')
                  setError(null)
                  setSearchResults(null)
                  setLoadedAppointment(null)
                }}
                className="flex-1 border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLoadAppointment}
                disabled={!appointmentSearchTerm.trim() || processing}
                className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {processing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                {processing ? 'Loading...' : 'Load & Create Cart'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
