'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Sparkles, Users, DollarSign, Clock } from 'lucide-react'

export function CustomizationExampleCard() {
  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-900 dark:text-purple-100">
          <Sparkles className="w-5 h-5" />
          How Customization Works
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Before */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-100 dark:text-foreground">Template Default</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-gray-700 dark:text-gray-300">Grace period: 15 min</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-gray-700 dark:text-gray-300">No-show fee: 100%</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-muted-foreground" />
                <span className="text-gray-700 dark:text-gray-300">VIP fee: 25%</span>
              </div>
            </div>
          </div>

          {/* Arrow */}
          <div className="flex items-center justify-center">
            <ArrowRight className="w-6 h-6 text-purple-600 dark:text-purple-400" />
          </div>

          {/* After */}
          <div className="space-y-3">
            <h4 className="font-semibold text-green-900 dark:text-green-100">Your Custom Rules</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-green-600" />
                <span className="text-green-700 dark:text-green-300">Grace period: 30 min</span>
                <Badge variant="outline" className="text-xs">
                  Changed
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <span className="text-green-700 dark:text-green-300">No-show fee: 50%</span>
                <Badge variant="outline" className="text-xs">
                  Changed
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-green-600" />
                <span className="text-green-700 dark:text-green-300">VIP fee: 0%</span>
                <Badge variant="outline" className="text-xs">
                  Changed
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 bg-purple-100/50 dark:bg-purple-900/20 rounded-lg">
          <p className="text-sm text-purple-800 dark:text-purple-200">
            <strong>Customize any aspect:</strong> Grace periods, fees, VIP exceptions, notification
            timing, and more - all through an intuitive interface with no coding required.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
