import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Minus,
  MoreVertical,
  Download,
  Printer,
  UserPlus,
  Tags,
  Edit,
  ExternalLink,
  Send
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { OrgProfile } from '@/types/organizations'
import { useExportOrg } from '@/hooks/use-organizations'
import { useRouter } from 'next/navigation'
import AssignManagerModal from './AssignManagerModal'
import SendEmailModal from './SendEmailModal'
import { toast } from 'sonner'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface OrgHeaderProps {
  organization: OrgProfile
}

export default function OrgHeader({ organization }: OrgHeaderProps) {
  const router = useRouter()
  const [showAssignManager, setShowAssignManager] = useState(false)
  const [showSendEmail, setShowSendEmail] = useState(false)
  const exportMutation = useExportOrg(organization.id)

  const handleExport = (format: 'csv' | 'pdf' | 'zip') => {
    exportMutation.mutate({
      sections: ['overview', 'contacts', 'funding', 'events', 'comms', 'cases'],
      format
    })
  }

  const handlePrint = () => {
    router.push(`/civicflow/organizations/${organization.id}/print`)
  }

  const handleAddTag = () => {
    // TODO: Implement add tag modal
    toast.info('Tag management coming soon')
  }

  const typeColors = {
    funder: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    partner: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    government: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    investee: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    other: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const statusColors = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    prospective: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    archived: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
  }

  const stagePillColors = {
    1: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    3: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    4: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
  }

  const trendIcon =
    organization.engagement?.score_trend === 'up'
      ? TrendingUp
      : organization.engagement?.score_trend === 'down'
        ? TrendingDown
        : Minus

  return (
    <>
      <Card className="p-6">
        <div className="space-y-4">
          {/* Top row: Name, Type, Status, Actions */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Building2 className="h-8 w-8 text-muted-foreground" />
                <h1 className="text-3xl font-bold">{organization.entity_name}</h1>
              </div>
              <p className="text-sm text-muted-foreground">
                {organization.entity_code} {'\u2022'} {organization.smart_code}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={cn('capitalize', typeColors[organization.type || 'other'])}>
                {organization.type || 'Organization'}
              </Badge>
              <Badge className={cn('capitalize', statusColors[organization.status || 'active'])}>
                {organization.status || 'Active'}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setShowAssignManager(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Assign/Change Manager
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleAddTag}>
                    <Tags className="mr-2 h-4 w-4" />
                    Add Tag
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Organization
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setShowSendEmail(true)}>
                    <Send className="mr-2 h-4 w-4" />
                    Send Email
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('csv')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('pdf')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport('zip')}>
                    <Download className="mr-2 h-4 w-4" />
                    Export All (ZIP)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Middle row: Contact info */}
          <div className="flex flex-wrap gap-4 text-sm">
            {organization.website && (
              <a
                href={organization.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-muted-foreground hover:text-primary"
              >
                <Globe className="h-4 w-4" />
                {organization.website}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            {organization.primary_contact?.email && (
              <a
                href={`mailto:${organization.primary_contact.email}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary"
              >
                <Mail className="h-4 w-4" />
                {organization.primary_contact.email}
              </a>
            )}
            {organization.primary_contact?.phone && (
              <a
                href={`tel:${organization.primary_contact.phone}`}
                className="flex items-center gap-1 text-muted-foreground hover:text-primary"
              >
                <Phone className="h-4 w-4" />
                {organization.primary_contact.phone}
              </a>
            )}
            {organization.address && (
              <span className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {organization.address}
              </span>
            )}
          </div>

          {/* Bottom row: Manager, Stage, Score, Tags */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Relationship Manager */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Manager:</span>
              {organization.manager ? (
                <Badge variant="secondary" className="gap-2 px-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={organization.manager.avatar_url} />
                    <AvatarFallback className="text-xs">
                      {organization.manager.user_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')}
                    </AvatarFallback>
                  </Avatar>
                  {organization.manager.user_name}
                </Badge>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowAssignManager(true)}>
                  <UserPlus className="mr-2 h-3 w-3" />
                  Assign Manager
                </Button>
              )}
            </div>

            {/* Engagement Stage */}
            {organization.engagement && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Stage:</span>
                <Badge
                  className={cn(
                    'capitalize',
                    stagePillColors[
                      organization.engagement.stage_ordinal as keyof typeof stagePillColors
                    ]
                  )}
                >
                  {organization.engagement.stage}
                </Badge>
              </div>
            )}

            {/* Engagement Score */}
            {organization.engagement && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Score:</span>
                <div className="flex items-center gap-1">
                  <span className="font-semibold">{organization.engagement.score}</span>
                  {trendIcon === TrendingUp && (
                    <TrendingUp
                      className={cn(
                        'h-4 w-4',
                        organization.engagement.score_trend === 'up'
                          ? 'text-green-600'
                          : organization.engagement.score_trend === 'down'
                            ? 'text-red-600'
                            : 'text-gray-400'
                      )}
                    />
                  )}
                  {trendIcon === TrendingDown && (
                    <TrendingDown
                      className={cn(
                        'h-4 w-4',
                        organization.engagement.score_trend === 'up'
                          ? 'text-green-600'
                          : organization.engagement.score_trend === 'down'
                            ? 'text-red-600'
                            : 'text-gray-400'
                      )}
                    />
                  )}
                  {trendIcon === Minus && (
                    <Minus
                      className={cn(
                        'h-4 w-4',
                        organization.engagement.score_trend === 'up'
                          ? 'text-green-600'
                          : organization.engagement.score_trend === 'down'
                            ? 'text-red-600'
                            : 'text-gray-400'
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {organization.tags && organization.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Tags:</span>
                <div className="flex gap-1 flex-wrap">
                  {organization.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {showAssignManager && (
        <AssignManagerModal
          organizationId={organization.id}
          currentManager={organization.manager}
          onClose={() => setShowAssignManager(false)}
        />
      )}

      {showSendEmail && (
        <SendEmailModal organization={organization} onClose={() => setShowSendEmail(false)} />
      )}
    </>
  )
}
