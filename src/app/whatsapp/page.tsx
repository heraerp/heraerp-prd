'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MessageSquare, Send, Users, Clock, BarChart } from 'lucide-react'
import Link from 'next/link'

export default function WhatsAppPage() {
  const features = [
    {
      title: 'Send Messages',
      description: 'Send individual or bulk WhatsApp messages to customers',
      icon: Send,
      href: '/whatsapp-messages',
      color: 'bg-emerald-500'
    },
    {
      title: 'Message Templates',
      description: 'Create and manage reusable message templates',
      icon: MessageSquare,
      href: '/whatsapp-setup-guide',
      color: 'bg-blue-500'
    },
    {
      title: 'Customer Groups',
      description: 'Organize customers into groups for targeted messaging',
      icon: Users,
      href: '/customers',
      color: 'bg-violet-500'
    },
    {
      title: 'Schedule Messages',
      description: 'Schedule messages to be sent at optimal times',
      icon: Clock,
      href: '#',
      color: 'bg-orange-500'
    },
    {
      title: 'Analytics',
      description: 'Track message delivery and engagement rates',
      icon: BarChart,
      href: '#',
      color: 'bg-pink-500'
    }
  ]

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 bg-clip-text text-transparent">
          WhatsApp Business
        </h1>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Connect with your customers through WhatsApp messaging
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Messages Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">1,234</p>
            <p className="text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">98.5%</p>
            <p className="text-xs text-gray-500">Industry avg: 95%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Conversations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">47</p>
            <p className="text-xs text-blue-600">23 new today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">12</p>
            <p className="text-xs text-gray-500">5 active</p>
          </CardContent>
        </Card>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <Link key={index} href={feature.href}>
              <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${feature.color}`}>
                      {Icon && <Icon className="h-6 w-6 text-white" />}
                    </div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
                  {feature.href === '#' && (
                    <p className="text-xs text-orange-500 mt-2">Coming soon</p>
                  )}
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Appointment Reminder Campaign</p>
                <p className="text-sm text-gray-600">Sent to 145 customers</p>
              </div>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">New Customer Welcome</p>
                <p className="text-sm text-gray-600">Sent to Sarah Johnson</p>
              </div>
              <p className="text-sm text-gray-500">5 hours ago</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Monthly Promotions</p>
                <p className="text-sm text-gray-600">Scheduled for tomorrow 10 AM</p>
              </div>
              <p className="text-sm text-gray-500">Scheduled</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
