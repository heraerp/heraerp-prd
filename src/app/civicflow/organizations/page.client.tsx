'use client'
import { useState } from 'react'
import { useOrganizationList, useCreateOrganization } from '@/hooks/use-organizations'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EngagementStageBadge } from '@/components/civicflow/EngagementStageBadge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Plus, Search, Filter, Mail, Phone, Calendar, User } from 'lucide-react'
import Link from 'next/link'
import type { EngagementStage, OrgType } from '@/types/organizations'

export default function Client() {
  const { currentOrgId } = useOrgStore()
  const [q, setQ] = useState('')
  const [type, setType] = useState<string>('all')
  const [stage, setStage] = useState<string>('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  // Form state for new org
  const [newOrgName, setNewOrgName] = useState('')
  const [newOrgType, setNewOrgType] = useState<OrgType>('Partner')
  const [newOrgStage, setNewOrgStage] = useState<EngagementStage>('Exploration')

  const {
    data: organizations,
    isLoading,
    error
  } = useOrganizationList({
    q,
    type: type === 'all' ? undefined : type,
    stage: stage === 'all' ? undefined : stage,
    limit: 50,
    orgId: currentOrgId || undefined
  })

  const createOrg = useCreateOrganization()

  const handleCreateOrg = async () => {
    if (!newOrgName || !currentOrgId) return

    await createOrg.mutateAsync({
      entity_type: 'organization',
      entity_name: newOrgName,
      organization_id: currentOrgId,
      smart_code: 'HERA.CRM.ORGS.ENTITY.ORGANIZATION.v1',
      metadata: {
        type: newOrgType,
        engagement_stage: newOrgStage
      }
    })

    setIsCreateOpen(false)
    setNewOrgName('')
    setNewOrgType('Partner')
    setNewOrgStage('Exploration')
  }

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <p className="text-destructive">Failed to load organizations. Please try again.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-100">Organizations</h1>
          <p className="text-text-300 mt-1">
            Manage partners, funders, investees, and government entities
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-accent hover:bg-accent/90">
              <Plus className="h-4 w-4 mr-2" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Add a new partner, funder, investee, or government organization.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={newOrgName}
                  onChange={e => setNewOrgName(e.target.value)}
                  placeholder="Enter organization name"
                />
              </div>
              <div>
                <Label htmlFor="org-type">Type</Label>
                <Select value={newOrgType} onValueChange={v => setNewOrgType(v as OrgType)}>
                  <SelectTrigger id="org-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Partner">Partner</SelectItem>
                    <SelectItem value="Funder">Funder</SelectItem>
                    <SelectItem value="Investee">Investee</SelectItem>
                    <SelectItem value="Government">Government</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="org-stage">Engagement Stage</Label>
                <Select
                  value={newOrgStage}
                  onValueChange={v => setNewOrgStage(v as EngagementStage)}
                >
                  <SelectTrigger id="org-stage">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Exploration">Exploration</SelectItem>
                    <SelectItem value="Co-design">Co-design</SelectItem>
                    <SelectItem value="Approval">Approval</SelectItem>
                    <SelectItem value="Deployment">Deployment</SelectItem>
                    <SelectItem value="Monitoring">Monitoring</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrg} disabled={!newOrgName || createOrg.isPending}>
                {createOrg.isPending ? 'Creating...' : 'Create Organization'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card className="bg-panel border-border">
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-500" />
                <Input
                  className="pl-9 bg-panel-alt border-border"
                  placeholder="Search organizations..."
                  value={q}
                  onChange={e => setQ(e.target.value)}
                />
              </div>
            </div>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-[150px] bg-panel-alt border-border">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
                <SelectItem value="Funder">Funder</SelectItem>
                <SelectItem value="Investee">Investee</SelectItem>
                <SelectItem value="Government">Government</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="w-[150px] bg-panel-alt border-border">
                <SelectValue placeholder="All stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All stages</SelectItem>
                <SelectItem value="Exploration">Exploration</SelectItem>
                <SelectItem value="Co-design">Co-design</SelectItem>
                <SelectItem value="Approval">Approval</SelectItem>
                <SelectItem value="Deployment">Deployment</SelectItem>
                <SelectItem value="Monitoring">Monitoring</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Organizations List */}
      {organizations && organizations.length > 0 ? (
        <div className="grid gap-4">
          {organizations.map(org => (
            <Card
              key={org.id}
              className="bg-panel border-border hover:bg-panel-alt transition-colors"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-accent" />
                      </div>
                      <div>
                        <Link
                          href={`/civicflow/organizations/${org.id}`}
                          className="text-lg font-semibold text-text-100 hover:text-accent transition-colors"
                        >
                          {org.name}
                        </Link>
                        <div className="flex items-center gap-3 mt-1">
                          {org.data?.type && (
                            <Badge variant="outline" className="text-xs">
                              {org.data.type}
                            </Badge>
                          )}
                          {org.data?.engagement_stage && (
                            <EngagementStageBadge stage={org.data.engagement_stage} />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Organization Details */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-text-500">
                        <User className="h-3.5 w-3.5" />
                        <span>RM: {org.data?.relationship_manager_user_id || 'Unassigned'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-500">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Last contact: N/A</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-500">
                        <Mail className="h-3.5 w-3.5" />
                        <span>0 emails</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-500">
                        <Phone className="h-3.5 w-3.5" />
                        <span>0 calls</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/civicflow/organizations/${org.id}`}>View Details</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-panel border-border">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-text-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-100 mb-2">No organizations found</h3>
            <p className="text-text-300 mb-6">
              {q || type || stage
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first organization.'}
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Organization
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
