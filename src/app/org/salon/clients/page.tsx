'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Users, UserPlus, Search, Star, Crown } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

function SalonClientsContent() {

  const searchParams = useSearchParams()
  const action = searchParams.get('action')
  const [showNewClient, setShowNewClient] = useState(false)

  useEffect(() => {
    if (action === 'new') {
      setShowNewClient(true)
    }
  }, [action])

  
return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Clients
          </h1>
          <p className="text-gray-600 mt-1">Manage customer profiles and loyalty</p>
        </div>
        <Button 
          onClick={() => setShowNewClient(true)}
          className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Client
        </Button>
      </div>

      {/* Client Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Clients</p>
                <p className="text-2xl font-bold">1,245</p>
              </div>
              <Users className="w-8 h-8 text-pink-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">New This Month</p>
                <p className="text-2xl font-bold">28</p>
              </div>
              <UserPlus className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">VIP Clients</p>
                <p className="text-2xl font-bold">156</p>
              </div>
              <Crown className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Spend</p>
                <p className="text-2xl font-bold">$125</p>
              </div>
              <Star className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Client List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                  JS
                </div>
                <div>
                  <h3 className="font-semibold">Jennifer Smith</h3>
                  <p className="text-sm text-gray-600">VIP Customer • 24 visits</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">2,850 pts</p>
                <p className="text-sm text-gray-600">Platinum</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                  AW
                </div>
                <div>
                  <h3 className="font-semibold">Amanda Wilson</h3>
                  <p className="text-sm text-gray-600">Regular • 12 visits</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">1,250 pts</p>
                <p className="text-sm text-gray-600">Gold</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                  RG
                </div>
                <div>
                  <h3 className="font-semibold">Rachel Green</h3>
                  <p className="text-sm text-gray-600">New • 3 visits</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold">100 pts</p>
                <p className="text-sm text-gray-600">Bronze</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )

}

export default function SalonClientsPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <SalonClientsContent />
    </Suspense>
  )
}