'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, User, Scissors } from 'lucide-react'
import { createClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface CheckedInAppointment {
  id: string
  clientName: string
  stylistName: string
  serviceName: string
  appointmentTime: string
  checkedInAt: string
  waitTime: number
}

export function WaitingRoomDisplay() {
  const [checkedInAppointments, setCheckedInAppointments] = useState<CheckedInAppointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentOrganization } = useMultiOrgAuth()
  
  useEffect(() => {
    if (!currentOrganization) return
    
    fetchCheckedInAppointments()
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('waiting-room')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'universal_transactions',
          filter: `organization_id=eq.${currentOrganization.id}`
        },
        () => {
          // Refresh when any appointment changes
          fetchCheckedInAppointments()
        }
      )
      .subscribe()
    
    // Refresh every minute to update wait times
    const interval = setInterval(fetchCheckedInAppointments, 60000)
    
    return () => {
      subscription.unsubscribe()
      clearInterval(interval)
    }
  }, [currentOrganization])
  
  const fetchCheckedInAppointments = async () => {
    if (!currentOrganization) return
    
    try {
      // Get all appointments with CHECKED_IN status
      const { data: appointments } = await supabase
        .from('universal_transactions')
        .select(`
          *,
          client:source_entity_id(entity_name),
          stylist:target_entity_id(entity_name),
          status_relationships:core_relationships!from_entity_id(
            to_entity:to_entity_id(entity_name, entity_code),
            relationship_data
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('transaction_type', 'appointment')
        .eq('transaction_date', new Date().toISOString().split('T')[0])
        .eq('status_relationships.relationship_type', 'has_workflow_status')
        .eq('status_relationships.relationship_data->is_active', 'true')
      
      // Filter for checked-in appointments
      const checkedIn = appointments?.filter(apt => {
        const status = apt.status_relationships?.[0]?.to_entity
        return status?.entity_code === 'STATUS-APPOINTMENT-CHECKED_IN'
      }) || []
      
      // Transform and calculate wait times
      const transformed = checkedIn.map(apt => {
        const checkedInAt = apt.metadata?.checked_in_at || 
                           apt.status_relationships?.[0]?.relationship_data?.checked_in_at ||
                           new Date().toISOString()
        
        const waitTime = Math.floor(
          (new Date().getTime() - new Date(checkedInAt).getTime()) / 1000 / 60
        )
        
        return {
          id: apt.id,
          clientName: apt.client?.entity_name || apt.metadata?.customer_name || 'Unknown',
          stylistName: apt.stylist?.entity_name || apt.metadata?.stylist_name || 'Any Available',
          serviceName: apt.metadata?.service_name || 'Service',
          appointmentTime: apt.metadata?.appointment_time || '10:00',
          checkedInAt,
          waitTime
        }
      })
      
      // Sort by check-in time (oldest first)
      transformed.sort((a, b) => 
        new Date(a.checkedInAt).getTime() - new Date(b.checkedInAt).getTime()
      )
      
      setCheckedInAppointments(transformed)
    } catch (error) {
      console.error('Failed to fetch waiting room:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const getWaitTimeColor = (minutes: number) => {
    if (minutes < 5) return 'text-green-600'
    if (minutes < 15) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const getWaitTimeBadge = (minutes: number) => {
    if (minutes < 5) return 'default'
    if (minutes < 15) return 'secondary'
    return 'destructive'
  }
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Waiting Room</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading waiting room...
          </div>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Waiting Room
          </CardTitle>
          <Badge variant="outline">
            {checkedInAppointments.length} waiting
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {checkedInAppointments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No clients currently waiting
          </div>
        ) : (
          <div className="space-y-3">
            {checkedInAppointments.map((apt, index) => (
              <div
                key={apt.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{apt.clientName}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Scissors className="w-3 h-3" />
                        {apt.serviceName}
                      </span>
                      <span>with {apt.stylistName}</span>
                      <span>• {apt.appointmentTime}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={getWaitTimeBadge(apt.waitTime)}>
                    {apt.waitTime} min
                  </Badge>
                  <p className={`text-xs mt-1 ${getWaitTimeColor(apt.waitTime)}`}>
                    Checked in {format(new Date(apt.checkedInAt), 'h:mm a')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}