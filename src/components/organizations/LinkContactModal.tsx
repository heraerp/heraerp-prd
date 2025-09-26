import { useState, useEffect } from 'react'
import { useLinkContact } from '@/hooks/use-organizations'
import { useOrgStore } from '@/state/org'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Search, User, Check, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface LinkContactModalProps {
  organizationId: string
  existingContactIds: string[]
  onClose: () => void
}

// Mock constituents for demo
const mockConstituents = [
  {
    id: 'con-1',
    entity_name: 'Alex Thompson',
    entity_code: 'CON001',
    email: 'alex.thompson@example.com',
    phone: '+1 (555) 123-4567',
    type: 'individual'
  },
  {
    id: 'con-2',
    entity_name: 'Maria Garcia',
    entity_code: 'CON002',
    email: 'maria.garcia@example.com',
    phone: '+1 (555) 234-5678',
    type: 'individual'
  },
  {
    id: 'con-3',
    entity_name: 'James Wilson',
    entity_code: 'CON003',
    email: 'james.wilson@example.com',
    phone: '+1 (555) 345-6789',
    type: 'individual'
  },
  {
    id: 'con-4',
    entity_name: 'Priya Patel',
    entity_code: 'CON004',
    email: 'priya.patel@example.com',
    phone: '+1 (555) 456-7890',
    type: 'individual'
  },
  {
    id: 'con-5',
    entity_name: 'Robert Kim',
    entity_code: 'CON005',
    email: 'robert.kim@example.com',
    phone: '+1 (555) 567-8901',
    type: 'individual'
  }
]

const roleOptions = [
  'CEO',
  'Executive Director',
  'Program Director',
  'Board Member',
  'Finance Manager',
  'Operations Manager',
  'Communications Lead',
  'Project Manager',
  'Volunteer Coordinator',
  'Development Officer',
  'Administrative Assistant',
  'Other'
]

export default function LinkContactModal({
  organizationId,
  existingContactIds,
  onClose
}: LinkContactModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<string>('')
  const [department, setDepartment] = useState<string>('')
  const [filteredConstituents, setFilteredConstituents] = useState(
    mockConstituents.filter(c => !existingContactIds.includes(c.id))
  )

  const linkContactMutation = useLinkContact(organizationId)

  useEffect(() => {
    const availableConstituents = mockConstituents.filter(c => !existingContactIds.includes(c.id))
    const filtered = availableConstituents.filter(
      constituent =>
        constituent.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        constituent.entity_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        constituent.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredConstituents(filtered)
  }, [searchQuery, existingContactIds])

  const handleLink = async () => {
    if (!selectedContactId) {
      toast.error('Please select a contact')
      return
    }
    if (!selectedRole) {
      toast.error('Please select a role')
      return
    }

    try {
      await linkContactMutation.mutateAsync({
        constituent_id: selectedContactId,
        role: selectedRole,
        department: department || undefined
      })
      const selectedContact = mockConstituents.find(c => c.id === selectedContactId)
      toast.success(`${selectedContact?.entity_name} linked to organization`)
      onClose()
    } catch (error) {
      toast.error('Failed to link contact')
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Link Contact to Organization</DialogTitle>
          <DialogDescription>
            Select a constituent and define their role in the organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="search">Search Contacts</Label>
            <div className="relative mt-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Search by name, code, or email..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label>Select Contact</Label>
            <ScrollArea className="h-[200px] mt-2 border rounded-md p-2">
              <div className="space-y-2">
                {filteredConstituents.map(constituent => (
                  <div
                    key={constituent.id}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                    onClick={() => setSelectedContactId(constituent.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {constituent.entity_name
                            .split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{constituent.entity_name}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{constituent.entity_code}</span>
                          <span>{'\u2022'}</span>
                          <span>{constituent.email}</span>
                        </div>
                      </div>
                    </div>
                    {selectedContactId === constituent.id && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
                {filteredConstituents.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <User className="mx-auto h-12 w-12 mb-3" />
                    <p>No available contacts found</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => {
                        // TODO: Navigate to create new constituent
                        toast.info('Create new constituent feature coming soon')
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create New
                    </Button>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {selectedContactId && (
            <>
              <div className="space-y-2">
                <Label htmlFor="role">Role in Organization*</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(role => (
                      <SelectItem key={role} value={role}>
                        {role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department (Optional)</Label>
                <Input
                  id="department"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  placeholder="e.g. Finance, Operations, Programs"
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleLink}
            disabled={!selectedContactId || !selectedRole || linkContactMutation.isPending}
          >
            {linkContactMutation.isPending ? 'Linking...' : 'Link Contact'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
