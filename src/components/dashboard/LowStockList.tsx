'use client'

import React from 'react'
import Link from 'next/link'
import { Package, AlertTriangle, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useInventoryApiSimple } from '@/lib/api/inventory'

interface LowStockListProps {
  organizationId: string
}

export function LowStockList({ organizationId }: LowStockListProps) {
  const { data, isLoading } = useInventoryApiSimple(organizationId).listLowStock({
    organizationId,
    limit: 5
  })

  const items = data?.items || []

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Low Stock Alert
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-6 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStockLevel = (onHand: number, reorderPoint: number) => {
    const percentage = (onHand / reorderPoint) * 100
    if (percentage === 0) return { color: 'bg-red-500', text: 'Out of Stock' }
    if (percentage < 50) return { color: 'bg-orange-500', text: 'Critical' }
    return { color: 'bg-yellow-500', text: 'Low' }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Low Stock Alert
          {items.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {items.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">All items are well stocked</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map(item => {
              const stockLevel = getStockLevel(item.on_hand, item.reorder_point)

              return (
                <Link
                  key={item.id}
                  href={`/inventory/products/${item.id}`}
                  className="block focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-lg"
                >
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Code: {item.code} • Reorder: {item.reorder_point}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.on_hand}</p>
                        <Badge variant="secondary" className={stockLevel.color}>
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {stockLevel.text}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        <Link href="/inventory/alerts" className="w-full">
          <Button variant="ghost" className="w-full">
            View All Low Stock
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
