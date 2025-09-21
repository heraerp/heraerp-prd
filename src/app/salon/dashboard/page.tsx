'use client'

import React, { useEffect, useState } from 'react'
import { SalonAuthGuard } from '@/components/salon/auth/SalonAuthGuard'
import { OwnerDashboard } from './owner-view'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/luxe-card'
import { Shield } from 'lucide-react'

// Import other role-specific dashboards as we create them
// import { ReceptionistDashboard } from './receptionist-view'
// import { AccountantDashboard } from './accountant-view'
// import { AdminDashboard } from './admin-view'

export default function SalonDashboardPage() {
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    // Get user info from localStorage
    const role = localStorage.getItem('salonRole')
    const name = localStorage.getItem('salonUserName')
    setUserRole(role)
    setUserName(name)
  }, [])

  // Render role-specific dashboard
  const renderDashboard = () => {
    switch (userRole) {
      case 'Owner':
        return <OwnerDashboard />

      case 'Receptionist':
        // For now, show a placeholder for Receptionist
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" style={{ color: '#D4AF37' }} />
                  Receptionist Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#E0E0E0' }}>
                  Welcome {userName}! Your receptionist dashboard is being prepared.
                </p>
                <p className="text-sm mt-2" style={{ color: '#8C7853' }}>
                  In the meantime, you can access the POS and Appointments from the sidebar.
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case 'Accountant':
        // For now, show a placeholder for Accountant
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" style={{ color: '#D4AF37' }} />
                  Accountant Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#E0E0E0' }}>
                  Welcome {userName}! Your financial dashboard is being prepared.
                </p>
                <p className="text-sm mt-2" style={{ color: '#8C7853' }}>
                  In the meantime, you can access Finance and Reports from the sidebar.
                </p>
              </CardContent>
            </Card>
          </div>
        )

      case 'Administrator':
        // For now, show a placeholder for Administrator
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" style={{ color: '#D4AF37' }} />
                  Administrator Dashboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p style={{ color: '#E0E0E0' }}>
                  Welcome {userName}! Your admin dashboard is being prepared.
                </p>
                <p className="text-sm mt-2" style={{ color: '#8C7853' }}>
                  In the meantime, you can access Settings and User Management from the sidebar.
                </p>
              </CardContent>
            </Card>
          </div>
        )

      default:
        return (
          <div className="p-6">
            <Card>
              <CardContent className="pt-6">
                <p style={{ color: '#E0E0E0' }}>Loading dashboard...</p>
              </CardContent>
            </Card>
          </div>
        )
    }
  }

  return (
    <SalonAuthGuard requiredRoles={['Owner', 'Administrator']}>
      <div className="min-h-screen" style={{ backgroundColor: '#1A1A1A' }}>
        {renderDashboard()}
      </div>
    </SalonAuthGuard>
  )
}
