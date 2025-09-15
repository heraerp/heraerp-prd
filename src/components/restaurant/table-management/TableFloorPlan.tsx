'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import {
  Plus,
  Save,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw,
  Square,
  Circle,
  Trash2,
  Copy,
  Palette,
  Grid,
  Maximize2,
  Download,
  Upload,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Layers,
  Users,
  Clock,
  DollarSign,
  AlertCircle,
  Settings,
  ChevronDown
} from 'lucide-react'

interface Table {
  id: string
  table_number: string
  capacity: number
  location: string
  status: string
  shape: 'square' | 'rectangle' | 'round' | 'oval'
  x_position: number
  y_position: number
  width: number
  height: number
  rotation: number
  features?: string[]
  pricing_tier?: string
  current_party_size?: number
  server_name?: string
  seated_at?: string
  next_reservation_time?: string
}

interface TableFloorPlanProps {
  tables: Table[]
  onTableSelect: (table: Table | null) => void
  onTablesUpdate: () => void
}

export function TableFloorPlan({ tables, onTableSelect, onTablesUpdate }: TableFloorPlanProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [selectedTable, setSelectedTable] = useState<Table | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [showGrid, setShowGrid] = useState(true)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [gridSize] = useState(20)
  const [mode, setMode] = useState<'select' | 'add' | 'delete'>('select')
  const [newTableShape, setNewTableShape] = useState<'square' | 'rectangle' | 'round' | 'oval'>(
    'square'
  )
  const [history, setHistory] = useState<Table[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [showLabels, setShowLabels] = useState(true)
  const [showOccupancy, setShowOccupancy] = useState(true)

  // Initialize canvas
  useEffect(() => {
    drawFloorPlan()
  }, [tables, selectedTable, zoom, panOffset, showGrid, showLabels, showOccupancy])

  // Draw floor plan
  const drawFloorPlan = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Save context state
    ctx.save()

    // Apply zoom and pan
    ctx.translate(panOffset.x, panOffset.y)
    ctx.scale(zoom, zoom)

    // Draw grid
    if (showGrid) {
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 0.5

      for (let x = 0; x < canvas.width / zoom; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height / zoom)
        ctx.stroke()
      }

      for (let y = 0; y < canvas.height / zoom; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width / zoom, y)
        ctx.stroke()
      }
    }

    // Draw tables
    tables.forEach(table => {
      ctx.save()

      // Position and rotation
      ctx.translate(table.x_position + table.width / 2, table.y_position + table.height / 2)
      ctx.rotate((table.rotation * Math.PI) / 180)
      ctx.translate(-table.width / 2, -table.height / 2)

      // Table color based on status
      let fillColor = '#10b981' // available - green
      let strokeColor = '#059669'

      switch (table.status) {
        case 'occupied':
          fillColor = '#ef4444' // red
          strokeColor = '#dc2626'
          break
        case 'reserved':
          fillColor = '#f59e0b' // yellow
          strokeColor = '#d97706'
          break
        case 'cleaning':
          fillColor = '#3b82f6' // blue
          strokeColor = '#2563eb'
          break
        case 'maintenance':
          fillColor = '#6b7280' // gray
          strokeColor = '#4b5563'
          break
      }

      // Draw table shape
      ctx.fillStyle = fillColor
      ctx.strokeStyle = strokeColor
      ctx.lineWidth = selectedTable?.id === table.id ? 3 : 2

      if (table.shape === 'round' || table.shape === 'oval') {
        ctx.beginPath()
        if (table.shape === 'round') {
          ctx.arc(
            table.width / 2,
            table.height / 2,
            Math.min(table.width, table.height) / 2,
            0,
            2 * Math.PI
          )
        } else {
          ctx.ellipse(
            table.width / 2,
            table.height / 2,
            table.width / 2,
            table.height / 2,
            0,
            0,
            2 * Math.PI
          )
        }
        ctx.fill()
        ctx.stroke()
      } else {
        ctx.fillRect(0, 0, table.width, table.height)
        ctx.strokeRect(0, 0, table.width, table.height)
      }

      // Draw table number and info
      if (showLabels) {
        ctx.fillStyle = 'white'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(table.table_number, table.width / 2, table.height / 2 - 10)

        if (showOccupancy && table.status === 'occupied') {
          ctx.font = '12px Arial'
          ctx.fillText(
            `${table.current_party_size}/${table.capacity}`,
            table.width / 2,
            table.height / 2 + 10
          )
        }
      }

      // Draw server name
      if (table.server_name && showLabels) {
        ctx.fillStyle = 'white'
        ctx.font = '10px Arial'
        ctx.fillText(table.server_name, table.width / 2, table.height / 2 + 25)
      }

      ctx.restore()
    })

    // Restore context state
    ctx.restore()
  }

  // Handle mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (e.clientX - rect.left - panOffset.x) / zoom
    const y = (e.clientY - rect.top - panOffset.y) / zoom

    if (mode === 'select') {
      // Check if clicking on a table
      const clickedTable = tables.find(table => {
        const centerX = table.x_position + table.width / 2
        const centerY = table.y_position + table.height / 2
        const dx = x - centerX
        const dy = y - centerY

        // Rotate point back
        const angle = (-table.rotation * Math.PI) / 180
        const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle)
        const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle)

        // Check if inside table bounds
        return Math.abs(rotatedX) <= table.width / 2 && Math.abs(rotatedY) <= table.height / 2
      })

      if (clickedTable) {
        setSelectedTable(clickedTable)
        onTableSelect(clickedTable)
        setIsDragging(true)
        setDragOffset({
          x: x - clickedTable.x_position,
          y: y - clickedTable.y_position
        })
      } else {
        // Start panning
        setIsPanning(true)
        setDragOffset({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y })
      }
    } else if (mode === 'add') {
      // Add new table
      const newTable: Partial<Table> = {
        table_number: `T${tables.length + 1}`,
        capacity: 4,
        location: 'indoor',
        status: 'available',
        shape: newTableShape,
        x_position: snapToGrid ? Math.round(x / gridSize) * gridSize : x,
        y_position: snapToGrid ? Math.round(y / gridSize) * gridSize : y,
        width: newTableShape === 'rectangle' ? 80 : 60,
        height: newTableShape === 'rectangle' ? 60 : 60,
        rotation: 0
      }

      addTable(newTable)
    } else if (mode === 'delete') {
      // Delete table
      const clickedTable = tables.find(table => {
        const centerX = table.x_position + table.width / 2
        const centerY = table.y_position + table.height / 2
        const dx = x - centerX
        const dy = y - centerY

        const angle = (-table.rotation * Math.PI) / 180
        const rotatedX = dx * Math.cos(angle) - dy * Math.sin(angle)
        const rotatedY = dx * Math.sin(angle) + dy * Math.cos(angle)

        return Math.abs(rotatedX) <= table.width / 2 && Math.abs(rotatedY) <= table.height / 2
      })

      if (clickedTable) {
        deleteTable(clickedTable.id)
      }
    }
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    if (isDragging && selectedTable) {
      const rect = canvas.getBoundingClientRect()
      let x = (e.clientX - rect.left - panOffset.x) / zoom - dragOffset.x
      let y = (e.clientY - rect.top - panOffset.y) / zoom - dragOffset.y

      // Snap to grid
      if (snapToGrid) {
        x = Math.round(x / gridSize) * gridSize
        y = Math.round(y / gridSize) * gridSize
      }

      updateTablePosition(selectedTable.id, x, y)
    } else if (isPanning) {
      setPanOffset({
        x: e.clientX - dragOffset.x,
        y: e.clientY - dragOffset.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setIsPanning(false)
  }

  // Table operations
  const addTable = async (tableData: Partial<Table>) => {
    try {
      const response = await fetch('/api/v1/restaurant/table-management', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tableData)
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Table added successfully')
        onTablesUpdate()
        addToHistory()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to add table')
    }
  }

  const updateTablePosition = async (tableId: string, x: number, y: number) => {
    try {
      const response = await fetch(`/api/v1/restaurant/table-management/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ x_position: x, y_position: y })
      })

      const result = await response.json()
      if (result.success) {
        onTablesUpdate()
      }
    } catch (error) {
      console.error('Failed to update table position')
    }
  }

  const deleteTable = async (tableId: string) => {
    if (!confirm('Are you sure you want to delete this table?')) return

    try {
      const response = await fetch(`/api/v1/restaurant/table-management/${tableId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      if (result.success) {
        toast.success('Table deleted successfully')
        onTablesUpdate()
        addToHistory()
      } else {
        throw new Error(result.message)
      }
    } catch (error) {
      toast.error('Failed to delete table')
    }
  }

  const rotateTable = async (tableId: string, rotation: number) => {
    try {
      const response = await fetch(`/api/v1/restaurant/table-management/${tableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rotation })
      })

      const result = await response.json()
      if (result.success) {
        onTablesUpdate()
        addToHistory()
      }
    } catch (error) {
      console.error('Failed to rotate table')
    }
  }

  // History management
  const addToHistory = () => {
    const newHistory = [...history.slice(0, historyIndex + 1), [...tables]]
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      // Restore tables from history
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      // Restore tables from history
    }
  }

  return (
    <Card className="p-6">
      {/* Toolbar */}
      <div className="mb-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button
              variant={mode === 'select' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('select')}
            >
              <Move className="w-4 h-4 mr-2" />
              Select
            </Button>
            <Button
              variant={mode === 'add' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('add')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Table
            </Button>
            <Button
              variant={mode === 'delete' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('delete')}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>

            {mode === 'add' && (
              <div className="flex items-center space-x-2 ml-4">
                <span className="text-sm text-muted-foreground">Shape:</span>
                <Button
                  variant={newTableShape === 'square' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewTableShape('square')}
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  variant={newTableShape === 'rectangle' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewTableShape('rectangle')}
                >
                  <Square className="w-4 h-4" style={{ transform: 'scaleX(1.5)' }} />
                </Button>
                <Button
                  variant={newTableShape === 'round' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewTableShape('round')}
                >
                  <Circle className="w-4 h-4" />
                </Button>
                <Button
                  variant={newTableShape === 'oval' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setNewTableShape('oval')}
                >
                  <Circle className="w-4 h-4" style={{ transform: 'scaleX(1.5)' }} />
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-2" />

            <Button variant="outline" size="sm" onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={() => setZoom(Math.min(2, zoom + 0.1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-2" />

            <Button
              variant={showGrid ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={snapToGrid ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSnapToGrid(!snapToGrid)}
            >
              {snapToGrid ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
            </Button>
            <Button
              variant={showLabels ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowLabels(!showLabels)}
            >
              {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>

            <div className="h-6 w-px bg-gray-300 mx-2" />

            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Import
            </Button>
          </div>
        </div>

        {/* Selected table controls */}
        {selectedTable && mode === 'select' && (
          <div className="flex items-center space-x-4 p-4 bg-muted rounded-lg">
            <span className="text-sm font-medium">Table {selectedTable.table_number}</span>
            <Badge
              className={
                selectedTable.status === 'available'
                  ? 'bg-green-100 text-green-800'
                  : selectedTable.status === 'occupied'
                    ? 'bg-red-100 text-red-800'
                    : selectedTable.status === 'reserved'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-muted text-gray-800'
              }
            >
              {selectedTable.status}
            </Badge>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => rotateTable(selectedTable.id, (selectedTable.rotation + 45) % 360)}
              >
                <RotateCw className="w-4 h-4 mr-2" />
                Rotate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newTable = {
                    ...selectedTable,
                    id: `${selectedTable.id}_copy`,
                    table_number: `${selectedTable.table_number}_copy`
                  }
                  addTable(newTable)
                }}
              >
                <Copy className="w-4 h-4 mr-2" />
                Duplicate
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative bg-background rounded-lg overflow-hidden"
        style={{ height: '600px' }}
      >
        <canvas
          ref={canvasRef}
          width={1200}
          height={600}
          className="cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        />

        {/* Legend */}
        <div className="absolute bottom-4 left-4 bg-background p-3 rounded-lg shadow-lg border border-border">
          <h4 className="text-sm font-semibold mb-2">Legend</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Occupied</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-yellow-500 rounded"></div>
              <span>Reserved</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>Cleaning</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-500 rounded"></div>
              <span>Maintenance</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}
