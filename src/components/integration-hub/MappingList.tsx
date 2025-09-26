'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  GitBranch,
  Plus,
  Search,
  MoreVertical,
  Edit,
  TestTube,
  Trash2,
  Copy,
  FileJson,
  Shuffle
} from 'lucide-react'
import { useMappings, useTestMapping } from '@/hooks/integration-hub/useMappings'
import { useConnectors } from '@/hooks/integration-hub/useConnectors'
import { formatDistanceToNow } from 'date-fns'
import { NewMappingModal } from './modals/NewMappingModal'
import type { DataMapping } from '@/types/integration-hub'

interface MappingListProps {
  organizationId: string
}

export function MappingList({ organizationId }: MappingListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewModal, setShowNewModal] = useState(false)
  const [selectedMapping, setSelectedMapping] = useState<DataMapping | null>(null)
  const [showTestModal, setShowTestModal] = useState(false)
  
  const { data: mappings, isLoading } = useMappings(organizationId)
  const { data: connectors } = useConnectors(organizationId)
  const { mutate: testMapping, isPending: isTesting } = useTestMapping()

  const filteredMappings = mappings?.filter(mapping =>
    mapping.entity_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getConnectorName = (connectorId: string) => {
    const connector = connectors?.find(c => c.id === connectorId)
    return connector?.entity_name || 'Unknown Connector'
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-96 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Data Mappings</h1>
          <p className="text-muted-foreground">
            Configure field transformations between systems
          </p>
        </div>
        <Button onClick={() => setShowNewModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Mapping
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search mappings..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Mappings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Configured Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mapping Name</TableHead>
                <TableHead>Connector</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Transforms</TableHead>
                <TableHead>Created</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMappings?.map(mapping => (
                <TableRow key={mapping.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{mapping.entity_name}</div>
                        <div className="text-xs text-muted-foreground">
                          {mapping.entity_code}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getConnectorName(mapping.connector_id)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {mapping.source_schema?.resource || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileJson className="h-4 w-4 text-muted-foreground" />
                      <span>{mapping.field_mappings?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Shuffle className="h-4 w-4 text-muted-foreground" />
                      <span>{mapping.transform_operations?.length || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(mapping.created_at), { 
                        addSuffix: true 
                      })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          setSelectedMapping(mapping)
                          setShowTestModal(true)
                        }}>
                          <TestTube className="h-4 w-4 mr-2" />
                          Test Mapping
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Empty State */}
              {filteredMappings?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No mappings found</h3>
                    <p className="text-muted-foreground mb-4">
                      {searchQuery 
                        ? "Try adjusting your search query"
                        : "Create your first data mapping to transform fields between systems"
                      }
                    </p>
                    {!searchQuery && (
                      <Button onClick={() => setShowNewModal(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Mapping
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* New Mapping Modal */}
      <NewMappingModal
        open={showNewModal}
        onClose={() => setShowNewModal(false)}
        organizationId={organizationId}
        connectors={connectors || []}
      />
    </div>
  )
}