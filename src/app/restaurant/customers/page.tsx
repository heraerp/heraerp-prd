'use client'

import { JobsStyleLayout } from '@/components/restaurant/JobsStyleLayout'
import { CustomerManagement } from '@/components/restaurant/customers/CustomerManagement'
import { Button } from '@/components/ui/button'
import { Plus, Upload, Download, UserPlus, Star, Gift } from 'lucide-react'

export default function CustomersPage() {
  const headerActions = (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm">
        <Star className="w-4 h-4 mr-2" />
        VIP List
      </Button>
      <Button variant="outline" size="sm">
        <Gift className="w-4 h-4 mr-2" />
        Loyalty
      </Button>
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600">
        <UserPlus className="w-4 h-4 mr-2" />
        Add Customer
      </Button>
    </div>
  )

  return (
    <JobsStyleLayout 
      currentSection="customers"
      headerActions={headerActions}
    >
      <CustomerManagement />
    </JobsStyleLayout>
  )
}