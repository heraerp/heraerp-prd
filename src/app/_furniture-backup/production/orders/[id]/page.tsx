'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Calendar,
  Package,
  User,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Truck
} from 'lucide-react'
import { useDemoOrganization } from '@/lib/dna/patterns/demo-org-pattern'
import {
  useUniversalData,
  universalFilters
} from '@/lib/dna/patterns/universal-api-loading-pattern'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'

export default function ProductionOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { organizationId, orgLoading } = useDemoOrganization()
  const [activeTab, setActiveTab] = useState('details')

  // Load the specific production order
  const { data: productionOrders } = useUniversalData({
    table: 'universal_transactions',
    filter: item =>
      item.id === id &&
      item.transaction_type === 'production_order' &&
      item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  const order = productionOrders?.[0]

  // Load entities for customer and product names
  const { data: entities } = useUniversalData({
    table: 'core_entities',
    filter: item => item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  // Load transaction lines for order items
  const { data: transactionLines } = useUniversalData({
    table: 'universal_transaction_lines',
    filter: item => item.transaction_id === id && item.organization_id === organizationId,
    organizationId,
    enabled: !!organizationId
  })

  const getEntityName = (entityId: string) => {
    const entity = entities?.find(e => e.id === entityId)
    return entity?.entity_name || 'Unknown'
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-800 dark:text-yellow-200',
        icon: Clock
      },
      in_progress: {
        bg: 'bg-[var(--color-body)] dark:bg-[var(--color-body)]/30',
        text: 'text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]',
        icon: Package
      },
      completed: {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: 'text-green-800 dark:text-green-200',
        icon: CheckCircle
      },
      cancelled: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-800 dark:text-red-200',
        icon: AlertCircle
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending
    const Icon = config.icon

    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}
      >
        <Icon className="h-4 w-4" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: {
        bg: 'bg-[var(--color-body)] bg-[var(--color-body)]/30',
        text: 'text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]'
      },
      normal: {
        bg: 'bg-[var(--color-body)] dark:bg-[var(--color-body)]/30',
        text: 'text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)]'
      },
      high: {
        bg: 'bg-orange-100 dark:bg-orange-900/30',
        text: 'text-orange-800 dark:text-orange-200'
      },
      urgent: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-200' }
    }

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.normal

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </span>
    )
  }

  if (orgLoading || !order) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--color-body)]">
        <div className="bg-[var(--color-body)] animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent-indigo)]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="bg-[var(--color-body)] flex items-center space-x-4">
          <Link
            href="/furniture/production/orders"
            className="p-2 hover:bg-[var(--color-body)] dark:hover:bg-[var(--color-body)] rounded-md transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]" />
          </Link>
          <div>
            <div className="bg-[var(--color-body)] flex items-center gap-3">
              <h1 className="bg-[var(--color-body)] text-2xl font-bold text-[var(--color-text-primary)] text-[var(--color-text-primary)]">
                {order.transaction_code}
              </h1>
              {getStatusBadge(order.metadata?.status || 'pending')}
              {getPriorityBadge(order.metadata?.priority || 'normal')}
            </div>
            <p className="text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
              Created on {format(new Date(order.created_at), 'MMM dd, yyyy')}
            </p>
          </div>
        </div>
        <div className="bg-[var(--color-body)] flex items-center space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-[var(--color-border)] border-[var(--color-border)] text-sm font-medium rounded-md text-[var(--color-text-primary)] dark:text-[var(--color-text-primary)] bg-[var(--color-body)] bg-muted-foreground/10 hover:bg-[var(--color-body)] dark:hover:bg-[var(--color-body)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-indigo)]">
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-[var(--color-text-primary)] bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-teal)] hover:from-[var(--color-accent-indigo)] hover:to-[var(--color-accent-teal)] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--color-accent-indigo)]">
            Update Status
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="text-center p-8">
        <p className="text-[var(--color-text-secondary)]">
          Production order details interface is being loaded...
        </p>
      </div>
    </div>
  )
}
