import { useState, useEffect } from 'react'
import { useAssignManager } from '@/hooks/use-organizations'
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
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, User, Check } from 'lucide-react'
import { toast } from 'sonner'
import type { OrgManager } from '@/types/organizations'

interface AssignManagerModalProps {
  organizationId: string
  currentManager?: OrgManager | null
  onClose: () => void
}

// Mock users for demo
const mockUsers = [
  {
    id: 'usr-1',
    entity_name: 'Sarah Johnson',
    entity_code: 'USR001',
    email: 'sarah.johnson@civicflow.org',
    role: 'Program Director',
    avatar_url: null
  },
  {
    id: 'usr-2',
    entity_name: 'Michael Chen',
    entity_code: 'USR002',
    email: 'michael.chen@civicflow.org',
    role: 'Community Engagement Lead',
    avatar_url: null
  },
  {
    id: 'usr-3',
    entity_name: 'Emily Rodriguez',
    entity_code: 'USR003',
    email: 'emily.rodriguez@civicflow.org',
    role: 'Partnership Manager',
    avatar_url: null
  },
  {
    id: 'usr-4',
    entity_name: 'David Wilson',
    entity_code: 'USR004',
    email: 'david.wilson@civicflow.org',
    role: 'Senior Account Manager',
    avatar_url: null
  },
  {
    id: 'usr-5',
    entity_name: 'Lisa Thompson',
    entity_code: 'USR005',
    email: 'lisa.thompson@civicflow.org',
    role: 'Outreach Coordinator',
    avatar_url: null
  }
]

export default function AssignManagerModal({
  organizationId,
  currentManager,
  onClose
}: AssignManagerModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    currentManager?.user_entity_id || null
  )
  const [filteredUsers, setFilteredUsers] = useState(mockUsers)

  const assignManagerMutation = useAssignManager(organizationId)

  useEffect(() => {
    const filtered = mockUsers.filter(
      user =>
        user.entity_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.role.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchQuery])

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error('Please select a user')
      return
    }

    try {
      await assignManagerMutation.mutateAsync(selectedUserId)
      const selectedUser = mockUsers.find(u => u.id === selectedUserId)
      toast.success(`${selectedUser?.entity_name} assigned as relationship manager`)
      onClose()
    } catch (error) {
      toast.error('Failed to assign manager')
    }
  }

  return (
    <Dialog open onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {currentManager ? 'Change Relationship Manager' : 'Assign Relationship Manager'}
          </DialogTitle>
          <DialogDescription>
            {currentManager
              ? `Current manager: ${currentManager.user_name}. Select a new manager below.`
              : 'Select a team member to manage this organization relationship.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or role..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {filteredUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-accent transition-colors"
                  onClick={() => setSelectedUserId(user.id)}
                >
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback>
                        {user.entity_name
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.entity_name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {user.role}
                      </Badge>
                    </div>
                  </div>
                  {selectedUserId === user.id && <Check className="h-5 w-5 text-primary" />}
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <User className="mx-auto h-12 w-12 mb-3" />
                  <p>No users found matching your search</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || assignManagerMutation.isPending}
          >
            {assignManagerMutation.isPending ? 'Assigning...' : 'Assign Manager'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
