import React from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ValuationSummary as ValuationData } from '@/schemas/inventory'
import { TrendingUp, Package, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ValuationSummaryProps {
  summary: ValuationData[]
  totalValue: number
  totalQuantity: number
  loading: boolean
}

const COLORS = {
  black: '#0B0B0B',
  charcoal: '#1A1A1A',
  gold: '#D4AF37',
  goldDark: '#B8860B',
  champagne: '#F5E6C8',
  bronze: '#8C7853',
  emerald: '#0F6F5C',
  plum: '#5A2A40',
  rose: '#E8B4B8',
  lightText: '#E0E0E0'
}

export function ValuationSummary({ summary, totalValue, totalQuantity, loading }: ValuationSummaryProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-lg border border-border bg-card/50 p-6">
              <div className="animate-pulse space-y-2">
                <div className="h-4 w-20 bg-muted/30 rounded" />
                <div className="h-8 w-32 bg-muted/30 rounded" />
              </div>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card/50 p-8">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-12 bg-muted/30 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Summary cards
  const averageValue = totalQuantity > 0 ? totalValue / totalQuantity : 0

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.bronze }}>
              <Package className="h-4 w-4" />
              Total Stock Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: COLORS.gold }}>
              AED {totalValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.bronze }}>
              <TrendingUp className="h-4 w-4" />
              Total Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: COLORS.champagne }}>
              {totalQuantity.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2" style={{ color: COLORS.bronze }}>
              <DollarSign className="h-4 w-4" />
              Average Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: COLORS.lightText }}>
              AED {averageValue.toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      {summary.length === 0 ? (
        <div className="rounded-lg border border-border bg-card/50 p-12 text-center">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-lg font-medium" style={{ color: COLORS.lightText }}>
            No valuation data available
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Valuation will appear after stock movements
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead style={{ color: COLORS.bronze }}>Item</TableHead>
                <TableHead style={{ color: COLORS.bronze }}>Branch</TableHead>
                <TableHead className="text-right" style={{ color: COLORS.bronze }}>
                  Quantity
                </TableHead>
                <TableHead className="text-right" style={{ color: COLORS.bronze }}>
                  Unit Cost
                </TableHead>
                <TableHead className="text-right" style={{ color: COLORS.bronze }}>
                  Total Value
                </TableHead>
                <TableHead style={{ color: COLORS.bronze }}>Method</TableHead>
                <TableHead style={{ color: COLORS.bronze }}>Last Movement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {summary.map((item, index) => (
                <TableRow
                  key={`${item.item_id}-${item.branch_id}`}
                  className={cn(
                    "border-b border-border hover:bg-muted/30 transition-colors",
                    index % 2 === 0 && "bg-muted/10"
                  )}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium" style={{ color: COLORS.champagne }}>
                        {item.item_name}
                      </p>
                      {item.item_code && (
                        <p className="text-xs text-muted-foreground">{item.item_code}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell style={{ color: COLORS.lightText }}>
                    {item.branch_name}
                  </TableCell>
                  <TableCell className="text-right font-medium" style={{ color: COLORS.lightText }}>
                    {item.quantity.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right" style={{ color: COLORS.lightText }}>
                    AED {item.unit_cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-medium" style={{ color: COLORS.gold }}>
                    AED {item.total_value.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-muted/50">
                      {item.valuation_method}
                    </Badge>
                  </TableCell>
                  <TableCell style={{ color: COLORS.lightText }}>
                    {item.last_movement_date 
                      ? new Date(item.last_movement_date).toLocaleDateString()
                      : '-'
                    }
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}