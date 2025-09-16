'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/src/components/ui/card'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/src/components/ui/select'
import { Input } from '@/src/components/ui/input'
import { Label } from '@/src/components/ui/label'
import {
  Calculator,
  GitBranch,
  Settings,
  Play,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  ArrowRight
} from 'lucide-react'

interface CostPool {
  id: string
  pool_name: string
  pool_type: string
  cost_driver: string
  total_cost: number
  total_driver_units: number
  rate_per_unit: number
  status: string
  smart_code: string
}

interface AllocationRule {
  id: string
  from_pool: string
  to_entities: string[]
  allocation_basis: string
  percentage?: number
}

export function CostAllocationManager({ organizationId }: { organizationId: string }) {
  const [costPools, setCostPools] = useState<CostPool[]>([])
  const [allocationMethod, setAllocationMethod] = useState('activity_based')
  const [isAllocating, setIsAllocating] = useState(false)
  const [lastAllocation, setLastAllocation] = useState<any>(null)

  useEffect(() => {
    loadCostPools()
  }, [organizationId])

  const loadCostPools = async () => {
    try {
      const response = await fetch(
        `/api/v1/profitability?action=list&entity_type=cost_pools&organization_id=${organizationId}`
      )
      const data = await response.json()
      if (data.success) {
        setCostPools(data.data)
      }
    } catch (error) {
      console.error('Failed to load cost pools:', error)
    }
  }

  const runAllocation = async () => {
    setIsAllocating(true)
    try {
      const response = await fetch('/api/v1/profitability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'allocate_costs',
          organization_id: organizationId,
          data: {
            method: allocationMethod,
            period: new Date().toISOString().slice(0, 7)
          }
        })
      })

      const result = await response.json()
      if (result.success) {
        setLastAllocation(result.data)
      }
    } catch (error) {
      console.error('Allocation failed:', error)
    } finally {
      setIsAllocating(false)
    }
  }

  const getMethodDescription = (method: string) => {
    const descriptions: Record<string, string> = {
      activity_based: 'Allocate costs based on actual consumption of activities',
      step_down: 'Sequential allocation from service departments to production',
      direct: 'Direct tracing of costs to specific cost objects',
      reciprocal: 'Simultaneous allocation considering interdepartmental services'
    }
    return descriptions[method] || ''
  }

  return (
    <div className="space-y-6">
      {/* Allocation Method Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="w-5 h-5" />
            Cost Allocation Configuration
          </CardTitle>
          <CardDescription>
            Configure how costs are allocated across profit centers and products
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Allocation Method</Label>
            <Select value={allocationMethod} onValueChange={setAllocationMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activity_based">
                  <div>
                    <div className="font-medium">Activity-Based Costing (ABC)</div>
                    <div className="text-xs text-muted-foreground">
                      Most accurate for complex operations
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="step_down">
                  <div>
                    <div className="font-medium">Step-Down Method</div>
                    <div className="text-xs text-muted-foreground">
                      Good for service department allocation
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="direct">
                  <div>
                    <div className="font-medium">Direct Method</div>
                    <div className="text-xs text-muted-foreground">
                      Simple, ignores interdepartmental services
                    </div>
                  </div>
                </SelectItem>
                <SelectItem value="reciprocal">
                  <div>
                    <div className="font-medium">Reciprocal Method</div>
                    <div className="text-xs text-muted-foreground">
                      Most accurate but computationally intensive
                    </div>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground mt-2">{getMethodDescription(allocationMethod)}</p>
          </div>

          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <Info className="w-4 h-4 text-primary" />
            <p className="text-sm text-blue-800">
              Using Smart Code:{' '}
              <Badge variant="outline" className="ml-1">
                HERA.COST.ALLOC.ABC.v1
              </Badge>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Cost Pools Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Active Cost Pools</CardTitle>
          <CardDescription>Cost pools ready for allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {costPools.map(pool => (
              <div key={pool.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium">{pool.pool_name}</h4>
                    <Badge variant="outline" className="text-xs mt-1">
                      {pool.smart_code}
                    </Badge>
                  </div>
                  <Badge variant={pool.status === 'active' ? 'default' : 'secondary'}>
                    {pool.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total Cost</p>
                    <p className="font-medium">${pool.total_cost.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Cost Driver</p>
                    <p className="font-medium">{pool.cost_driver}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rate</p>
                    <p className="font-medium">
                      ${pool.rate_per_unit}/{pool.cost_driver}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Allocation Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Run Cost Allocation</CardTitle>
          <CardDescription>Execute cost allocation for the current period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
            <div>
              <p className="font-medium">Current Period</p>
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Button onClick={runAllocation} disabled={isAllocating} size="lg">
              {isAllocating ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Allocating...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Allocation
                </>
              )}
            </Button>
          </div>

          {/* Last Allocation Results */}
          {lastAllocation && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-900">Allocation Completed</h4>
                  <p className="text-sm text-green-700 mt-1">
                    Successfully allocated costs for {lastAllocation.allocation_period}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                {lastAllocation.allocations.map((alloc: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{alloc.cost_pool}</span>
                    <div className="text-right">
                      <span className="font-medium">${alloc.total_allocated.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-2">
                        ({alloc.allocation_count} allocations)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Allocation Rules Preview */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Allocation Flow
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1 bg-blue-100 rounded">Machine Hours Pool</div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="px-3 py-1 bg-green-100 rounded">Products (by machine usage)</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1 bg-blue-100 rounded">Setup Costs Pool</div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="px-3 py-1 bg-green-100 rounded">Products (by setup count)</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="px-3 py-1 bg-blue-100 rounded">Admin Costs Pool</div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <div className="px-3 py-1 bg-green-100 rounded">Profit Centers (by headcount)</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
