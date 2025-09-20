'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Users, Search, Plus, Filter, Download, Mail, Phone, MapPin, Calendar } from 'lucide-react'

export default function ConstituentsPage() {
  const [searchQuery, setSearchQuery] = useState('')

  // Demo constituent data
  const constituents = [
    {
      id: 1,
      name: 'Maria Garcia',
      nationalId: '****6789',
      email: 'maria.g@email.com',
      phone: '+1 555-0123',
      address: '123 Main St, Downtown',
      eligibility: ['medicaid', 'snap', 'housing'],
      lastContact: '2024-01-15',
      status: 'active'
    },
    {
      id: 2,
      name: 'James Wilson',
      nationalId: '****4567',
      email: 'j.wilson@email.com',
      phone: '+1 555-0124',
      address: '456 Oak Ave, Westside',
      eligibility: ['veteran', 'disability'],
      lastContact: '2024-01-10',
      status: 'active'
    },
    {
      id: 3,
      name: 'Aisha Patel',
      nationalId: '****8901',
      email: 'aisha.p@email.com',
      phone: '+1 555-0125',
      address: '789 Elm St, Northtown',
      eligibility: ['childcare', 'snap'],
      lastContact: '2024-01-20',
      status: 'pending'
    }
  ]

  const eligibilityColors: Record<string, string> = {
    medicaid: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    snap: 'bg-green-500/10 text-green-400 border-green-500/20',
    housing: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    veteran: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    disability: 'bg-red-500/10 text-red-400 border-red-500/20',
    childcare: 'bg-pink-500/10 text-pink-400 border-pink-500/20'
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-text-100">Constituents</h1>
        <p className="text-xl text-text-300">Manage citizen profiles and service eligibility</p>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-text-500" />
          <Input
            type="text"
            placeholder="Search constituents..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 bg-panel border-border text-text-100 placeholder:text-text-500"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="border-border text-text-300 hover:text-text-100 hover:bg-panel"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button
            variant="outline"
            className="border-border text-text-300 hover:text-text-100 hover:bg-panel"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-accent text-accent-fg hover:bg-accent/90">
            <Plus className="h-4 w-4 mr-2" />
            New Constituent
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-panel border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-500">Total Constituents</p>
                <p className="text-2xl font-bold text-text-100">100</p>
              </div>
              <Users className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-panel border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-500">Active Cases</p>
                <p className="text-2xl font-bold text-text-100">24</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-panel border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-500">Pending Reviews</p>
                <p className="text-2xl font-bold text-text-100">7</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-panel border-border">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text-500">New This Month</p>
                <p className="text-2xl font-bold text-text-100">12</p>
              </div>
              <Calendar className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Constituents List */}
      <Card className="bg-panel border-border">
        <CardHeader>
          <CardTitle className="text-text-100">Recent Constituents</CardTitle>
          <CardDescription className="text-text-500">
            Showing {constituents.length} of 100 total constituents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {constituents.map(constituent => (
              <div
                key={constituent.id}
                className="p-4 rounded-lg border border-border bg-bg hover:bg-panel-alt transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-text-100">{constituent.name}</h3>
                        <p className="text-sm text-text-500">ID: {constituent.nationalId}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          constituent.status === 'active'
                            ? 'border-green-500/50 text-green-400'
                            : 'border-yellow-500/50 text-yellow-400'
                        }
                      >
                        {constituent.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-text-300">
                        <Mail className="h-4 w-4" />
                        {constituent.email}
                      </div>
                      <div className="flex items-center gap-2 text-text-300">
                        <Phone className="h-4 w-4" />
                        {constituent.phone}
                      </div>
                      <div className="flex items-center gap-2 text-text-300">
                        <MapPin className="h-4 w-4" />
                        {constituent.address}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-text-500">Eligible for:</span>
                      <div className="flex flex-wrap gap-2">
                        {constituent.eligibility.map(program => (
                          <Badge
                            key={program}
                            variant="outline"
                            className={eligibilityColors[program] || ''}
                          >
                            {program.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs text-text-500">
                    Last contact: {new Date(constituent.lastContact).toLocaleDateString()}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-text-300 hover:text-text-100 hover:bg-panel"
                    >
                      View Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-border text-text-300 hover:text-text-100 hover:bg-panel"
                    >
                      New Case
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
