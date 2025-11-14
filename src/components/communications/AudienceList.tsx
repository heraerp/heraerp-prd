'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Search,
  MoreHorizontal,
  Eye,
  Copy,
  Edit,
  Trash,
  Download,
  Users,
  Shield,
  Filter
} from 'lucide-react'
import { useAudienceList } from '@/hooks/use-communications'
import { Audience } from '@/types/communications'

export function AudienceList() {
  const router = useRouter()
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    entity_type: [],
    consent_policy: null
  })

  const { data, isLoading } = useAudienceList({
    q: searchQuery,
    ...filters
  })

  const handleSelectAll = (checked: boolean) => {
    if (checked && data?.items) {
      setSelectedAudiences(data.items.map(a => a.id))
    } else {
      setSelectedAudiences([])
    }
  }

  const handleSelectAudience = (audienceId: string, checked: boolean) => {
    if (checked) {
      setSelectedAudiences([...selectedAudiences, audienceId])
    } else {
      setSelectedAudiences(selectedAudiences.filter(id => id !== audienceId))
    }
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search audiences..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Entity type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="constituent">Constituents</SelectItem>
            <SelectItem value="organization">Organizations</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
        <Select>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Consent policy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All policies</SelectItem>
            <SelectItem value="opt_in">Opt-in</SelectItem>
            <SelectItem value="opt_out">Opt-out</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk Actions */}
      {selectedAudiences.length > 0 && (
        <div className="bg-muted/50 p-3 rounded-lg flex items-center justify-between">
          <span className="text-sm">
            {selectedAudiences.length} audience{selectedAudiences.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Members
            </Button>
            <Button size="sm" variant="outline" className="text-destructive">
              <Trash className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Audience Table */}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    selectedAudiences.length === data?.items?.length && data?.items?.length > 0
                  }
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Audience</TableHead>
              <TableHead>Definition</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Consent</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.items?.map((audience: Audience) => (
              <TableRow key={audience.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedAudiences.includes(audience.id)}
                    onCheckedChange={checked =>
                      handleSelectAudience(audience.id, checked as boolean)
                    }
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{audience.entity_name}</p>
                    <p className="text-sm text-muted-foreground">{audience.entity_code}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm">
                      {Object.keys(audience.definition).length} criteria
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{audience.size_estimate.toLocaleString()}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Shield className="h-4 w-4" />
                    <Badge variant={audience.consent_policy === 'opt_in' ? 'default' : 'secondary'}>
                      {audience.consent_policy === 'opt_in' ? 'Opt-in' : 'Opt-out'}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell>{format(new Date(audience.created_at), 'MMM d, yyyy')}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={() =>
                          router.push(`/civicflow/communications/audiences/${audience.id}`)
                        }
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Audience
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Copy className="h-4 w-4 mr-2" />
                        Clone Audience
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="h-4 w-4 mr-2" />
                        Export Members
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash className="h-4 w-4 mr-2" />
                        Delete Audience
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
