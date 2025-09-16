'use client'

import React from 'react'
import { Card, CardContent }
from '@/components/ui/card'
import { LucideIcon }
from 'lucide-react'
import { cn }
from '@/lib/utils'


interface FurnitureStatCardProps {
  label: string
  value: string | number
  change?: string
  trend?: 'up' | 'down' | 'neutral'
  icon: LucideIcon
  gradient: string
  className?: string
}

export function FurnitureStatCard({ label, value, change, trend = 'neutral', icon: Icon, gradient, className
}: FurnitureStatCardProps) { // Determine change text color based on trend const changeColorClass = { up: 'text-green-400', down: 'text-red-400', neutral: 'text-[var(--color-text-secondary)]' }[trend] return ( <Card className={cn( 'backdrop-blur-xl bg-[var(--color-body)]/70', 'border-[var(--color-border)]/50', 'shadow-lg hover:shadow-xl transition-shadow', className )} > <CardContent className="p-6"> <div className="flex items-center justify-between"> <div className="bg-[var(--color-body)] flex-1"> <p className="text-sm font-medium text-gray-300 uppercase tracking-wide">{label}</p> <p className="text-3xl font-bold mt-2 text-[var(--color-text-primary)]"> {typeof value === 'number' ? value.toLocaleString() : value} </p> {change && <p className={cn('text-xs mt-1 font-medium', changeColorClass)}>{change}</p>} </div> {Icon && ( <div className={cn( 'w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg', 'bg-gradient-to-br', gradient )} > <Icon className="w-7 h-7 text-[var(--color-text-primary)]" /> </div> )} </div> </CardContent> </Card> )
}
