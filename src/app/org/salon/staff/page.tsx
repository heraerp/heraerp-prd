'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, UserPlus, Calendar, DollarSign, Star } from 'lucide-react'

export default function SalonStaffPage() {
  const staff = [
    {
      id: 1,
      name: 'Sarah Johnson',
      role: 'Senior Stylist',
      experience: '8 years',
      specialties: ['Hair Color', 'Highlights', 'Cuts'],
      commission: 45,
      rating: 4.8,
      todayBookings: 6,
      weekRevenue: 1250
    },
    {
      id: 2,
      name: 'Maria Rodriguez',
      role: 'Nail Specialist',
      experience: '5 years',
      specialties: ['Nails', 'Facials', 'Skincare'],
      commission: 50,
      rating: 4.9,
      todayBookings: 8,
      weekRevenue: 980
    },
    {
      id: 3,
      name: 'Emma Williams',
      role: 'Stylist',
      experience: '3 years',
      specialties: ['Cuts', 'Styling', 'Treatments'],
      commission: 35,
      rating: 4.7,
      todayBookings: 5,
      weekRevenue: 750
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Staff Management
          </h1>
          <p className="text-gray-600 mt-1">Manage team members and schedules</p>
        </div>
        <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Staff Member
        </Button>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <Card key={member.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">
                    {member.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="font-semibold">{member.name}</h3>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  <span className="text-sm font-semibold">{member.rating}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-600">Experience</p>
                  <p className="font-semibold">{member.experience}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Specialties</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {member.specialties.map((specialty) => (
                      <span 
                        key={specialty}
                        className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t">
                  <div>
                    <p className="text-xs text-gray-600">Today's Bookings</p>
                    <p className="font-semibold flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-pink-500" />
                      {member.todayBookings}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">This Week</p>
                    <p className="font-semibold flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-green-500" />
                      ${member.weekRevenue}
                    </p>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <p className="text-xs text-gray-600">Commission Rate</p>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                      <div 
                        className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full"
                        style={{ width: `${member.commission}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold">{member.commission}%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}