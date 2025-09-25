'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreVertical, Play, Pause, Archive, Trash2, Copy, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useToast } from '@/components/ui/use-toast'
import {
  useUpdatePlaybookStatus,
  useDuplicatePlaybook,
  useDeletePlaybook
} from '@/hooks/use-playbooks'
import type { PlaybookStatus } from '@/types/playbooks'

interface PlaybookActionsProps {
  playbookId: string
  status: PlaybookStatus
}

export function PlaybookActions({ playbookId, status }: PlaybookActionsProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const updateStatusMutation = useUpdatePlaybookStatus()
  const duplicateMutation = useDuplicatePlaybook()
  const deleteMutation = useDeletePlaybook()

  const handleStatusChange = async (newStatus: PlaybookStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ id: playbookId, status: newStatus })
      toast({
        title: 'Status Updated',
        description: `Playbook ${newStatus === 'active' ? 'activated' : newStatus === 'archived' ? 'archived' : 'set to draft'}`
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update playbook status',
        variant: 'destructive'
      })
    }
  }

  const handleDuplicate = async () => {
    try {
      const result = await duplicateMutation.mutateAsync(playbookId)
      toast({
        title: 'Playbook Duplicated',
        description: 'A copy of the playbook has been created'
      })
      // Navigate to the new playbook
      router.push(`/civicflow/playbooks/${result.id}`)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to duplicate playbook',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(playbookId)
      toast({
        title: 'Playbook Deleted',
        description: 'The playbook has been permanently deleted'
      })
      setShowDeleteDialog(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete playbook',
        variant: 'destructive'
      })
    }
  }

  const handleEdit = () => {
    router.push(`/civicflow/playbooks/${playbookId}/edit`)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {/* Status Actions */}
          {status === 'draft' && (
            <DropdownMenuItem onClick={() => handleStatusChange('active')}>
              <Play className="mr-2 h-4 w-4" />
              Activate
            </DropdownMenuItem>
          )}
          {status === 'active' && (
            <>
              <DropdownMenuItem onClick={() => handleStatusChange('draft')}>
                <Pause className="mr-2 h-4 w-4" />
                Set to Draft
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleStatusChange('archived')}>
                <Archive className="mr-2 h-4 w-4" />
                Archive
              </DropdownMenuItem>
            </>
          )}
          {status === 'archived' && (
            <DropdownMenuItem onClick={() => handleStatusChange('active')}>
              <Play className="mr-2 h-4 w-4" />
              Reactivate
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {/* General Actions */}
          <DropdownMenuItem onClick={handleEdit}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this playbook and all its associated data. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Playbook'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
