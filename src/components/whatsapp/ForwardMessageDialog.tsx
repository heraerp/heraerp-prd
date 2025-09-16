'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { ScrollArea } from '@/src/components/ui/scroll-area'
import { Avatar, AvatarFallback, AvatarImage } from '@/src/components/ui/avatar'
import { Badge } from '@/src/components/ui/badge'
import { Checkbox } from '@/src/components/ui/checkbox'
import { Search, Forward, Users, Clock } from 'lucide-react'

interface Contact {
  id: string
  name: string
  phone: string
  lastSeen?: string
  avatar?: string
  isGroup?: boolean
}

interface ForwardMessageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  messageToForward?: {
    id: string
    text: string
    media?: any
  }
  onForward: (contactIds: string[]) => Promise<void>
}

export function ForwardMessageDialog({
  open,
  onOpenChange,
  messageToForward,
  onForward
}: ForwardMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(false)
  const [forwarding, setForwarding] = useState(false)

  // Fetch contacts/conversations
  useEffect(() => {
    if (open) {
      fetchContacts()
    }
  }, [open])

  const fetchContacts = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/v1/whatsapp/conversations')
      const result = await response.json()

      if (result.status === 'success') {
        // Transform conversations to contacts format
        const contactsList = result.conversations.map((conv: any) => ({
          id: conv.id,
          name: conv.entity_name,
          phone: conv.metadata.phone,
          lastSeen: conv.metadata.last_activity,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${conv.entity_name}`
        }))
        setContacts(contactsList)
      }
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredContacts = contacts.filter(
    contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone.includes(searchQuery)
  )

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev =>
      prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]
    )
  }

  const handleForward = async () => {
    if (selectedContacts.length === 0 || !messageToForward) return

    try {
      setForwarding(true)
      await onForward(selectedContacts)
      onOpenChange(false)
      setSelectedContacts([])
    } catch (error) {
      console.error('Error forwarding message:', error)
    } finally {
      setForwarding(false)
    }
  }

  // Recent contacts section (mock data)
  const recentContacts = contacts.slice(0, 5)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Forward Message</DialogTitle>
          <DialogDescription>Select contacts to forward this message to</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Selected contacts count */}
          {selectedContacts.length > 0 && (
            <div className="flex items-center justify-between px-2">
              <span className="text-sm text-muted-foreground dark:text-muted-foreground">
                {selectedContacts.length} selected
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedContacts([])}>
                Clear all
              </Button>
            </div>
          )}

          {/* Contacts list */}
          <ScrollArea className="h-80">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading contacts...</p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Recent section */}
                {!searchQuery && recentContacts.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>Recent</span>
                    </div>
                    {recentContacts.map(contact => (
                      <ContactItem
                        key={contact.id}
                        contact={contact}
                        isSelected={selectedContacts.includes(contact.id)}
                        onToggle={() => handleContactToggle(contact.id)}
                      />
                    ))}
                    <div className="my-2 border-b" />
                  </>
                )}

                {/* All contacts */}
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                  <Users className="w-3 h-3" />
                  <span>All Contacts</span>
                </div>
                {filteredContacts.map(contact => (
                  <ContactItem
                    key={contact.id}
                    contact={contact}
                    isSelected={selectedContacts.includes(contact.id)}
                    onToggle={() => handleContactToggle(contact.id)}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={forwarding}>
            Cancel
          </Button>
          <Button onClick={handleForward} disabled={selectedContacts.length === 0 || forwarding}>
            <Forward className="w-4 h-4 mr-2" />
            Forward to {selectedContacts.length || 0}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ContactItem({
  contact,
  isSelected,
  onToggle
}: {
  contact: Contact
  isSelected: boolean
  onToggle: () => void
}) {
  return (
    <div
      className="flex items-center gap-3 px-2 py-2 hover:bg-muted dark:hover:bg-muted rounded cursor-pointer"
      onClick={onToggle}
    >
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggle}
        onClick={e => e.stopPropagation()}
      />

      <Avatar className="w-10 h-10">
        <AvatarImage src={contact.avatar} />
        <AvatarFallback>
          {contact.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm">{contact.name}</p>
          {contact.isGroup && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              Group
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{contact.phone}</p>
      </div>
    </div>
  )
}
