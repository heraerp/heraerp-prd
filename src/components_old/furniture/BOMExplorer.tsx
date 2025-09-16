'use client'

import React, { useState, useEffect }
from 'react'
import { ChevronRight, ChevronDown, Package, Layers, Factory, AlertCircle }
from 'lucide-react'
import { cn }
from '@/lib/utils'
import { universalApi }
from '@/lib/universal-api'
import { Card, CardContent, CardHeader, CardTitle }
from '@/components/ui/card'
import { Badge }
from '@/components/ui/badge'
import { Button }
from '@/components/ui/button'
import { Skeleton }
from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger }
from '@/components/ui/tooltip'


interface BOMComponent {
  id: string
  name: string
  code: string
  type: string
  quantity: number
  unit: string
  scrapPercentage?: number
  unitCost?: number
  totalCost?: number
  leadTime?: number
  supplier?: string
  children?: BOMComponent[]
}

interface BOMExplorerProps {
  productId: string
  organizationId: string
  className?: string
}

export function BOMExplorer({ productId, organizationId, className }: BOMExplorerProps) {
  const [loading, setLoading] = useState(true)

const [error, setError] = useState<string | null>(null)

const [bomData, setBomData] = useState<BOMComponent | null>(null)

const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set()) useEffect(() => { loadBOMData(  ), [productId, organizationId])

const loadBOMData = async () => { try { setLoading(true) setError(null) // Get product details const { data: products } = await universalApi.read({ table: 'core_entities', organizationId })

const product = products?.find((p: any) => p.id === productId) if (!product) throw new Error('Product not found') // Get BOM relationships const { data: relationships } = await universalApi.read({ table: 'core_relationships', organizationId }) // Find BOM for this product const productBomRel = relationships?.find( (r: any) => r.from_entity_id === productId && r.relationship_type === 'has_bom' ) if (!productBomRel) {
  setBomData({ id: product.id, name: product.entity_name, code: product.entity_code, type: 'product', quantity: 1, unit: 'EA', children: [] }) return } // Get BOM entity const bom = products?.find((e: any) => e.id === productBomRel.to_entity_id) if (!bom) throw new Error('BOM not found') // Get BOM components const bomComponentRels = relationships?.filter( (r: any) => r.from_entity_id === bom.id && r.relationship_type === 'includes_component' ) || [] // Build component tree const components: BOMComponent[] = [] for (const rel of bomComponentRels) {
  const component = products?.find((e: any) => e.id === rel.to_entity_id) if (component) { // Get supplier info const supplierRel = relationships?.find( (r: any) => r.to_entity_id === component.id && r.relationship_type === 'sources' )

const supplier = supplierRel ? products?.find((e: any) => e.id === supplierRel.from_entity_id) : null components.push({ id: component.id, name: component.entity_name, code: component.entity_code, type: component.entity_type, quantity: rel.relationship_data?.quantity || 1, unit: rel.relationship_data?.unit_of_measure || 'EA', scrapPercentage: rel.relationship_data?.scrap_percentage, unitCost: rel.relationship_data?.unit_price, leadTime: supplierRel?.relationship_data?.lead_time_days, supplier: supplier?.entity_name, children: [] // Could recursively load sub-components }  ) } setBomData({ id: product.id, name: product.entity_name, code: product.entity_code, type: 'product', quantity: 1, unit: 'EA', totalCost: components.reduce( (sum, c) => sum + c.quantity * (c.unitCost || 0) * (1 + (c.scrapPercentage || 0) / 100), 0 ), children: components })   } catch (err) {
  console.error('Error loading BOM data:', err) setError(err instanceof Error ? err.message : 'Failed to load BOM data')   } finally {
    setLoading(false)
  }
}

const toggleNode = (nodeId: string) => { setExpandedNodes(prev => { const newSet = new Set(prev) if (newSet.has(nodeId)) {
  newSet.delete(nodeId  ) else { newSet.add(nodeId  ) return newSet }  )

const renderBOMNode = (node: BOMComponent, level: number = 0) => { const isExpanded = expandedNodes.has(node.id)

const hasChildren = node.children && node.children.length > 0 const indentClass = `pl-${Math.min(level * 4, 16)}` return ( <div key={node.id} className="bg-[var(--color-body)] border-l-2 border-[var(--color-border)]/50 ml-2"> <div className={cn( 'flex items-center gap-3 p-3 hover:bg-[var(--color-body)]/50 rounded-lg transition-colors cursor-pointer', indentClass )} onClick={() => hasChildren && toggleNode(node.id)} > {hasChildren && ( <Button variant="ghost" size="icon" className="h-5 w-5 hover:bg-[var(--color-hover)]"> {isExpanded ? ( <ChevronDown className="h-4 w-4" /> ) : ( <ChevronRight className="h-4 w-4" /> )} </Button> )} {!hasChildren && <div className="bg-[var(--color-body)] w-5" />} <div className="flex items-center gap-2 flex-1"> {node.type === 'product' && <Package className="h-5 w-5 text-[#37353E]" />} {node.type === 'bom' && <Layers className="h-5 w-5 text-[#37353E]" />} {node.type === 'material' && <Factory className="h-5 w-5 text-green-500" />} <div className="bg-[var(--color-body)] flex-1"> <div className="flex items-center gap-2"> <span className="font-medium text-[var(--color-text-primary)]">{node.name}</span> <Badge variant="outline" className="bg-[var(--color-body)] text-xs"> {node.code} </Badge> </div> <div className="flex items-center gap-4 text-sm text-[var(--color-text-secondary)] mt-1"> <span> {node.quantity} {node.unit} </span> {node.scrapPercentage && ( <TooltipProvider> <Tooltip> <TooltipTrigger> <span className="flex items-center gap-1"> <AlertCircle className="h-3 w-3" /> {node.scrapPercentage}% scrap </span> </TooltipTrigger> <TooltipContent> <p>Material includes {node.scrapPercentage}% scrap allowance</p> </TooltipContent> </Tooltip> </TooltipProvider> )} {node.unitCost && ( <span> ₹{node.unitCost.toLocaleString()}/{node.unit} </span> )} {node.leadTime && <span>{node.leadTime} days lead time</span>} {node.supplier && ( <Badge variant="secondary" className="bg-[var(--color-body)] text-xs"> {node.supplier} </Badge> )} </div> </div> {node.totalCost && level === 0 && ( <div className="text-right"> <div className="text-sm text-[var(--color-text-secondary)]">Total Cost</div> <div className="font-semibold text-[var(--color-text-primary)]"> ₹{node.totalCost.toLocaleString()} </div> </div> )} </div> </div> {isExpanded && hasChildren && ( <div className="ml-4">{node.children!.map(child => renderBOMNode(child, level + 1))}</div> )} </div>   ) if (loading) {
  return ( <Card className={cn('bg-[var(--color-body)]/50 border-[var(--color-border)]', className)}> <CardHeader> <CardTitle className="flex items-center gap-2"> <Layers className="h-5 w-5" /> Bill of Materials </CardTitle> </CardHeader> <CardContent> <div className="space-y-3"> <Skeleton className="h-12 w-full" /> <Skeleton className="h-12 w-3/4 ml-8" /> <Skeleton className="h-12 w-1/2 ml-16" /> </div> </CardContent> </Card>   )
}

if (error) {
  return ( <Card className={cn('bg-[var(--color-body)]/50 border-[var(--color-border)]', className)}> <CardHeader> <CardTitle className="flex items-center gap-2"> <Layers className="h-5 w-5" /> Bill of Materials </CardTitle> </CardHeader> <CardContent> <div className="text-center py-8"> <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" /> <p className="text-[var(--color-text-secondary)]">{error}</p> <Button onClick={loadBOMData} className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] mt-4"> Retry </Button> </div> </CardContent> </Card>   ) if (!bomData) {
  return ( <Card className={cn('bg-[var(--color-body)]/50 border-[var(--color-border)]', className)}> <CardHeader> <CardTitle className="flex items-center gap-2"> <Layers className="h-5 w-5" /> Bill of Materials </CardTitle> </CardHeader> <CardContent> <p className="text-center text-[var(--color-text-secondary)] py-8">No BOM data available</p> </CardContent> </Card>   ) return ( <Card className={cn('bg-[var(--color-body)]/50 border-[var(--color-border)]', className)}> <CardHeader> <CardTitle className="flex items-center gap-2"> <Layers className="h-5 w-5" /> Bill of Materials </CardTitle> </CardHeader> <CardContent> {renderBOMNode(bomData)} {bomData.children && bomData.children.length > 0 && ( <div className="mt-6 pt-4 border-t border-[var(--color-border)]"> <div className="flex justify-between items-center text-sm"> <span className="text-[var(--color-text-secondary)]">Total Components</span> <span className="font-semibold">{bomData.children.length}</span> </div> {bomData.totalCost && ( <div className="flex justify-between items-center text-sm mt-2"> <span className="text-[var(--color-text-secondary)]">Total Material Cost</span> <span className="font-semibold text-[var(--color-text-primary)]"> ₹{bomData.totalCost.toLocaleString()} </span> </div> )} </div> )} </CardContent> </Card> )
}
