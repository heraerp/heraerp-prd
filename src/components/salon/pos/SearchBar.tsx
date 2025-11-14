'use client'

import React, { useEffect, useState } from 'react'
import { Search, Calendar, User, Phone, Mail, Clock, MapPin } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { universalApi } from '@/lib/universal-api-v2'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  type: 'appointment' | 'customer'
  entity_name: string
  entity_code?: string
  smart_code: string
  // Appointment specific
  start_time?: string
  end_time?: string
  status?: string
  stylist_name?: string
  chair_name?: string
  service_names?: string[]
  // Customer specific
  phone?: string
  email?: string
  last_visit?: string
}

interface SearchBarProps {
  organizationId: string
  onSelect: (type: 'appointment' | 'customer', id: string) => void
}

export function SearchBar({ organizationId, onSelect }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch(query.trim())
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, organizationId])

  const performSearch = async (searchQuery: string) => {
    try {
      setLoading(true)
      const searchResults: SearchResult[] = []

      // Check if it's an appointment ID (starts with APPT- or is numeric)
      const isAppointmentId = /^(APPT-|#)?[\d]+$/.test(searchQuery.replace(/\s/g, ''))

      if (isAppointmentId) {
        // Search appointments by ID
        const appointmentCode = searchQuery.replace(/^(APPT-|#)/, '').trim()
        const appointmentsResponse = await universalApi.read({
          table: 'core_entities',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'entity_type', operator: 'eq', value: 'appointment' },
            { field: 'entity_code', operator: 'ilike', value: `%${appointmentCode}%` }
          ]
        })

        if (appointmentsResponse?.data) {
          for (const appt of appointmentsResponse.data) {
            // Load dynamic data for appointment details
            const dynamicResponse = await universalApi.read({
              table: 'core_dynamic_data',
              filters: [
                { field: 'organization_id', operator: 'eq', value: organizationId },
                { field: 'entity_id', operator: 'eq', value: appt.id }
              ]
            })

            const dynamicData = dynamicResponse?.data || []
            const dynamicFields: any = {}
            dynamicData.forEach(field => {
              dynamicFields[field.field_name] =
                field.field_value_text ||
                field.field_value_number ||
                field.field_value_date ||
                field.field_value_boolean
            })

            searchResults.push({
              id: appt.id,
              type: 'appointment',
              entity_name: appt.entity_name,
              entity_code: appt.entity_code,
              smart_code: appt.smart_code,
              start_time: dynamicFields.start_time,
              end_time: dynamicFields.end_time,
              status: dynamicFields.status || 'scheduled',
              stylist_name: dynamicFields.stylist_name,
              chair_name: dynamicFields.chair_name,
              service_names: dynamicFields.services ? dynamicFields.services.split(',') : []
            })
          }
        }
      } else {
        // Search customers by name, phone, email
        const customersResponse = await universalApi.read({
          table: 'core_entities',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'entity_type', operator: 'eq', value: 'customer' },
            { field: 'entity_name', operator: 'ilike', value: `%${searchQuery}%` }
          ]
        })

        if (customersResponse?.data) {
          // Load dynamic data for customers
          const customerIds = customersResponse.data.map(c => c.id)
          let customerDynamicData: any[] = []

          if (customerIds.length > 0) {
            const dynamicResponse = await universalApi.read({
              table: 'core_dynamic_data',
              filters: [
                { field: 'organization_id', operator: 'eq', value: organizationId },
                { field: 'entity_id', operator: 'in', value: customerIds }
              ]
            })
            customerDynamicData = dynamicResponse?.data || []
          }

          for (const customer of customersResponse.data) {
            const customerFields = customerDynamicData.filter(d => d.entity_id === customer.id)
            const dynamicFields: any = {}
            customerFields.forEach(field => {
              dynamicFields[field.field_name] =
                field.field_value_text ||
                field.field_value_number ||
                field.field_value_date ||
                field.field_value_boolean
            })

            // Check if phone or email matches
            const phoneMatch = dynamicFields.phone && dynamicFields.phone.includes(searchQuery)
            const emailMatch =
              dynamicFields.email &&
              dynamicFields.email.toLowerCase().includes(searchQuery.toLowerCase())
            const nameMatch = customer.entity_name.toLowerCase().includes(searchQuery.toLowerCase())

            if (nameMatch || phoneMatch || emailMatch) {
              searchResults.push({
                id: customer.id,
                type: 'customer',
                entity_name: customer.entity_name,
                entity_code: customer.entity_code,
                smart_code: customer.smart_code,
                phone: dynamicFields.phone,
                email: dynamicFields.email,
                last_visit: dynamicFields.last_visit
              })
            }
          }
        }

        // Also search appointments by customer name
        const appointmentsResponse = await universalApi.read({
          table: 'core_entities',
          filters: [
            { field: 'organization_id', operator: 'eq', value: organizationId },
            { field: 'entity_type', operator: 'eq', value: 'appointment' }
          ]
        })

        if (appointmentsResponse?.data) {
          // This is a simplified search - in production you'd want to join with customer data
          for (const appt of appointmentsResponse.data.slice(0, 5)) {
            // Limit to prevent too many results
            if (appt.entity_name.toLowerCase().includes(searchQuery.toLowerCase())) {
              const dynamicResponse = await universalApi.read({
                table: 'core_dynamic_data',
                filters: [
                  { field: 'organization_id', operator: 'eq', value: organizationId },
                  { field: 'entity_id', operator: 'eq', value: appt.id }
                ]
              })

              const dynamicData = dynamicResponse?.data || []
              const dynamicFields: any = {}
              dynamicData.forEach(field => {
                dynamicFields[field.field_name] =
                  field.field_value_text ||
                  field.field_value_number ||
                  field.field_value_date ||
                  field.field_value_boolean
              })

              searchResults.push({
                id: appt.id,
                type: 'appointment',
                entity_name: appt.entity_name,
                entity_code: appt.entity_code,
                smart_code: appt.smart_code,
                start_time: dynamicFields.start_time,
                end_time: dynamicFields.end_time,
                status: dynamicFields.status || 'scheduled',
                stylist_name: dynamicFields.stylist_name,
                chair_name: dynamicFields.chair_name,
                service_names: dynamicFields.services ? dynamicFields.services.split(',') : []
              })
            }
          }
        }
      }

      setResults(searchResults.slice(0, 10)) // Limit to 10 results
      setShowResults(searchResults.length > 0)
      setSelectedIndex(-1)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setShowResults(false)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => Math.max(prev - 1, -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex])
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        searchRef.current?.blur()
        break
    }
  }

  const handleSelect = (result: SearchResult) => {
    onSelect(result.type, result.id)
    setQuery('')
    setShowResults(false)
    setSelectedIndex(-1)
    searchRef.current?.blur()
  }

  const formatTime = (timeString?: string) => {
    if (!timeString) return ''
    try {
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } catch {
      return timeString
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ink-muted dark:text-slate-300" />
        <Input
          ref={searchRef}
          id="pos-search-input"
          placeholder="Search customers, appointments, or enter appointment ID..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setShowResults(true)
          }}
          className="pl-10 pr-4 py-3 text-lg bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-slate-300 dark:border-slate-600 dark:text-white placeholder: dark:placeholder:ink-muted"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && results.length > 0 && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-slate-200 dark:border-slate-700">
          <CardContent className="p-0">
            {results.map((result, index) => (
              <div
                key={`${result.type}-${result.id}`}
                className={cn(
                  'p-4 border-b border-slate-100 dark:border-slate-800 last:border-b-0 cursor-pointer transition-colors',
                  index === selectedIndex && 'bg-blue-50 dark:bg-blue-950',
                  'hover:bg-slate-50 dark:hover:bg-slate-800'
                )}
                onClick={() => handleSelect(result)}
              >
                {result.type === 'appointment' ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">
                          {result.entity_code || `#${result.id.slice(-6)}`}
                        </span>
                        <Badge className={cn('text-xs', getStatusColor(result.status))}>
                          {result.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(result.start_time)}
                      </div>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(result.start_time)} - {formatTime(result.end_time)}
                        </div>
                        {result.stylist_name && (
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {result.stylist_name}
                          </div>
                        )}
                        {result.chair_name && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {result.chair_name}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-lg font-medium">{result.entity_name}</div>

                    {result.service_names && result.service_names.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {result.service_names.map((service, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {service}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-green-600" />
                      <span className="text-lg font-medium">{result.entity_name}</span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {result.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {result.phone}
                        </div>
                      )}
                      {result.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {result.email}
                        </div>
                      )}
                      {result.last_visit && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Last visit: {formatDate(result.last_visit)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search hints */}
      {query.length === 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Try: customer name, phone number, email, or appointment ID (e.g., "APPT-123" or "#123")
        </div>
      )}
    </div>
  )
}
