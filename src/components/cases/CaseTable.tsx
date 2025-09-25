/**
 * Case Table Component
 * Displays cases in a tabular format with sorting
 */

import React from 'react'
import { format } from 'date-fns'
import { ChevronUp, ChevronDown, MoreHorizontal, FileText, AlertTriangle } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import type { CaseTableProps, CaseStatus, CasePriority, CaseRag } from '@/types/cases'
import { useRouter } from 'next/navigation'

const statusColors: Record<CaseStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-gray-100 text-gray-800',
  breach: 'bg-red-100 text-red-800',
  closed: 'bg-slate-100 text-slate-800'
}

const priorityDots: Record<CasePriority, string> = {
  low: 'bg-blue-500',
  medium: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500'
}

const ragColors: Record<CaseRag, string> = {
  R: 'bg-red-500',
  A: 'bg-amber-500',
  G: 'bg-green-500'
}

export function CaseTable({ cases, onAction, onSort, loading }: CaseTableProps) {
  const router = useRouter()

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  const handleSort = (field: string) => {
    if (onSort) {
      onSort(field, 'asc') // TODO: Implement toggle between asc/desc
    }
  }

  const SortableHeader = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <button
      className="flex items-center gap-1 font-medium hover:text-foreground"
      onClick={() => handleSort(field)}
    >
      {children}
      <div className="flex flex-col">
        <ChevronUp className="h-3 w-3 text-muted-foreground" />
        <ChevronDown className="h-3 w-3 text-muted-foreground -mt-1" />
      </div>
    </button>
  )

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]"></TableHead>
            <TableHead>
              <SortableHeader field="entity_name">Title</SortableHeader>
            </TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Program</TableHead>
            <TableHead>
              <SortableHeader field="due_date">Due Date</SortableHeader>
            </TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>
              <SortableHeader field="updated_at">Updated</SortableHeader>
            </TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map(caseItem => {
            const isOverdue = caseItem.due_date && new Date(caseItem.due_date) < new Date()

            return (
              <TableRow
                key={caseItem.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => router.push(`/civicflow/cases/${caseItem.id}`)}
              >
                <TableCell>
                  <div className="flex items-center gap-1">
                    <div
                      className={`h-2 w-2 rounded-full ${priorityDots[caseItem.priority]}`}
                      title={`Priority: ${caseItem.priority}`}
                    />
                    {caseItem.rag && (
                      <div
                        className={`h-2 w-2 rounded-full ${ragColors[caseItem.rag]}`}
                        title={`RAG: ${caseItem.rag}`}
                      />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium max-w-[300px]">
                  <div className="truncate" title={caseItem.entity_name}>
                    {caseItem.entity_name}
                  </div>
                  {caseItem.tags && caseItem.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {caseItem.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {caseItem.tags.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{caseItem.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[caseItem.status]}>
                    {caseItem.status.replace('_', ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {/* TODO: Add subject info when available */}-
                </TableCell>
                <TableCell>{caseItem.program_name || '-'}</TableCell>
                <TableCell className={isOverdue ? 'text-red-600' : ''}>
                  {caseItem.due_date ? format(new Date(caseItem.due_date), 'MMM d, yyyy') : '-'}
                </TableCell>
                <TableCell>{caseItem.owner || '-'}</TableCell>
                <TableCell className="text-muted-foreground">
                  {format(new Date(caseItem.updated_at), 'MMM d, h:mm a')}
                </TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {caseItem.status !== 'closed' && (
                        <>
                          <DropdownMenuItem onClick={() => onAction?.(caseItem.id, 'vary')}>
                            <FileText className="mr-2 h-4 w-4" />
                            Request Variation
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onAction?.(caseItem.id, 'breach')}>
                            <AlertTriangle className="mr-2 h-4 w-4" />
                            Record Breach
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => onAction?.(caseItem.id, 'close')}>
                            Close Case
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
