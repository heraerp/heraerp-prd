'use client'
/**
 * Salon Appointments – Faceted Grid (React + Tailwind)
 * Smart Code: HERA.SALON.APPOINTMENTS.FACETED.GRID.v1
 * 
 * Features:
 * - Facet filters with live counts (Stylist, Service, Status, Payment)
 * - Range filters (Date, Price, Duration) + quick date chips
 * - Text search (Client, Notes)
 * - Sortable columns
 * - CSV export
 * - Clear-all / individual facet clearing
 * - HERA Universal 6-table integration
 */

import React, { useMemo, useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  Clock, 
  Download,
  X,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  User,
  Scissors,
  CreditCard,
  CheckCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ----------------------------- Types & Interfaces ------------------------------------

interface Appointment {
  id: number
  date: Date
  time: string
  client: string
  stylist: string
  service: string
  status: 'Booked' | 'Completed' | 'Cancelled' | 'No-show'
  payment: 'Card' | 'Cash' | 'Gift Card' | 'Online'
  duration: number // minutes
  price: number // AED
  notes?: string
  phone?: string
}

interface FacetFilter {
  stylist: string[]
  service: string[]
  status: string[]
  payment: string[]
}

interface DateRange {
  start: Date | null
  end: Date | null
}

interface PriceRange {
  min: number
  max: number
}

interface DurationRange {
  min: number
  max: number
}

interface SortConfig {
  field: keyof Appointment | null
  direction: 'asc' | 'desc'
}

// ----------------------------- Mock Data Generator ------------------------------------

function daysFromNow(n: number): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + n)
  return d
}

const stylists = ['Ava', 'Mia', 'Noah', 'Liam', 'Olivia', 'Ethan', 'Rocky', 'Vinay', 'Maya', 'Sophia']
const services = [
  'Brazilian Blowout',
  'Complete Bridal Package',
  'Keratin Treatment',
  'Hair Color & Highlights',
  'Premium Cut & Style',
  'Luxury Spa Treatment',
  'Men\'s Cut',
  'Women\'s Cut',
  'Balayage',
  'Updo'
]
const statuses: Appointment['status'][] = ['Booked', 'Completed', 'Cancelled', 'No-show']
const payments: Appointment['payment'][] = ['Card', 'Cash', 'Gift Card', 'Online']

function randomOf<T>(arr: T[]): T { 
  return arr[Math.floor(Math.random() * arr.length)] 
}

function chance(p: number): boolean { 
  return Math.random() < p 
}

function generateAppointments(count = 150): Appointment[] {
  const names = [
    'Sophia Johnson', 'Jackson Lee', 'Amelia Brown', 'Lucas Davis', 'Isabella Wilson',
    'Mason Martinez', 'Mia Anderson', 'Ethan Thomas', 'Ava Taylor', 'Oliver Moore',
    'James White', 'Charlotte Harris', 'Benjamin Clark', 'Harper Lewis', 'Elijah Walker',
    'Emily Hall', 'Michael Allen', 'Abigail Young', 'Daniel King', 'Evelyn Wright',
    'Sarah Al-Rashid', 'Ahmed Hassan', 'Fatima Al-Zahra', 'Omar Khalil', 'Layla Mansour'
  ]

  const appointments: Appointment[] = []
  
  for (let i = 0; i < count; i++) {
    const date = daysFromNow(Math.floor(Math.random() * 60) - 15) // -15..+44 days
    const hour = 9 + Math.floor(Math.random() * 9) // 9..17
    const minute = chance(0.5) ? 0 : 30
    const duration = [30, 45, 60, 75, 90, 120, 180, 240, 360][Math.floor(Math.random() * 9)]
    const price = [50, 80, 120, 150, 200, 280, 350, 500, 800][Math.floor(Math.random() * 9)]

    appointments.push({
      id: i + 1,
      date,
      time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      client: randomOf(names),
      stylist: randomOf(stylists),
      service: randomOf(services),
      status: randomOf(statuses),
      payment: randomOf(payments),
      duration,
      price,
      notes: chance(0.3) ? 'Special requests: ' + randomOf(['Allergy to sulfates', 'Pregnant - no chemicals', 'First time client', 'VIP client']) : '',
      phone: `+971 ${50 + Math.floor(Math.random() * 9)} ${Math.floor(Math.random() * 999).toString().padStart(3, '0')} ${Math.floor(Math.random() * 9999).toString().padStart(4, '0')}`
    })
  }

  return appointments.sort((a, b) => b.date.getTime() - a.date.getTime())
}

// ----------------------------- Component ------------------------------------

export default function SalonAppointmentsFacetedGrid() {
  // State
  const [appointments] = useState<Appointment[]>(generateAppointments)
  const [searchQuery, setSearchQuery] = useState('')
  const [facetFilters, setFacetFilters] = useState<FacetFilter>({
    stylist: [],
    service: [],
    status: [],
    payment: []
  })
  const [dateRange, setDateRange] = useState<DateRange>({ start: null, end: null })
  const [priceRange, setPriceRange] = useState<PriceRange>({ min: 0, max: 1000 })
  const [durationRange, setDurationRange] = useState<DurationRange>({ min: 0, max: 360 })
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: 'date', direction: 'desc' })
  const [expandedFacets, setExpandedFacets] = useState<Record<string, boolean>>({
    search: true,
    dates: true,
    ranges: false,
    stylist: true,
    service: false,
    status: false,
    payment: false
  })

  // Quick date filters
  const quickDateFilters = [
    { label: 'Today', getValue: () => ({ start: daysFromNow(0), end: daysFromNow(0) }) },
    { label: 'Tomorrow', getValue: () => ({ start: daysFromNow(1), end: daysFromNow(1) }) },
    { label: 'Next 7 days', getValue: () => ({ start: daysFromNow(0), end: daysFromNow(7) }) },
    { label: 'This month', getValue: () => {
      const start = new Date()
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
      return { start, end }
    }},
    { label: 'Past 30 days', getValue: () => ({ start: daysFromNow(-30), end: daysFromNow(0) }) }
  ]

  // Filter logic
  const filteredAppointments = useMemo(() => {
    let result = appointments

    // Text search
    if (searchQuery) {
      result = result.filter(apt => 
        apt.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
        apt.stylist.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Facet filters
    if (facetFilters.stylist.length > 0) {
      result = result.filter(apt => facetFilters.stylist.includes(apt.stylist))
    }
    if (facetFilters.service.length > 0) {
      result = result.filter(apt => facetFilters.service.includes(apt.service))
    }
    if (facetFilters.status.length > 0) {
      result = result.filter(apt => facetFilters.status.includes(apt.status))
    }
    if (facetFilters.payment.length > 0) {
      result = result.filter(apt => facetFilters.payment.includes(apt.payment))
    }

    // Date range
    if (dateRange.start && dateRange.end) {
      result = result.filter(apt => {
        const aptDate = new Date(apt.date)
        aptDate.setHours(0, 0, 0, 0)
        return aptDate >= dateRange.start! && aptDate <= dateRange.end!
      })
    }

    // Price range
    result = result.filter(apt => apt.price >= priceRange.min && apt.price <= priceRange.max)

    // Duration range
    result = result.filter(apt => apt.duration >= durationRange.min && apt.duration <= durationRange.max)

    return result
  }, [appointments, searchQuery, facetFilters, dateRange, priceRange, durationRange])

  // Sorting
  const sortedAppointments = useMemo(() => {
    if (!sortConfig.field) return filteredAppointments

    return [...filteredAppointments].sort((a, b) => {
      const field = sortConfig.field!
      let aVal = a[field]
      let bVal = b[field]

      // Special handling for dates
      if (field === 'date') {
        aVal = a.date.getTime()
        bVal = b.date.getTime()
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredAppointments, sortConfig])

  // Facet counts - for each facet, compute counts based on results from other filters
  const facetCounts = useMemo(() => {
    const counts = {
      stylist: new Map<string, number>(),
      service: new Map<string, number>(),
      status: new Map<string, number>(),
      payment: new Map<string, number>()
    }

    // For each facet, filter by all OTHER facets to get proper counts
    const computeCountsForFacet = (excludeFacet: keyof FacetFilter) => {
      let base = appointments

      // Apply text search
      if (searchQuery) {
        base = base.filter(apt => 
          apt.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
          apt.stylist.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      // Apply other facet filters (excluding the one we're computing)
      Object.entries(facetFilters).forEach(([facet, values]) => {
        if (facet !== excludeFacet && values.length > 0) {
          base = base.filter(apt => values.includes(apt[facet as keyof Appointment] as string))
        }
      })

      // Apply range filters
      if (dateRange.start && dateRange.end) {
        base = base.filter(apt => {
          const aptDate = new Date(apt.date)
          aptDate.setHours(0, 0, 0, 0)
          return aptDate >= dateRange.start! && aptDate <= dateRange.end!
        })
      }
      base = base.filter(apt => apt.price >= priceRange.min && apt.price <= priceRange.max)
      base = base.filter(apt => apt.duration >= durationRange.min && apt.duration <= durationRange.max)

      return base
    }

    // Compute counts for each facet
    ;(['stylist', 'service', 'status', 'payment'] as const).forEach(facet => {
      const base = computeCountsForFacet(facet)
      base.forEach(apt => {
        const value = apt[facet]
        counts[facet].set(value, (counts[facet].get(value) || 0) + 1)
      })
    })

    return counts
  }, [appointments, searchQuery, facetFilters, dateRange, priceRange, durationRange])

  // Helper functions
  const toggleFacetValue = (facet: keyof FacetFilter, value: string) => {
    setFacetFilters(prev => ({
      ...prev,
      [facet]: prev[facet].includes(value)
        ? prev[facet].filter(v => v !== value)
        : [...prev[facet], value]
    }))
  }

  const clearAllFilters = () => {
    setSearchQuery('')
    setFacetFilters({ stylist: [], service: [], status: [], payment: [] })
    setDateRange({ start: null, end: null })
    setPriceRange({ min: 0, max: 1000 })
    setDurationRange({ min: 0, max: 360 })
  }

  const clearFacet = (facet: keyof FacetFilter) => {
    setFacetFilters(prev => ({ ...prev, [facet]: [] }))
  }

  const toggleSort = (field: keyof Appointment) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const exportToCSV = () => {
    const headers = ['Date', 'Time', 'Client', 'Stylist', 'Service', 'Status', 'Payment', 'Duration', 'Price', 'Notes']
    const csvContent = [
      headers.join(','),
      ...sortedAppointments.map(apt => [
        apt.date.toISOString().split('T')[0],
        apt.time,
        `"${apt.client}"`,
        apt.stylist,
        `"${apt.service}"`,
        apt.status,
        apt.payment,
        apt.duration,
        apt.price,
        `"${apt.notes || ''}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `salon_appointments_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    })
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const getStatusColor = (status: Appointment['status']) => {
    const colors = {
      'Booked': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border-blue-200 dark:border-blue-700',
      'Completed': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-700',
      'Cancelled': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-700',
      'No-show': 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
    }
    return colors[status]
  }

  const FacetSection = ({ 
    title, 
    facet, 
    values, 
    icon 
  }: { 
    title: string
    facet: keyof FacetFilter
    values: string[]
    icon: React.ReactNode
  }) => (
    <div className="group">
      <button
        onClick={() => setExpandedFacets(prev => ({ ...prev, [facet]: !prev[facet] }))}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-purple-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
            {icon}
          </div>
          <span className="font-semibold !text-gray-900 dark:!text-white text-sm">{title}</span>
          {facetFilters[facet].length > 0 && (
            <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-white text-xs px-2 py-0.5 rounded-full shadow-sm">
              {facetFilters[facet].length}
            </Badge>
          )}
        </div>
        <div className={cn(
          "transition-transform duration-200",
          expandedFacets[facet] ? "rotate-180" : ""
        )}>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </div>
      </button>
      
      {expandedFacets[facet] && (
        <div className="mt-2 mb-4 px-4 space-y-1 animate-in slide-in-from-top-1 duration-200">
          <div className="max-h-48 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-600 scrollbar-track-purple-100 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-purple-400 dark:hover:scrollbar-thumb-purple-500">
            {values.map(value => {
              const count = facetCounts[facet].get(value) || 0
              const isSelected = facetFilters[facet].includes(value)
              
              return (
                <label 
                  key={value} 
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-150",
                    isSelected 
                      ? "bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800" 
                      : "hover:bg-gray-50 dark:hover:bg-gray-800/30"
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleFacetValue(facet, value)}
                      className={isSelected ? "border-purple-500 data-[state=checked]:bg-purple-500" : ""}
                    />
                    <span className={cn(
                      "text-sm",
                      isSelected 
                        ? "!text-purple-900 dark:!text-purple-100 font-medium" 
                        : "!text-gray-700 dark:!text-gray-300"
                    )}>
                      {value}
                    </span>
                  </div>
                  <span className={cn(
                    "text-xs font-semibold px-2 py-0.5 rounded-full",
                    count > 0 
                      ? "bg-gray-100 dark:bg-gray-700 !text-gray-700 dark:!text-gray-300" 
                      : "!text-gray-400 dark:!text-gray-500"
                  )}>
                    {count}
                  </span>
                </label>
              )
            })}
          </div>
          {facetFilters[facet].length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => clearFacet(facet)}
              className="w-full mt-3 text-xs h-8 text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20"
            >
              <X className="w-3 h-3 mr-1" />
              Clear {title}
            </Button>
          )}
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-gray-900">
      {/* Header with glassmorphism */}
      <div className="sticky top-0 z-20 px-6 py-4 mb-0 backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-[1600px] mx-auto">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Appointment Management
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <p className="!text-gray-700 dark:!text-gray-300 text-sm font-medium">
                  {sortedAppointments.length} active appointments
                </p>
              </div>
              <span className="!text-gray-400 dark:!text-gray-600">•</span>
              <p className="!text-gray-600 dark:!text-gray-400 text-sm">
                {appointments.length} total
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              onClick={exportToCSV} 
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm"
              size="sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {(Object.values(facetFilters).some(f => f.length > 0) || 
              searchQuery || 
              dateRange.start || 
              priceRange.min > 0 || 
              priceRange.max < 1000 ||
              durationRange.min > 0 || 
              durationRange.max < 360) && (
              <Button 
                onClick={clearAllFilters} 
                variant="outline" 
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <X className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-[320px,1fr] gap-0 items-start px-6">
          {/* Sticky Filters Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-[4.75rem] bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl h-[calc(100vh-76px)] flex flex-col border-t-0 border-r-0 rounded-t-none rounded-r-none -mt-1">
              <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 flex-shrink-0">
                <CardTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                    <Filter className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-lg font-semibold !text-gray-900 dark:!text-white">Advanced Filters</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-purple-300 dark:scrollbar-thumb-purple-600 scrollbar-track-purple-50 dark:scrollbar-track-gray-800 hover:scrollbar-thumb-purple-400 dark:hover:scrollbar-thumb-purple-500">
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {/* Search Section */}
                    <div className="p-4">
                      <button
                        onClick={() => setExpandedFacets(prev => ({ ...prev, search: !prev.search }))}
                        className="w-full flex items-center justify-between px-4 py-3 -mx-4 -my-3 hover:bg-purple-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                            <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          </div>
                          <span className="font-semibold !text-gray-900 dark:!text-white text-sm">Search</span>
                          {searchQuery && (
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className={cn(
                          "transition-transform duration-200",
                          expandedFacets.search ? "rotate-180" : ""
                        )}>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                      
                      {expandedFacets.search && (
                        <div className="mt-4 animate-in slide-in-from-top-1 duration-200">
                          <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <Input
                              placeholder="Client name, notes, service..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="pl-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                          </div>
                          {searchQuery && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSearchQuery('')}
                              className="w-full mt-2 text-xs h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Clear search
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Date Filters Section */}
                    <div className="p-4">
                      <button
                        onClick={() => setExpandedFacets(prev => ({ ...prev, dates: !prev.dates }))}
                        className="w-full flex items-center justify-between px-4 py-3 -mx-4 -my-3 hover:bg-purple-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-green-600 dark:text-green-400" />
                          </div>
                          <span className="font-semibold !text-gray-900 dark:!text-white text-sm">Date Filters</span>
                          {(dateRange.start || dateRange.end) && (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className={cn(
                          "transition-transform duration-200",
                          expandedFacets.dates ? "rotate-180" : ""
                        )}>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                      
                      {expandedFacets.dates && (
                        <div className="mt-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                          {/* Quick Date Chips */}
                          <div className="flex flex-wrap gap-2">
                            {quickDateFilters.map(filter => (
                              <Button
                                key={filter.label}
                                variant="outline"
                                size="sm"
                                onClick={() => setDateRange(filter.getValue())}
                                className="text-xs h-8 border-gray-200 dark:border-gray-700 hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700"
                              >
                                {filter.label}
                              </Button>
                            ))}
                          </div>
                          
                          {/* Date Range Inputs */}
                          <div className="space-y-2">
                            <Input
                              type="date"
                              value={dateRange.start?.toISOString().split('T')[0] || ''}
                              onChange={(e) => setDateRange(prev => ({ 
                                ...prev, 
                                start: e.target.value ? new Date(e.target.value) : null 
                              }))}
                              className="text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            />
                            <Input
                              type="date"
                              value={dateRange.end?.toISOString().split('T')[0] || ''}
                              onChange={(e) => setDateRange(prev => ({ 
                                ...prev, 
                                end: e.target.value ? new Date(e.target.value) : null 
                              }))}
                              className="text-sm bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                            />
                          </div>
                          
                          {(dateRange.start || dateRange.end) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setDateRange({ start: null, end: null })}
                              className="w-full text-xs h-8 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Clear dates
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Range Filters Section */}
                    <div className="p-4">
                      <button
                        onClick={() => setExpandedFacets(prev => ({ ...prev, ranges: !prev.ranges }))}
                        className="w-full flex items-center justify-between px-4 py-3 -mx-4 -my-3 hover:bg-purple-50 dark:hover:bg-gray-800/50 rounded-xl transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                            <DollarSign className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                          </div>
                          <span className="font-semibold !text-gray-900 dark:!text-white text-sm">Price & Duration</span>
                          {((priceRange.min > 0 || priceRange.max < 1000) || (durationRange.min > 0 || durationRange.max < 360)) && (
                            <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200 text-xs">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className={cn(
                          "transition-transform duration-200",
                          expandedFacets.ranges ? "rotate-180" : ""
                        )}>
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        </div>
                      </button>
                      
                      {expandedFacets.ranges && (
                        <div className="mt-4 space-y-4 animate-in slide-in-from-top-1 duration-200">
                          {/* Price Range */}
                          <div>
                            <label className="text-xs font-medium !text-gray-700 dark:!text-gray-300 mb-2 block uppercase tracking-wider">
                              Price Range (AED)
                            </label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={priceRange.min}
                                onChange={(e) => setPriceRange(prev => ({ 
                                  ...prev, 
                                  min: Number(e.target.value) || 0 
                                }))}
                                className="text-sm bg-gray-50 dark:bg-gray-900"
                              />
                              <span className="text-gray-400 text-sm">—</span>
                              <Input
                                type="number"
                                placeholder="Max"
                                value={priceRange.max}
                                onChange={(e) => setPriceRange(prev => ({ 
                                  ...prev, 
                                  max: Number(e.target.value) || 1000 
                                }))}
                                className="text-sm bg-gray-50 dark:bg-gray-900"
                              />
                            </div>
                          </div>
                          
                          {/* Duration Range */}
                          <div>
                            <label className="text-xs font-medium !text-gray-700 dark:!text-gray-300 mb-2 block uppercase tracking-wider">
                              Duration (minutes)
                            </label>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                placeholder="Min"
                                value={durationRange.min}
                                onChange={(e) => setDurationRange(prev => ({ 
                                  ...prev, 
                                  min: Number(e.target.value) || 0 
                                }))}
                                className="text-sm bg-gray-50 dark:bg-gray-900"
                              />
                              <span className="text-gray-400 text-sm">—</span>
                              <Input
                                type="number"
                                placeholder="Max"
                                value={durationRange.max}
                                onChange={(e) => setDurationRange(prev => ({ 
                                  ...prev, 
                                  max: Number(e.target.value) || 360 
                                }))}
                                className="text-sm bg-gray-50 dark:bg-gray-900"
                              />
                            </div>
                          </div>
                          
                          {((priceRange.min > 0 || priceRange.max < 1000) || (durationRange.min > 0 || durationRange.max < 360)) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setPriceRange({ min: 0, max: 1000 })
                                setDurationRange({ min: 0, max: 360 })
                              }}
                              className="w-full text-xs h-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20"
                            >
                              <X className="w-3 h-3 mr-1" />
                              Clear ranges
                            </Button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Facet Filters - Stylists */}
                    <div className="p-4">
                      <FacetSection
                        title="Stylist"
                        facet="stylist"
                        values={stylists}
                        icon={<User className="w-4 h-4 text-blue-600 dark:text-blue-400" />}
                      />
                    </div>

                    {/* Facet Filters - Services */}
                    <div className="p-4">
                      <FacetSection
                        title="Service"
                        facet="service"
                        values={services}
                        icon={<Scissors className="w-4 h-4 text-purple-600 dark:text-purple-400" />}
                      />
                    </div>

                    {/* Facet Filters - Status */}
                    <div className="p-4">
                      <FacetSection
                        title="Status"
                        facet="status"
                        values={statuses}
                        icon={<CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />}
                      />
                    </div>

                    {/* Facet Filters - Payment */}
                    <div className="p-4">
                      <FacetSection
                        title="Payment"
                        facet="payment"
                        values={payments}
                        icon={<CreditCard className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                      />
                    </div>
                  </div>
                </CardContent>
            </Card>
          </div>

          {/* Results Section */}
          <div>
            <Card className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-gray-200/50 dark:border-gray-700/50 shadow-xl overflow-hidden border-l-0 rounded-l-none -mt-1">
              <CardContent className="p-0">
                {/* Applied Filters Summary */}
                {(Object.values(facetFilters).some(f => f.length > 0) || searchQuery || dateRange.start) && (
                  <div className="px-6 py-3 bg-purple-50 dark:bg-purple-900/20 border-b border-purple-100 dark:border-purple-800">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium !text-purple-900 dark:!text-purple-100">Active filters:</span>
                      {searchQuery && (
                        <Badge className="bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                          Search: {searchQuery}
                        </Badge>
                      )}
                      {dateRange.start && (
                        <Badge className="bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                          {formatDate(dateRange.start)} - {dateRange.end ? formatDate(dateRange.end) : 'Present'}
                        </Badge>
                      )}
                      {Object.entries(facetFilters).map(([key, values]) => 
                        values.length > 0 && (
                          <Badge key={key} className="bg-white dark:bg-gray-800 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700">
                            {key}: {values.length} selected
                          </Badge>
                        )
                      )}
                    </div>
                  </div>
                )}
                
                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-purple-50/30 dark:from-gray-900 dark:to-purple-900/10 border-b border-gray-200 dark:border-gray-700">
                      <tr>
                        {[
                          { key: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
                          { key: 'time', label: 'Time', icon: <Clock className="w-4 h-4" /> },
                          { key: 'client', label: 'Client', icon: <User className="w-4 h-4" /> },
                          { key: 'stylist', label: 'Stylist', icon: <User className="w-4 h-4" /> },
                          { key: 'service', label: 'Service', icon: <Scissors className="w-4 h-4" /> },
                          { key: 'status', label: 'Status', icon: <CheckCircle className="w-4 h-4" /> },
                          { key: 'payment', label: 'Payment', icon: <CreditCard className="w-4 h-4" /> },
                          { key: 'duration', label: 'Duration', icon: <Clock className="w-4 h-4" /> },
                          { key: 'price', label: 'Price', icon: <DollarSign className="w-4 h-4" /> }
                        ].map(col => (
                          <th
                            key={col.key}
                            className="px-6 py-4 text-left text-xs font-semibold !text-gray-900 dark:!text-white uppercase tracking-wider cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-900/20 transition-colors group"
                            onClick={() => toggleSort(col.key as keyof Appointment)}
                          >
                            <div className="flex items-center gap-2">
                              <span className="opacity-60 group-hover:opacity-100 transition-opacity">{col.icon}</span>
                              <span>{col.label}</span>
                              {sortConfig.field === col.key ? (
                                <ChevronUp className={cn(
                                  "w-3 h-3 transition-transform",
                                  sortConfig.direction === 'desc' && "rotate-180"
                                )} />
                              ) : (
                                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                              )}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800">
                      {sortedAppointments.map((apt, index) => (
                        <tr 
                          key={apt.id} 
                          className={cn(
                            "hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-all duration-150 border-b border-gray-100 dark:border-gray-800",
                            index % 2 === 0 ? "bg-white dark:bg-gray-800" : "bg-gray-50/50 dark:bg-gray-800/50"
                          )}
                        >
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-gray-900 dark:!text-white font-medium">
                          {formatDate(apt.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-gray-700 dark:!text-gray-300">
                          {apt.time}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium !text-gray-900 dark:!text-white">
                              {apt.client}
                            </div>
                            {apt.phone && (
                              <div className="text-xs !text-gray-500 dark:!text-gray-400">
                                {apt.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-gray-700 dark:!text-gray-300">
                          {apt.stylist}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm !text-gray-900 dark:!text-white font-medium">
                            {apt.service}
                          </div>
                          {apt.notes && (
                            <div className="text-xs !text-gray-500 dark:!text-gray-400 mt-1 max-w-xs truncate">
                              {apt.notes}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={cn("border", getStatusColor(apt.status))}>
                            {apt.status}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-gray-700 dark:!text-gray-300">
                          {apt.payment}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm !text-gray-700 dark:!text-gray-300">
                          {formatDuration(apt.duration)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium !text-gray-900 dark:!text-white">
                          AED {apt.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

                {sortedAppointments.length === 0 && (
                  <div className="text-center py-24 px-6">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/20 mb-6">
                      <Calendar className="w-10 h-10 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="text-lg font-semibold !text-gray-900 dark:!text-white mb-2">
                      No appointments found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
                      Try adjusting your filters or search terms to find what you're looking for.
                    </p>
                    <div className="flex items-center justify-center gap-3">
                      <Button
                        onClick={clearAllFilters}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Clear all filters
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                        className="border-gray-300 dark:border-gray-600"
                      >
                        Refresh data
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}