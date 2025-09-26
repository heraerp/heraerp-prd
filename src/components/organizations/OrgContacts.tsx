import { useState } from 'react'
import {
  useOrgContacts,
  useLinkContact,
  useUnlinkContact,
  useSetPrimaryContact
} from '@/hooks/use-organizations'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  User,
  Mail,
  Phone,
  Building2,
  UserPlus,
  UserX,
  Star,
  MoreVertical,
  AlertCircle
} from 'lucide-react'
import { format } from 'date-fns'
import LinkContactModal from './LinkContactModal'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface OrgContactsProps {
  organizationId: string
}

export default function OrgContacts({ organizationId }: OrgContactsProps) {
  const [showLinkContact, setShowLinkContact] = useState(false)
  const { currentOrgId } = useOrgStore()

  const { data, isLoading, error } = useOrgContacts(organizationId)
  const linkContactMutation = useLinkContact(organizationId)
  const unlinkContactMutation = useUnlinkContact(organizationId)
  const setPrimaryMutation = useSetPrimaryContact(organizationId)

  const handleUnlinkContact = async (contactId: string, contactName: string) => {
    try {
      await unlinkContactMutation.mutateAsync(contactId)
      toast.success(`Removed ${contactName} from organization`)
    } catch (error) {
      toast.error('Failed to remove contact')
    }
  }

  const handleSetPrimary = async (contactId: string, contactName: string) => {
    try {
      await setPrimaryMutation.mutateAsync(contactId)
      toast.success(`Set ${contactName} as primary contact`)
    } catch (error) {
      toast.error('Failed to set primary contact')
    }
  }

  if (isLoading) {
    return <ContactsSkeleton />
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Failed to load contacts. Please try again.</AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Linked Contacts ({data?.total || 0})
          </CardTitle>
          <Button onClick={() => setShowLinkContact(true)} size="sm">
            <UserPlus className="mr-2 h-4 w-4" />
            Link Contact
          </Button>
        </CardHeader>
        <CardContent>
          {data?.data && data.data.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map(contact => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={contact.avatar_url} />
                          <AvatarFallback className="text-xs">
                            {contact.constituent_name
                              .split(' ')
                              .map(n => n[0])
                              .join('')
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-1">
                            {contact.constituent_name}
                            {contact.is_primary && (
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {contact.constituent_code}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{contact.role}</Badge>
                    </TableCell>
                    <TableCell>
                      {contact.email ? (
                        <a
                          href={`mailto:${contact.email}`}
                          className="flex items-center gap-1 text-sm hover:text-primary"
                        >
                          <Mail className="h-3 w-3" />
                          {contact.email}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.phone ? (
                        <a
                          href={`tel:${contact.phone}`}
                          className="flex items-center gap-1 text-sm hover:text-primary"
                        >
                          <Phone className="h-3 w-3" />
                          {contact.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {contact.department || <span className="text-muted-foreground">-</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {!contact.is_primary && (
                            <>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleSetPrimary(contact.id, contact.constituent_name)
                                }
                              >
                                <Star className="mr-2 h-4 w-4" />
                                Set as Primary
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                            </>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleUnlinkContact(contact.id, contact.constituent_name)
                            }
                            className="text-red-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Remove from Organization
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <User className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">No contacts linked to this organization</p>
              <Button onClick={() => setShowLinkContact(true)}>
                <UserPlus className="mr-2 h-4 w-4" />
                Link First Contact
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {showLinkContact && (
        <LinkContactModal
          organizationId={organizationId}
          existingContactIds={data?.data.map(c => c.id) || []}
          onClose={() => setShowLinkContact(false)}
        />
      )}
    </>
  )
}

function ContactsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
