'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Merge,
  Split,
  Plus,
  Minus,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle,
  X,
  ArrowRight,
  Link2,
  Unlink,
  RotateCcw,
  Save,
  Eye,
  Settings
} from 'lucide-react'

interface Table {
  id: string
  table_number: string
  capacity: number
  location: string
  status: string
  x_position: number
  y_position: number
  width: number
  height: number
  is_combinable?: boolean
  combined_with?: string[]
  is_master?: boolean
  combination_id?: string
  combination_name?: string
}

interface TableCombination {
  id: string
  name: string
  table_ids: string[]
  total_capacity: number
  status: 'active' | 'inactive'
  created_at: string
  master_table_id: string
}

interface TableCombinationProps {
  tables: Table[]
  onTablesUpdate: () => void
}

export function TableCombination({ tables, onTablesUpdate }: TableCombinationProps) {
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [combinations, setCombinations] = useState<TableCombination[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSplitDialogOpen, setIsSplitDialogOpen] = useState(false)
  const [selectedCombination, setSelectedCombination] = useState<TableCombination | null>(null)
  const [combinationName, setCombinationName] = useState('')
  const [masterTableId, setMasterTableId] = useState('')

  // Load existing combinations
  const loadCombinations = async () => {
    try {
      const response = await fetch('/api/v1/restaurant/table-combinations')
      const result = await response.json()

      if (result.success) {
        setCombinations(result.data || [])
      } else {
        console.error('Failed to load combinations:', result.message)
      }
    } catch (error) {
      console.error('Error loading combinations:', error)
    }
  }

  useEffect(() => {
    loadCombinations()
  }, [])

  // Get combinable tables (available and can be combined)
  const combinableTables = tables.filter(
    table => table.is_combinable && table.status === 'available' && !table.combination_id
  )

  // Get combined table groups
  const combinedGroups = combinations
    .filter(combo => combo.status === 'active')
    .map(combo => {
      const tablesInCombo = tables.filter(table => combo.table_ids.includes(table.id))
      return {
        ...combo,
        tables: tablesInCombo
      }
    })

  // Create table combination
  const createCombination = async () => {
    if (selectedTables.length < 2) {
      toast.error('Select at least 2 tables to combine')
      return
    }

    if (!combinationName.trim()) {
      toast.error('Please enter a combination name')
      return
    }

    if (!masterTableId) {
      toast.error('Please select a master table')
      return
    }

    try {
      const selectedTableData = tables.filter(t => selectedTables.includes(t.id))
      const totalCapacity = selectedTableData.reduce((sum, table) => sum + table.capacity, 0)

      const response = await fetch('/api/v1/restaurant/table-combinations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: combinationName,
          table_ids: selectedTables,
          master_table_id: masterTableId,
          total_capacity: totalCapacity
        })
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Tables combined successfully')
        setIsCreateDialogOpen(false)
        resetForm()
        loadCombinations()
        onTablesUpdate()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to combine tables')
    }
  }

  // Split table combination
  const splitCombination = async (combinationId: string) => {
    if (!confirm('Are you sure you want to split this table combination?')) return

    try {
      const response = await fetch(`/api/v1/restaurant/table-combinations/${combinationId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Tables split successfully')
        setIsSplitDialogOpen(false)
        setSelectedCombination(null)
        loadCombinations()
        onTablesUpdate()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to split tables')
    }
  }

  // Toggle table selection
  const toggleTableSelection = (tableId: string) => {
    setSelectedTables(prev =>
      prev.includes(tableId) ? prev.filter(id => id !== tableId) : [...prev, tableId]
    )
  }

  // Reset form
  const resetForm = () => {
    setSelectedTables([])
    setCombinationName('')
    setMasterTableId('')
  }

  // Check if tables are adjacent (simplified logic)
  const areTablesAdjacent = (tableIds: string[]) => {
    if (tableIds.length < 2) return true

    const selectedTableData = tables.filter(t => tableIds.includes(t.id))
    const adjacencyThreshold = 100 // pixels

    for (let i = 0; i < selectedTableData.length; i++) {
      let hasAdjacent = false
      for (let j = 0; j < selectedTableData.length; j++) {
        if (i === j) continue

        const dx = Math.abs(selectedTableData[i].x_position - selectedTableData[j].x_position)
        const dy = Math.abs(selectedTableData[i].y_position - selectedTableData[j].y_position)
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance <= adjacencyThreshold) {
          hasAdjacent = true
          break
        }
      }
      if (!hasAdjacent) return false
    }
    return true
  }

  const canCombineSelected = () => {
    return (
      selectedTables.length >= 2 &&
      areTablesAdjacent(selectedTables) &&
      selectedTables.every(id => {
        const table = tables.find(t => t.id === id)
        return table && table.status === 'available' && table.is_combinable
      })
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-100 flex items-center">
              <Link2 className="w-5 h-5 mr-2" />
              Table Combination & Splitting
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Combine adjacent tables for large parties or split existing combinations
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Merge className="w-4 h-4 mr-2" />
                  Combine Tables
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Combine Tables</DialogTitle>
                  <DialogDescription>
                    Select tables to combine into a larger seating arrangement
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="combination_name">Combination Name</Label>
                    <Input
                      id="combination_name"
                      value={combinationName}
                      onChange={e => setCombinationName(e.target.value)}
                      placeholder="e.g., Large Party Section, Wedding Tables"
                    />
                  </div>

                  <div>
                    <Label>Select Tables to Combine</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-48 overflow-y-auto">
                      {combinableTables.map(table => (
                        <div
                          key={table.id}
                          onClick={() => toggleTableSelection(table.id)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedTables.includes(table.id)
                              ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200'
                              : 'border-border hover:border-border'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Table {table.table_number}</span>
                            <Badge variant="outline">{table.capacity} seats</Badge>
                          </div>
                          <div className="flex items-center space-x-1 text-xs text-muted-foreground mt-1">
                            <MapPin className="w-3 h-3" />
                            <span>{table.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedTables.length >= 2 && (
                    <div>
                      <Label htmlFor="master_table">Master Table (Main Service Point)</Label>
                      <select
                        id="master_table"
                        value={masterTableId}
                        onChange={e => setMasterTableId(e.target.value)}
                        className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mt-1"
                      >
                        <option value="">Select master table</option>
                        {selectedTables.map(tableId => {
                          const table = tables.find(t => t.id === tableId)
                          return table ? (
                            <option key={tableId} value={tableId}>
                              Table {table.table_number} ({table.capacity} seats)
                            </option>
                          ) : null
                        })}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Orders and service will be managed from this table
                      </p>
                    </div>
                  )}

                  {selectedTables.length > 0 && (
                    <div className="p-3 bg-muted rounded-lg">
                      <h4 className="text-sm font-medium text-gray-100 mb-2">
                        Combination Summary
                      </h4>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>Tables: {selectedTables.length}</div>
                        <div>
                          Total Capacity:{' '}
                          {tables
                            .filter(t => selectedTables.includes(t.id))
                            .reduce((sum, table) => sum + table.capacity, 0)}{' '}
                          seats
                        </div>
                        <div className="flex items-center space-x-2">
                          {areTablesAdjacent(selectedTables) ? (
                            <>
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-green-600">Tables are adjacent</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="w-4 h-4 text-orange-500" />
                              <span className="text-orange-600">Tables may not be adjacent</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={createCombination}
                    disabled={!canCombineSelected() || !combinationName.trim() || !masterTableId}
                  >
                    <Merge className="w-4 h-4 mr-2" />
                    Combine Tables
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </Card>

      {/* Current Combinations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Combinations */}
        <Card className="p-6">
          <h4 className="text-base font-semibold text-gray-100 mb-4 flex items-center">
            <Link2 className="w-5 h-5 mr-2" />
            Active Combinations ({combinedGroups.length})
          </h4>

          {combinedGroups.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Merge className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No active table combinations</p>
              <p className="text-sm">Combine tables to accommodate larger parties</p>
            </div>
          ) : (
            <div className="space-y-4">
              {combinedGroups.map(combo => (
                <div key={combo.id} className="p-4 border border-border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-medium text-gray-100">{combo.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        {combo.tables.length} tables • {combo.total_capacity} total seats
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => splitCombination(combo.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Split className="w-4 h-4 mr-2" />
                      Split
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {combo.tables.map(table => (
                      <Badge
                        key={table.id}
                        className={`${
                          table.id === combo.master_table_id
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-muted text-gray-200'
                        }`}
                      >
                        {table.id === combo.master_table_id && '★ '}
                        Table {table.table_number}
                        {table.id === combo.master_table_id && ' (Master)'}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{combo.total_capacity} seats</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{combo.tables[0]?.location}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(combo.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Available Tables for Combination */}
        <Card className="p-6">
          <h4 className="text-base font-semibold text-gray-100 mb-4 flex items-center">
            <Plus className="w-5 h-5 mr-2" />
            Available for Combination ({combinableTables.length})
          </h4>

          {combinableTables.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No tables available for combination</p>
              <p className="text-sm">Tables must be available and combinable</p>
            </div>
          ) : (
            <div className="space-y-3">
              {combinableTables.map(table => (
                <div
                  key={table.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    selectedTables.includes(table.id)
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-border hover:border-border'
                  }`}
                  onClick={() => toggleTableSelection(table.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">Table {table.table_number}</span>
                      <div className="flex items-center space-x-3 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3" />
                          <span>{table.capacity}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MapPin className="w-3 h-3" />
                          <span>{table.location}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {selectedTables.includes(table.id) && (
                        <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
                      )}
                      <Badge className="bg-green-100 text-green-800">Available</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Combination Rules & Tips */}
      <Card className="p-6">
        <h4 className="text-base font-semibold text-gray-100 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          Combination Rules & Best Practices
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h5 className="text-sm font-medium text-gray-100 mb-2">Requirements</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Tables must be available (not occupied or reserved)</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Tables must be marked as combinable</span>
              </li>
              <li className="flex items-start space-x-2">
                <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
                <span>Minimum 2 tables required for combination</span>
              </li>
              <li className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5" />
                <span>Tables should be physically adjacent when possible</span>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-sm font-medium text-gray-100 mb-2">Best Practices</h5>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start space-x-2">
                <Eye className="w-4 h-4 text-blue-500 mt-0.5" />
                <span>Choose a central table as the master for easier service</span>
              </li>
              <li className="flex items-start space-x-2">
                <Users className="w-4 h-4 text-blue-500 mt-0.5" />
                <span>Consider total capacity vs actual party size</span>
              </li>
              <li className="flex items-start space-x-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                <span>Combine tables in the same location/section</span>
              </li>
              <li className="flex items-start space-x-2">
                <RotateCcw className="w-4 h-4 text-blue-500 mt-0.5" />
                <span>Split combinations promptly after use</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
