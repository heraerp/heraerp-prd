import { useState, useEffect, useCallback, useMemo } from 'react'
import { Movement, MovementForm } from '@/schemas/inventory'
import { listMovements, postMovement, postAccountingForMovement } from '@/lib/playbook/movements'
import { getStockLevel, upsertDynamicData, getValuationConfig } from '@/lib/playbook/inventory'
import { toast } from 'sonner'
import { debounce } from 'lodash'

interface UseMovementsPlaybookProps {
  organizationId: string
  branchId?: string
  range?: { from?: Date; to?: Date }
  types?: string[]
  page?: number
  pageSize?: number
}

interface ValuationPreview {
  method: 'WAC' | 'FIFO'
  totalCost: number
  unitCosts: Record<string, number>
  impactSummary: string
}

export function useMovementsPlaybook({
  organizationId,
  branchId = 'BRN-001',
  range,
  types,
  page = 1,
  pageSize = 50
}: UseMovementsPlaybookProps) {
  const [movements, setMovements] = useState<Movement[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch movements
  const fetchMovements = useCallback(async () => {
    if (!organizationId) return

    setLoading(true)
    setError(null)

    try {
      const offset = (page - 1) * pageSize
      const result = await listMovements({
        organization_id: organizationId,
        branch_id: branchId,
        from: range?.from,
        to: range?.to,
        types,
        limit: pageSize,
        offset
      })

      setMovements(result.items)
      setTotal(result.total)
    } catch (err) {
      console.error('Failed to fetch movements:', err)
      setError(err instanceof Error ? err.message : 'Failed to load movements')
      toast.error('Failed to load inventory movements')
    } finally {
      setLoading(false)
    }
  }, [organizationId, branchId, range, types, page, pageSize])

  useEffect(() => {
    fetchMovements()
  }, [fetchMovements])

  // Calculate valuation preview
  const calculateValuationPreview = useCallback(
    async (form: MovementForm): Promise<ValuationPreview> => {
      try {
        // Get valuation config
        const config = await getValuationConfig({
          organization_id: organizationId,
          item_ids: form.lines.map(l => l.item_id)
        })

        let totalCost = 0
        const unitCosts: Record<string, number> = {}

        // For receipts and adjustments, use provided costs
        if (form.type === 'RECEIPT' || form.type === 'ADJUST') {
          form.lines.forEach(line => {
            unitCosts[line.item_id] = line.unit_cost || 0
            totalCost += line.qty * (line.unit_cost || 0)
          })
        } else {
          // For issues and transfers, calculate based on valuation method
          for (const line of form.lines) {
            const itemConfig = config.item_overrides?.[line.item_id] || config.method

            if (itemConfig === 'WAC') {
              // Get average cost from dynamic data
              const avgCostKey = `${line.item_id}:HERA.INVENTORY.COST.AVG.V1`
              // In real implementation, fetch from dynamic data
              unitCosts[line.item_id] = 45 // Mock average cost
              totalCost += line.qty * unitCosts[line.item_id]
            } else {
              // FIFO - would consume layers
              unitCosts[line.item_id] = 42 // Mock FIFO cost
              totalCost += line.qty * unitCosts[line.item_id]
            }
          }
        }

        // Generate impact summary
        let impactSummary = ''
        switch (form.type) {
          case 'RECEIPT':
            impactSummary = `Increase inventory value by AED ${totalCost.toFixed(2)}`
            break
          case 'ISSUE':
            impactSummary = `Record COGS of AED ${totalCost.toFixed(2)}`
            break
          case 'TRANSFER':
            impactSummary = `Transfer AED ${totalCost.toFixed(2)} between branches`
            break
          case 'ADJUST':
            impactSummary =
              totalCost > 0
                ? `Increase inventory by AED ${totalCost.toFixed(2)} (variance income)`
                : `Decrease inventory by AED ${Math.abs(totalCost).toFixed(2)} (variance expense)`
            break
        }

        return {
          method: config.method,
          totalCost,
          unitCosts,
          impactSummary
        }
      } catch (err) {
        console.error('Failed to calculate valuation:', err)
        throw err
      }
    },
    [organizationId]
  )

  // Create movement
  const createMovement = useCallback(
    async (form: MovementForm) => {
      try {
        // Calculate valuation
        const valuation = await calculateValuationPreview(form)

        // Build movement header
        const header = {
          organization_id: organizationId,
          smart_code: `HERA.INVENTORY.MOVE.${form.type}.V1`,
          when_ts: form.when_ts.toISOString(),
          branch_id: form.branch_id,
          status: 'posted' as const,
          metadata: {
            type: form.type,
            reference: form.reference,
            posted_by: 'current-user', // Would get from auth
            posted_at: new Date().toISOString()
          },
          from_entity_id: form.from_branch_id,
          to_entity_id: form.to_branch_id
        }

        // Build lines with calculated costs
        const lines = form.lines.map((line, index) => ({
          line_no: index + 1,
          smart_code: 'HERA.INVENTORY.LINE.ITEM.V1',
          entity_id: line.item_id,
          qty: form.type === 'ISSUE' ? -line.qty : line.qty,
          uom: 'unit', // Would get from item
          unit_cost: line.unit_cost || valuation.unitCosts[line.item_id] || 0,
          amount:
            line.qty *
            (line.unit_cost || valuation.unitCosts[line.item_id] || 0) *
            (form.type === 'ISSUE' ? -1 : 1),
          metadata: {
            item_name: line.item_name,
            note: line.note,
            from_branch_id: form.from_branch_id,
            to_branch_id: form.to_branch_id
          }
        }))

        // Post movement
        const movement = await postMovement(header, lines)

        // Post accounting
        await postAccountingForMovement(movement)

        // Update stock levels and costs
        for (const line of form.lines) {
          // Update stock level
          const stockLevel = await getStockLevel({
            organization_id: organizationId,
            branch_id: form.branch_id,
            item_ids: [line.item_id]
          })

          const currentStock = stockLevel[line.item_id]?.on_hand || 0
          const newStock = form.type === 'ISSUE' ? currentStock - line.qty : currentStock + line.qty

          await upsertDynamicData(line.item_id, 'HERA.INVENTORY.STOCKLEVEL.V1', {
            item_id: line.item_id,
            branch_id: form.branch_id,
            on_hand: newStock,
            available: newStock, // Simplified - would calculate based on allocations
            allocated: 0,
            last_movement: movement.id,
            last_updated: new Date().toISOString()
          })

          // Update WAC if applicable
          if (valuation.method === 'WAC' && form.type === 'RECEIPT') {
            // Simplified WAC calculation
            const avgCost = valuation.unitCosts[line.item_id] || 0
            await upsertDynamicData(line.item_id, 'HERA.INVENTORY.COST.AVG.V1', {
              qty_on_hand: newStock,
              total_cost: newStock * avgCost,
              avg_cost: avgCost,
              last_updated: new Date().toISOString()
            })
          }
        }

        toast.success(`${form.type} movement posted successfully`)

        // Refresh list
        fetchMovements()

        return movement
      } catch (err) {
        console.error('Failed to create movement:', err)
        const message = err instanceof Error ? err.message : 'Failed to create movement'
        toast.error(message)
        throw err
      }
    },
    [organizationId, fetchMovements, calculateValuationPreview]
  )

  // Export movements
  const exportCSV = useCallback(() => {
    const headers = ['Date', 'Type', 'Reference', 'Items', 'Total Qty', 'Total Value', 'Status']
    const rows = movements.map(movement => {
      const totalQty = movement.lines?.reduce((sum, line) => sum + Math.abs(line.qty), 0) || 0
      return [
        new Date(movement.when_ts).toLocaleDateString(),
        movement.metadata?.type || '',
        movement.metadata?.reference || movement.transaction_code,
        movement.lines?.length || 0,
        totalQty.toString(),
        movement.total_amount.toFixed(2),
        movement.status
      ]
    })

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `movements-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast.success('Movements exported')
  }, [movements])

  return {
    movements,
    total,
    loading,
    error,
    createMovement,
    calculateValuationPreview,
    exportCSV,
    refresh: fetchMovements
  }
}
