'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { User, Clock, Coffee, Power } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

// Lazy initialization to handle build-time issues
let supabase: ReturnType<typeof createClient> | null = null

function getSupabase() {
  if (!supabase && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  }
  return supabase
}

interface StaffMember {
  id: string
  name: string
  role: string
  status: string
  statusCode: string
  statusColor: string
  currentClient?: string
  statusChangedAt?: string
}

const STATUS_CONFIG = {
  'STATUS-STAFF-AVAILABLE': {
    label: 'Available',
    color: 'bg-green-500',
    textColor: 'text-green-700',
    icon: User,
    variant: 'default' as const
  },
  'STATUS-STAFF-BUSY': {
    label: 'Busy',
    color: 'bg-orange-500',
    textColor: 'text-orange-700',
    icon: Clock,
    variant: 'secondary' as const
  },
  'STATUS-STAFF-BREAK': {
    label: 'On Break',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-700',
    icon: Coffee,
    variant: 'outline' as const
  },
  'STATUS-STAFF-OFF_DUTY': {
    label: 'Off Duty',
    color: 'bg-gray-500',
    textColor: 'text-gray-700',
    icon: Power,
    variant: 'outline' as const
  }
}

export function StaffStatusDisplay() {
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentOrganization } = useMultiOrgAuth()
  
  useEffect(() => {
    if (!currentOrganization) return
    
    const db = getSupabase()
    if (!db) return
    
    fetchStaffStatuses()
    
    // Set up real-time subscription
    const subscription = db
      .channel('staff-status')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'core_relationships',
          filter: `organization_id=eq.${currentOrganization.id}`
        },
        () => {
          // Refresh when relationships change
          fetchStaffStatuses()
        }
      )
      .subscribe()
    
    return () => {
      subscription.unsubscribe()
    }
  }, [currentOrganization])
  
  const fetchStaffStatuses = async () => {
    if (!currentOrganization) return
    
    const db = getSupabase()
    if (!db) {
      // No Supabase configured - show empty state
      setIsLoading(false)
      return
    }
    
    try {
      // Get all staff members
      const { data: staff } = await db
        .from('core_entities')
        .select(`
          *,
          status_relationships:core_relationships!from_entity_id(
            to_entity:to_entity_id(id, entity_name, entity_code),
            relationship_data
          ),
          current_appointments:universal_transactions!target_entity_id(
            id,
            transaction_type,
            client:source_entity_id(entity_name),
            metadata
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('entity_type', 'employee')
        .eq('status_relationships.relationship_type', 'has_workflow_status')
        .eq('status_relationships.relationship_data->is_active', 'true')
      
      // Transform staff data
      const transformed = (staff || []).map(member => {
        const currentStatus = member.status_relationships?.[0]?.to_entity
        const statusCode = currentStatus?.entity_code || 'STATUS-STAFF-AVAILABLE'
        const statusConfig = STATUS_CONFIG[statusCode as keyof typeof STATUS_CONFIG] || STATUS_CONFIG['STATUS-STAFF-AVAILABLE']
        
        // Find current appointment if busy
        const currentAppointment = member.current_appointments?.find(
          apt => apt.transaction_type === 'appointment' && 
                 (apt.metadata as any)?.status === 'checked_in'
        )
        
        return {
          id: member.id,
          name: member.entity_name,
          role: (member.metadata as any)?.role || 'Stylist',
          status: statusConfig.label,
          statusCode,
          statusColor: statusConfig.color,
          currentClient: currentAppointment?.client?.entity_name,
          statusChangedAt: member.status_relationships?.[0]?.relationship_data?.transitioned_at
        }
      })
      
      // Sort: Available first, then by name
      transformed.sort((a, b) => {
        if (a.statusCode === 'STATUS-STAFF-AVAILABLE' && b.statusCode !== 'STATUS-STAFF-AVAILABLE') return -1
        if (a.statusCode !== 'STATUS-STAFF-AVAILABLE' && b.statusCode === 'STATUS-STAFF-AVAILABLE') return 1
        return a.name.localeCompare(b.name)
      })
      
      setStaffMembers(transformed)
    } catch (error) {
      console.error('Failed to fetch staff statuses:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const getStatusIcon = (statusCode: string) => {
    const config = STATUS_CONFIG[statusCode as keyof typeof STATUS_CONFIG]
    const Icon = config?.icon || User
    return <Icon className="w-4 h-4" />
  }
  
  const getStatusBadgeVariant = (statusCode: string) => {
    const config = STATUS_CONFIG[statusCode as keyof typeof STATUS_CONFIG]
    return config?.variant || 'default'
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Staff Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading staff status...
          </div>
        </CardContent>
      </Card>
    )
  }
  
  const availableCount = staffMembers.filter(s => s.statusCode === 'STATUS-STAFF-AVAILABLE').length
  const busyCount = staffMembers.filter(s => s.statusCode === 'STATUS-STAFF-BUSY').length
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Staff Status</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-700">
              {availableCount} Available
            </Badge>
            <Badge variant="outline" className="text-orange-700">
              {busyCount} Busy
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {staffMembers.map(member => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 rounded-lg border"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-8 rounded-full ${member.statusColor}`} />
                <div>
                  <p className="font-medium">{member.name}</p>
                  <p className="text-sm text-muted-foreground">{member.role}</p>
                  {member.currentClient && (
                    <p className="text-xs text-muted-foreground mt-1">
                      with {member.currentClient}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={getStatusBadgeVariant(member.statusCode)}>
                {getStatusIcon(member.statusCode)}
                <span className="ml-1">{member.status}</span>
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}