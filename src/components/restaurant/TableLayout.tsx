'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Coffee,
  UtensilsCrossed,
  Receipt
} from 'lucide-react'

interface Table {
  id: string
  number: string
  seats: number
  status: 'available' | 'occupied' | 'reserved' | 'cleaning'
  server?: string
  guests?: number
  checkTotal?: number
  duration?: number // minutes
  course?: 'drinks' | 'appetizer' | 'entree' | 'dessert' | 'check'
}

interface TableLayoutProps {
  isOnline: boolean
  currentServer: {
    name: string
    id: string
  }
}

export function TableLayout({ isOnline, currentServer }: TableLayoutProps) {
  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [floorView, setFloorView] = useState<'main' | 'patio' | 'private'>('main')

  // Demo table data
  const tables: Table[] = [
    // Row 1 - Booths
    {
      id: 't1',
      number: '1',
      seats: 4,
      status: 'occupied',
      server: currentServer.name,
      guests: 3,
      checkTotal: 87.5,
      duration: 45,
      course: 'entree'
    },
    {
      id: 't2',
      number: '2',
      seats: 4,
      status: 'occupied',
      server: 'Mike R.',
      guests: 2,
      checkTotal: 54.25,
      duration: 62,
      course: 'dessert'
    },
    { id: 't3', number: '3', seats: 4, status: 'available' },
    { id: 't4', number: '4', seats: 4, status: 'reserved' },

    // Row 2 - 2-tops
    {
      id: 't5',
      number: '5',
      seats: 2,
      status: 'occupied',
      server: currentServer.name,
      guests: 2,
      checkTotal: 128.0,
      duration: 38,
      course: 'entree'
    },
    { id: 't6', number: '6', seats: 2, status: 'available' },
    {
      id: 't7',
      number: '7',
      seats: 2,
      status: 'occupied',
      server: 'Lisa K.',
      guests: 2,
      checkTotal: 45.75,
      duration: 15,
      course: 'drinks'
    },
    { id: 't8', number: '8', seats: 2, status: 'cleaning' },

    // Row 3 - 4-tops center
    {
      id: 't9',
      number: '9',
      seats: 4,
      status: 'occupied',
      server: currentServer.name,
      guests: 4,
      checkTotal: 156.8,
      duration: 78,
      course: 'check'
    },
    { id: 't10', number: '10', seats: 4, status: 'available' },
    {
      id: 't11',
      number: '11',
      seats: 4,
      status: 'occupied',
      server: 'Mike R.',
      guests: 3,
      checkTotal: 92.5,
      duration: 52,
      course: 'entree'
    },
    { id: 't12', number: '12', seats: 4, status: 'available' },

    // Row 4 - Large tables
    {
      id: 't13',
      number: '13',
      seats: 6,
      status: 'occupied',
      server: currentServer.name,
      guests: 5,
      checkTotal: 234.75,
      duration: 95,
      course: 'dessert'
    },
    { id: 't14', number: '14', seats: 6, status: 'reserved' },
    {
      id: 't15',
      number: '15',
      seats: 8,
      status: 'occupied',
      server: 'Lisa K.',
      guests: 7,
      checkTotal: 412.5,
      duration: 68,
      course: 'entree'
    },
    { id: 't16', number: '16', seats: 8, status: 'available' }
  ]

  const getTableColor = (table: Table) => {
    switch (table.status) {
      case 'available':
        return 'bg-green-100 hover:bg-green-200 border-green-300'
      case 'occupied':
        return 'bg-blue-100 hover:bg-blue-200 border-blue-300'
      case 'reserved':
        return 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300'
      case 'cleaning':
        return 'bg-muted hover:bg-gray-200 border-border'
    }
  }

  const getCourseIcon = (course?: string) => {
    switch (course) {
      case 'drinks':
        return <Coffee className="h-4 w-4" />
      case 'appetizer':
        return <UtensilsCrossed className="h-4 w-4" />
      case 'entree':
        return <UtensilsCrossed className="h-4 w-4" />
      case 'dessert':
        return <Coffee className="h-4 w-4" />
      case 'check':
        return <Receipt className="h-4 w-4" />
      default:
        return null
    }
  }

  const handleTableClick = (table: Table) => {
    setSelectedTable(table)
    // Open POS terminal for this table
  }

  const serverTables = tables.filter(t => t.server === currentServer.name)
  const serverStats = {
    tables: serverTables.length,
    guests: serverTables.reduce((sum, t) => sum + (t.guests || 0), 0),
    sales: serverTables.reduce((sum, t) => sum + (t.checkTotal || 0), 0)
  }

  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Tables</p>
                <p className="text-2xl font-bold">{serverStats.tables}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Guests</p>
                <p className="text-2xl font-bold">{serverStats.guests}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Your Sales</p>
                <p className="text-2xl font-bold">${serverStats.sales.toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Turn Time</p>
                <p className="text-2xl font-bold">52m</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Floor View Tabs */}
      <div className="flex items-center gap-2">
        <Button
          variant={floorView === 'main' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFloorView('main')}
        >
          Main Floor
        </Button>
        <Button
          variant={floorView === 'patio' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFloorView('patio')}
        >
          Patio
        </Button>
        <Button
          variant={floorView === 'private' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFloorView('private')}
        >
          Private Dining
        </Button>
      </div>

      {/* Table Grid */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              Floor Plan -{' '}
              {floorView === 'main'
                ? 'Main Floor'
                : floorView === 'patio'
                  ? 'Patio'
                  : 'Private Dining'}
            </CardTitle>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                <span>Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
                <span>Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                <span>Reserved</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted border border-border rounded"></div>
                <span>Cleaning</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {tables.map(table => (
              <button
                key={table.id}
                onClick={() => handleTableClick(table)}
                className={cn(
                  'relative p-4 rounded-lg border-2 transition-all',
                  getTableColor(table),
                  table.server === currentServer.name && 'ring-2 ring-orange-400 ring-offset-2'
                )}
              >
                {/* Table Number */}
                <div className="text-2xl font-bold text-center mb-2">{table.number}</div>

                {/* Table Info */}
                <div className="text-xs text-muted-foreground text-center mb-2">{table.seats} seats</div>

                {/* Occupied Details */}
                {table.status === 'occupied' && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium">{table.server}</div>
                    <div className="flex items-center justify-between text-xs">
                      <span>{table.guests} guests</span>
                      <span>{table.duration}m</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold">${table.checkTotal?.toFixed(2)}</span>
                      {getCourseIcon(table.course)}
                    </div>
                  </div>
                )}

                {/* Reserved Badge */}
                {table.status === 'reserved' && (
                  <div className="text-xs text-center">
                    <Badge variant="secondary" className="text-xs">
                      7:30 PM
                    </Badge>
                  </div>
                )}

                {/* Cleaning Status */}
                {table.status === 'cleaning' && (
                  <div className="text-xs text-center text-muted-foreground">Bus & Reset</div>
                )}

                {/* Alert Indicators */}
                {table.status === 'occupied' && table.duration && table.duration > 90 && (
                  <div className="absolute top-1 right-1">
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  </div>
                )}

                {table.status === 'occupied' && table.course === 'check' && (
                  <div className="absolute top-1 right-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline">
          <Users className="h-4 w-4 mr-2" />
          Host Stand
        </Button>
        <Button variant="outline">
          <Clock className="h-4 w-4 mr-2" />
          Reservations
        </Button>
        <Button variant="outline">
          <AlertCircle className="h-4 w-4 mr-2" />
          86 List
        </Button>
      </div>
    </div>
  )
}
