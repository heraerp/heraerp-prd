'use client'

import { JobsStyleLayout } from '@/components/restaurant/JobsStyleLayout'
import { KitchenDisplay } from '@/components/restaurant/kitchen/KitchenDisplay'
import { Button } from '@/components/ui/button'
import { ChefHat, Timer, AlertTriangle, Play, Pause, Settings } from 'lucide-react'

export default function KitchenPage() {
  const headerActions = (
    <div className="flex items-center space-x-2">
      <Button variant="outline" size="sm">
        <Timer className="w-4 h-4 mr-2" />
        Timers
      </Button>
      <Button variant="outline" size="sm">
        <AlertTriangle className="w-4 h-4 mr-2" />
        Alerts
      </Button>
      <Button variant="outline" size="sm">
        <Settings className="w-4 h-4 mr-2" />
        Settings
      </Button>
      <Button size="sm" className="bg-gradient-to-r from-green-500 to-emerald-600">
        <ChefHat className="w-4 h-4 mr-2" />
        Active Mode
      </Button>
    </div>
  )

  return (
    <JobsStyleLayout 
      currentSection="kitchen"
      headerActions={headerActions}
    >
      <KitchenDisplay />
    </JobsStyleLayout>
  )
}