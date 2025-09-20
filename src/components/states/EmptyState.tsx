import { FileText, ArrowLeft, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  title?: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({
  title = 'No items found',
  description = 'There are no items to display.',
  icon,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="mb-4 p-3 bg-muted rounded-full">
          {icon || <FileText className="h-8 w-8 text-muted-foreground" />}
        </div>

        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-6">{description}</p>

        {action}
      </div>
    </div>
  )
}

export function PlaybooksEmptyState() {
  return (
    <EmptyState
      title="No playbooks found"
      description="There are no playbooks available in this organization. Playbooks help automate business processes and workflows."
      icon={<FileText className="h-8 w-8 text-muted-foreground" />}
      action={
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      }
    />
  )
}

export function PlaybookNotFoundState({ id }: { id: string }) {
  return (
    <EmptyState
      title="Playbook not found"
      description={`The playbook with ID "${id}" could not be found. It may have been removed or you may not have permission to view it.`}
      icon={<FileText className="h-8 w-8 text-muted-foreground" />}
      action={
        <div className="flex gap-3">
          <Button asChild variant="outline">
            <Link href="/playbooks">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Playbooks
            </Link>
          </Button>
        </div>
      }
    />
  )
}
