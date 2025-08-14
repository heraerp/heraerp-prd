'use client'

import { TableManagement } from '@/components/restaurant/table-management/TableManagement'
import { JobsStyleLayout } from '@/components/restaurant/JobsStyleLayout'
import { Button } from '@/components/ui/button'
import { Plus, RefreshCw, Download, Settings } from 'lucide-react'

export default function TableManagementPage() {
  const headerActions = (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm">
        <Download className="w-4 h-4 mr-2" />
        Export
      </Button>
      <Button variant="outline" size="sm">
        <RefreshCw className="w-4 h-4 mr-2" />
        Refresh
      </Button>
      <Button size="sm">
        <Plus className="w-4 h-4 mr-2" />
        Add Table
      </Button>
    </div>
  )

  return (
    <JobsStyleLayout 
      currentSection="table-management"
      headerActions={headerActions}
    >
      <div className="p-6">
        <TableManagement />
      </div>
    </JobsStyleLayout>
  )
}