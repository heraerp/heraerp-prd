'use client'

import React from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Phone, PhoneCall, PhoneMissed, PhoneIncoming, PhoneOutgoing, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default function CRMCallsPage() {
  const callHistory = [
    { id: 1, contact: 'Sarah Johnson', company: 'Tech Solutions Inc', type: 'outgoing', duration: '15:32', time: '10:30 AM', date: 'Today', status: 'completed' },
    { id: 2, contact: 'Mike Chen', company: 'StartupCo', type: 'incoming', duration: '8:45', time: '9:15 AM', date: 'Today', status: 'completed' },
    { id: 3, contact: 'Emily Rodriguez', company: 'Global Enterprises', type: 'missed', duration: '-', time: '3:45 PM', date: 'Yesterday', status: 'missed' },
    { id: 4, contact: 'John Smith', company: 'ABC Corp', type: 'outgoing', duration: '22:10', time: '2:00 PM', date: 'Yesterday', status: 'completed' },
  ]

  const getCallIcon = (type: string) => {
    switch(type) {
      case 'incoming': return <PhoneIncoming className="h-4 w-4 text-green-600" />
      case 'outgoing': return <PhoneOutgoing className="h-4 w-4 text-blue-600" />
      case 'missed': return <PhoneMissed className="h-4 w-4 text-red-600" />
      default: return <Phone className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <CRMLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Phone className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CRM Calls</h1>
                <p className="text-gray-600 mt-1">Manage your voice communications</p>
              </div>
            </div>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Phone className="h-4 w-4 mr-2" />
              Make Call
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Calls Today</p>
                  <p className="text-2xl font-bold">12</p>
                </div>
                <PhoneCall className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Incoming</p>
                  <p className="text-2xl font-bold text-green-600">7</p>
                </div>
                <PhoneIncoming className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Outgoing</p>
                  <p className="text-2xl font-bold text-blue-600">4</p>
                </div>
                <PhoneOutgoing className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Missed</p>
                  <p className="text-2xl font-bold text-red-600">1</p>
                </div>
                <PhoneMissed className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Call History */}
        <Card>
          <CardHeader>
            <CardTitle>Call History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Contact</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Company</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Duration</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Time</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {callHistory.map((call) => (
                    <tr key={call.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        {getCallIcon(call.type)}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{call.contact}</p>
                          <p className="text-sm text-gray-500">{call.date}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600">{call.company}</td>
                      <td className="py-3 px-4">
                        {call.status === 'missed' ? (
                          <Badge variant="destructive" className="text-xs">Missed</Badge>
                        ) : (
                          <span className="text-gray-600">{call.duration}</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-gray-600">{call.time}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Phone className="h-3 w-3 mr-1" />
                            Call Back
                          </Button>
                          <Button size="sm" variant="ghost">Notes</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </CRMLayout>
  )
}