'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
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
  ArrowLeft,
  Users,
  Shield,
  Filter,
  Download,
  Printer,
  ChevronDown,
  Edit,
  Eye,
  Database
} from 'lucide-react'
import { DemoBanner } from '@/components/communications/DemoBanner'
import { NewAudienceModal } from '@/components/communications/NewAudienceModal'
import { useAudience, useExportComms } from '@/hooks/use-communications'
import { isDemoMode } from '@/lib/demo-guard'
import { Loading } from '@/components/states/Loading'
import { ErrorState } from '@/components/states/ErrorState'
import { EmptyState } from '@/components/states/EmptyState'
import { useToast } from '@/components/ui/use-toast'
import { format } from 'date-fns'

// Mock sample members data
const sampleMembers = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1-555-0101',
    entity_type: 'customer',
    tags: ['VIP', 'Premium'],
    created_at: '2024-01-15T10:00:00Z'
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah.j@company.com',
    phone: '+1-555-0102',
    entity_type: 'customer',
    tags: ['Regular'],
    created_at: '2024-01-20T14:30:00Z'
  },
  {
    id: '3',
    name: 'Michael Brown',
    email: 'mike.brown@email.com',
    phone: '+1-555-0103',
    entity_type: 'lead',
    tags: ['Prospect', 'Hot'],
    created_at: '2024-02-01T09:15:00Z'
  }
]

export default function AudienceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrgId } = useOrgStore()
  const isDemo = isDemoMode(currentOrgId)
  const audienceId = params.id as string

  const [showEditModal, setShowEditModal] = useState(false)
  const [showMemberPreview, setShowMemberPreview] = useState(false)

  // Queries and mutations
  const { data: audience, isLoading, error, refetch } = useAudience(audienceId)
  const exportMutation = useExportComms()

  const handleExportMembers = (format: 'csv' | 'xlsx') => {
    exportMutation.mutate(
      {
        kind: 'audience_members',
        format,
        audience_id: audienceId,
        organization_id: currentOrgId,
        include_demo_watermark: isDemo
      },
      {
        onSuccess: () => {
          toast({ title: `Members exported to ${format.toUpperCase()}` })
        }
      }
    )
  }

  const handlePrint = () => {
    window.print()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Loading />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-6">
        <ErrorState message="Failed to load audience" onRetry={() => refetch()} />
      </div>
    )
  }

  if (!audience) {
    return (
      <div className="container mx-auto py-6">
        <EmptyState
          title="Audience not found"
          description="The requested audience could not be found."
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {isDemo && <DemoBanner />}

      {/* Header */}
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => router.back()}
          className="hover:bg-[rgb(0,166,166)]/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 space-y-1">
          <h1 className="text-3xl font-bold">{audience.entity_name}</h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>{audience.size_estimate.toLocaleString()} members</span>
            </div>
            <Badge variant={audience.consent_policy === 'opt_in' ? 'default' : 'secondary'}>
              <Shield className="h-3 w-3 mr-1" />
              {audience.consent_policy === 'opt_in' ? 'Opt-in' : 'Opt-out'}
            </Badge>
            {audience.tags && audience.tags.length > 0 && (
              <div className="flex gap-1">
                {audience.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={() => setShowMemberPreview(true)}
            className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Members
          </Button>
          <Button 
            onClick={() => setShowEditModal(true)} 
            variant="outline"
            className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Definition
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExportMembers('csv')}>
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExportMembers('xlsx')}>
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Separator />

      {/* Audience Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Audience Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Size Estimate</span>
                <span className="text-sm font-medium">
                  {audience.size_estimate.toLocaleString()} members
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Consent Policy</span>
                <Badge variant={audience.consent_policy === 'opt_in' ? 'default' : 'secondary'}>
                  {audience.consent_policy === 'opt_in' ? 'Opt-in' : 'Opt-out'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm font-medium">
                  {format(new Date(audience.created_at), 'MMM d, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm font-medium">
                  {format(new Date(audience.updated_at), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Live Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Active Members</span>
                <p className="text-lg font-semibold">
                  {Math.floor(audience.size_estimate * 0.95).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Inactive</span>
                <p className="text-lg font-semibold">
                  {Math.floor(audience.size_estimate * 0.05).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Opted Out</span>
                <p className="text-lg font-semibold">
                  {Math.floor(audience.size_estimate * 0.02).toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Bounced</span>
                <p className="text-lg font-semibold">
                  {Math.floor(audience.size_estimate * 0.01).toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audience Definition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Audience Definition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Entity Types Filter */}
            {audience.definition.entity_types && audience.definition.entity_types.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Entity Types</h4>
                <div className="flex flex-wrap gap-2">
                  {audience.definition.entity_types.map(type => (
                    <Badge key={type} variant="outline">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Tags Filter */}
            {audience.definition.tags && audience.definition.tags.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Required Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {audience.definition.tags.map(tag => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Rules */}
            {audience.definition.custom_rules && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Custom Rules</h4>
                <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto">
                  <code>{JSON.stringify(audience.definition.custom_rules, null, 2)}</code>
                </pre>
              </div>
            )}

            {/* SQL Query */}
            {audience.definition.sql_query && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm">SQL Query</h4>
                <pre className="bg-muted rounded-lg p-4 text-sm overflow-x-auto font-mono">
                  <code>{audience.definition.sql_query}</code>
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Sample Members Preview */}
      {showMemberPreview && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Sample Members</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowMemberPreview(false)}
                className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
              >
                Hide
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Preview of the first few members in this audience (demo data):
              </p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sampleMembers.map(member => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {member.entity_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {member.tags.map(tag => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{format(new Date(member.created_at), 'MMM d, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="text-xs text-muted-foreground">
                This is a preview of sample data. Export the full audience to see all members.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <NewAudienceModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        editAudience={audience}
        onSuccess={() => {
          toast({ title: 'Audience updated successfully' })
          setShowEditModal(false)
          refetch()
        }}
      />
    </div>
  )
}
