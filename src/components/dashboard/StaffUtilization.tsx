'use client'

import React from 'react'
import Link from 'next/link'
import { Users, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { useStaffUtilization } from '@/lib/api/staff'

interface StaffUtilizationProps {
  organizationId: string
}

export function StaffUtilization({ organizationId }: StaffUtilizationProps) {
  const today = new Date().toISOString().split('T')[0]

  const { data, isLoading } = useStaffUtilization({
    organizationId,
    date: today
  })

  const staffData = data?.staff || []

  // Sort by utilization percentage
  const sortedStaff = [...staffData].sort((a, b) => b.utilization - a.utilization)

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Staff Utilization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-10" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500'
    if (percentage >= 60) return 'bg-blue-500'
    if (percentage >= 40) return 'bg-yellow-500'
    return 'bg-gray-400'
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Staff Utilization Today
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1">
        {staffData.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No staff scheduled today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedStaff.slice(0, 5).map(staff => (
              <div key={staff.id} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium truncate flex-1">{staff.name}</span>
                  <span className="text-muted-foreground ml-2">{staff.utilization}%</span>
                </div>
                <div className="relative">
                  <Progress value={staff.utilization} className="h-2" />
                  <div
                    className={`absolute inset-0 h-2 rounded-full ${getUtilizationColor(staff.utilization)} opacity-80`}
                    style={{ width: `${staff.utilization}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {staff.appointments_count} appointments • {staff.hours_booked}h booked
                </p>
              </div>
            ))}
          </div>
        )}

        {staffData.length > 5 && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            +{staffData.length - 5} more staff members
          </p>
        )}
      </CardContent>

      <CardFooter className="pt-3">
        <Link href="/staff/schedule" className="w-full">
          <Button variant="ghost" className="w-full">
            View Staff Schedule
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  )
}
