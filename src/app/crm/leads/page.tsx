'use client'

import { useEffect, useState } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-states'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Search, Mail, Phone, Building2, Star, TrendingUp } from 'lucide-react'
import { universalApi } from '@/lib/universal-api'

export default function CRMLeadsPage() {
  const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
  const [leads, setLeads] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newLead, setNewLead] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    lead_source: '',
    lead_score: 0
  })

  useEffect(() => {
    if (currentOrganization && isAuthenticated) {
      loadLeads()
    }
  }, [currentOrganization, isAuthenticated])

  const loadLeads = async () => {
    if (!currentOrganization?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      universalApi.setOrganizationId(currentOrganization.id)
      
      // Load leads with dynamic data
      const response = await fetch(`/api/v1/crm/entities?organization_id=${currentOrganization.id}&entity_type=lead&include_dynamic_data=true`)
      const data = await response.json()
      
      if (data.success) {
        setLeads(data.data || [])
      } else {
        throw new Error(data.message || 'Failed to load leads')
      }
      
    } catch (error: any) {
      console.error('Error loading leads:', error)
      setError(error.message || 'Failed to load leads')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateLead = async () => {
    if (!currentOrganization?.id) return
    
    try {
      const response = await fetch('/api/v1/crm/entities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          organization_id: currentOrganization.id,
          entity_type: 'lead',
          entity_name: newLead.company_name,
          entity_code: `LEAD-${Date.now()}`,
          smart_code: 'HERA.CRM.LEAD.CREATE.v1',
          dynamic_fields: {
            contact_name: newLead.contact_name,
            email: newLead.email,
            phone: newLead.phone,
            lead_source: newLead.lead_source,
            lead_score: newLead.lead_score,
            status: 'new'
          }
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setIsCreateDialogOpen(false)
        setNewLead({
          company_name: '',
          contact_name: '',
          email: '',
          phone: '',
          lead_source: '',
          lead_score: 0
        })
        await loadLeads()
      } else {
        throw new Error(data.message || 'Failed to create lead')
      }
      
    } catch (error: any) {
      console.error('Error creating lead:', error)
      alert(error.message || 'Failed to create lead')
    }
  }

  const getLeadStatusBadge = (status: string) => {
    const statusColors = {
      new: 'bg-blue-100 text-blue-800',
      contacted: 'bg-yellow-100 text-yellow-800',
      qualified: 'bg-green-100 text-green-800',
      unqualified: 'bg-gray-100 text-gray-800',
      converted: 'bg-purple-100 text-purple-800'
    }
    
    return (
      <Badge className={statusColors[status as keyof typeof statusColors] || statusColors.new}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getLeadScore = (score: number) => {
    if (score >= 80) return <Star className="w-4 h-4 text-yellow-500 fill-current" />
    if (score >= 60) return <Star className="w-4 h-4 text-yellow-500" />
    return <Star className="w-4 h-4 text-gray-300" />
  }

  const filteredLeads = leads.filter(lead => 
    lead.entity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.dynamic_fields?.contact_name?.value?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lead.dynamic_fields?.email?.value?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isAuthenticated || !currentOrganization) {
    return (
      <Alert className="m-8">
        <AlertDescription>Please log in and select an organization to continue.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Leads Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage and track your sales leads</p>
      </div>

      {/* Actions Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search leads..."
              className="pl-10 pr-4 w-80"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              New Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Lead</DialogTitle>
              <DialogDescription>
                Add a new lead to your sales pipeline
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  value={newLead.company_name}
                  onChange={(e) => setNewLead({ ...newLead, company_name: e.target.value })}
                  placeholder="Acme Corp"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="contact">Contact Name</Label>
                <Input
                  id="contact"
                  value={newLead.contact_name}
                  onChange={(e) => setNewLead({ ...newLead, contact_name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  placeholder="john.doe@acme.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source">Lead Source</Label>
                <Select
                  value={newLead.lead_source}
                  onValueChange={(value) => setNewLead({ ...newLead, lead_source: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateLead} className="bg-blue-600 hover:bg-blue-700">
                Create Lead
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Leads Table */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500">
                      {searchQuery ? 'No leads found matching your search' : 'No leads yet. Create your first lead!'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLeads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-gray-400" />
                          <span>{lead.entity_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{lead.dynamic_fields?.contact_name?.value || '-'}</TableCell>
                      <TableCell>
                        {lead.dynamic_fields?.email?.value && (
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <span>{lead.dynamic_fields.email.value}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {lead.dynamic_fields?.phone?.value && (
                          <div className="flex items-center space-x-1">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span>{lead.dynamic_fields.phone.value}</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{lead.dynamic_fields?.lead_source?.value || '-'}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          {getLeadScore(lead.dynamic_fields?.lead_score?.value || 0)}
                          <span className="text-sm text-gray-600">
                            {lead.dynamic_fields?.lead_score?.value || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getLeadStatusBadge(lead.dynamic_fields?.status?.value || 'new')}
                      </TableCell>
                      <TableCell className="text-gray-600">
                        {new Date(lead.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}