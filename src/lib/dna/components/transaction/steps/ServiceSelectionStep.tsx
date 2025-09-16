'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import { Input } from '@/src/components/ui/input'
import { Checkbox } from '@/src/components/ui/checkbox'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import {
  Search,
  Clock,
  DollarSign,
  Star,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { cn } from '@/src/lib/utils'
import type { TransactionStepProps } from '../UniversalTransactionFlow'

interface Service {
  id: string
  name: string
  category: string
  duration: number
  price: number
  description?: string
  popular?: boolean
  staffRequired?: boolean
}

// Mock service data - in real app, this would come from API
const mockServices: Service[] = [
  {
    id: 'srv-001',
    name: 'Haircut & Style',
    category: 'Hair',
    duration: 45,
    price: 45,
    description: 'Professional cut and styling',
    popular: true,
    staffRequired: true
  },
  {
    id: 'srv-002',
    name: 'Hair Color',
    category: 'Hair',
    duration: 120,
    price: 120,
    description: 'Full color service with premium products',
    staffRequired: true
  },
  {
    id: 'srv-003',
    name: 'Manicure',
    category: 'Nails',
    duration: 30,
    price: 30,
    description: 'Classic manicure with polish',
    popular: true,
    staffRequired: true
  },
  {
    id: 'srv-004',
    name: 'Pedicure',
    category: 'Nails',
    duration: 45,
    price: 45,
    description: 'Relaxing pedicure treatment',
    staffRequired: true
  },
  {
    id: 'srv-005',
    name: 'Facial Treatment',
    category: 'Skin',
    duration: 60,
    price: 80,
    description: 'Deep cleansing facial',
    popular: true,
    staffRequired: true
  }
]

export function ServiceSelectionStep({
  data,
  onChange,
  errors,
  locale,
  industry,
  readonly
}: TransactionStepProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expandedServices, setExpandedServices] = useState<Set<string>>(new Set())
  
  const selectedServices = data.services || []
  
  // Get unique categories
  const categories = Array.from(new Set(mockServices.map(s => s.category)))
  
  // Filter services
  const filteredServices = mockServices.filter(service => {
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || service.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })
  
  // Group services by category
  const groupedServices = filteredServices.reduce((acc, service) => {
    if (!acc[service.category]) acc[service.category] = []
    acc[service.category].push(service)
    return acc
  }, {} as Record<string, Service[]>)
  
  // Calculate totals
  const totalDuration = selectedServices.reduce((sum, serviceId) => {
    const service = mockServices.find(s => s.id === serviceId)
    return sum + (service?.duration || 0)
  }, 0)
  
  const totalPrice = selectedServices.reduce((sum, serviceId) => {
    const service = mockServices.find(s => s.id === serviceId)
    return sum + (service?.price || 0)
  }, 0)
  
  const handleServiceToggle = (serviceId: string) => {
    if (readonly) return
    
    const newServices = selectedServices.includes(serviceId)
      ? selectedServices.filter(id => id !== serviceId)
      : [...selectedServices, serviceId]
    
    onChange({ 
      services: newServices,
      estimatedDuration: totalDuration,
      estimatedPrice: totalPrice
    })
  }
  
  const toggleExpanded = (serviceId: string) => {
    setExpandedServices(prev => {
      const newSet = new Set(prev)
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId)
      } else {
        newSet.add(serviceId)
      }
      return newSet
    })
  }
  
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    }
    return `${mins}m`
  }
  
  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
            disabled={readonly}
          />
        </div>
        
        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            disabled={readonly}
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              disabled={readonly}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      
      {/* Services List */}
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-4">
          {Object.entries(groupedServices).map(([category, services]) => (
            <div key={category} className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                {category}
              </h4>
              
              <div className="space-y-2">
                {services.map(service => {
                  const isSelected = selectedServices.includes(service.id)
                  const isExpanded = expandedServices.has(service.id)
                  
                  return (
                    <Card
                      key={service.id}
                      className={cn(
                        'transition-all',
                        isSelected && 'border-primary bg-primary/5'
                      )}
                    >
                      <div className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleServiceToggle(service.id)}
                            disabled={readonly}
                            className="mt-1"
                          />
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium">{service.name}</h5>
                                  {service.popular && (
                                    <Badge variant="secondary" className="text-xs">
                                      <Star className="w-3 h-3 mr-1" />
                                      Popular
                                    </Badge>
                                  )}
                                </div>
                                
                                {service.description && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {service.description}
                                  </p>
                                )}
                              </div>
                              
                              <div className="text-right">
                                <p className="font-semibold">${service.price}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(service.duration)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Expandable Details */}
                            <button
                              onClick={() => toggleExpanded(service.id)}
                              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Info className="w-3 h-3" />
                              More info
                              {isExpanded ? (
                                <ChevronUp className="w-3 h-3" />
                              ) : (
                                <ChevronDown className="w-3 h-3" />
                              )}
                            </button>
                            
                            {isExpanded && (
                              <Card className="p-3 bg-muted/50">
                                <div className="text-sm space-y-1">
                                  <p>• Professional service by certified staff</p>
                                  <p>• Premium products included</p>
                                  <p>• Satisfaction guaranteed</p>
                                </div>
                              </Card>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
      
      {/* Selection Summary */}
      {selectedServices.length > 0 && (
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">
                {selectedServices.length} service{selectedServices.length !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total duration: {formatDuration(totalDuration)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">${totalPrice}</p>
              <p className="text-xs text-muted-foreground">Total price</p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Validation Error */}
      {errors.services && (
        <p className="text-sm text-destructive">{errors.services}</p>
      )}
    </div>
  )
}