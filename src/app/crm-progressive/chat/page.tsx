'use client'

import React from 'react'
import { CRMLayout } from '@/components/layout/crm-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageCircle, Send, User, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export default function CRMChatPage() {
  return (
    <CRMLayout>
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-cyan-100 rounded-lg flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">CRM Chat</h1>
              <p className="text-gray-600 mt-1">Communicate with your team and customers</p>
            </div>
          </div>
        </div>

        {/* Chat Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Conversations List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Conversations</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y">
                  {['Sarah Johnson', 'Mike Chen', 'Emily Rodriguez'].map((name, idx) => (
                    <div key={idx} className="p-4 hover:bg-gray-50 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>{name && typeof name === 'string' ? name.split(' ').map(n => n[0]).join('') : '?'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{name}</p>
                          <p className="text-xs text-gray-500 truncate">Last message preview...</p>
                        </div>
                        <Clock className="h-3 w-3 text-gray-400" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Window */}
          <div className="lg:col-span-3">
            <Card className="h-[600px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarFallback>SJ</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">Sarah Johnson</CardTitle>
                    <p className="text-sm text-gray-500">Tech Solutions Inc</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4 overflow-y-auto">
                <div className="space-y-4">
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-3 max-w-xs">
                      <p className="text-sm">Hi! I'm interested in learning more about your enterprise solution.</p>
                      <p className="text-xs text-gray-500 mt-1">10:30 AM</p>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="bg-blue-600 text-white rounded-lg p-3 max-w-xs">
                      <p className="text-sm">Hello Sarah! I'd be happy to help. What specific features are you looking for?</p>
                      <p className="text-xs text-blue-100 mt-1">10:32 AM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
              <div className="border-t p-4">
                <div className="flex gap-2">
                  <Input placeholder="Type a message..." className="flex-1" />
                  <Button size="icon" className="bg-blue-600 hover:bg-blue-700">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </CRMLayout>
  )
}