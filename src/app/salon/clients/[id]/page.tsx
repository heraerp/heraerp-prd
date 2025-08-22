'use client'

import React, { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { 
  ChevronLeft,
  Phone,
  Mail,
  Calendar,
  Star,
  Gift,
  DollarSign,
  Edit,
  Clock,
  Heart,
  Sparkles,
  Shield,
  User,
  AlertTriangle,
  FileText,
  TrendingUp,
  Activity,
  Award,
  Loader2,
  MoreVertical,
  Send,
  MessageSquare,
  CreditCard
} from 'lucide-react'

interface ClientDetails {
  id: string
  name: string
  code: string
  phone: string
  email: string
  birthDate: string | null
  loyaltyPoints: number
  preferredStylist: string
  notes: string
  allergies: string
  preferences: string
  emergencyContact: string
  totalSpent: number
  visitCount: number
  status: string
  createdAt: string
  appointmentHistory: Array<{
    id: string
    date: string
    service: string
    stylist: string
    amount: number
    status: string
  }>
}

export default function ClientDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params.id as string
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  
  const [client, setClient] = useState<ClientDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (clientId && (currentOrganization || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID)) {
      fetchClientDetails()
    }
  }, [clientId, currentOrganization])

  const fetchClientDetails = async () => {
    try {
      setError(null)
      const response = await fetch(`/api/v1/salon/clients/${clientId}`)
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch client details')
      }
      
      if (data.success) {
        setClient(data.client)
      }
    } catch (error) {
      console.error('Error fetching client details:', error)
      setError(error instanceof Error ? error.message : 'Failed to load client details')
    } finally {
      setIsLoading(false)
    }
  }

  const getTierInfo = (points: number) => {
    if (points >= 1000) return { label: 'Platinum', color: 'bg-purple-100 text-purple-700', discount: '20%' }
    if (points >= 500) return { label: 'Gold', color: 'bg-yellow-100 text-yellow-700', discount: '15%' }
    if (points >= 200) return { label: 'Silver', color: 'bg-gray-100 text-gray-700', discount: '10%' }
    return { label: 'Bronze', color: 'bg-orange-100 text-orange-700', discount: '5%' }
  }

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return null
    const today = new Date()
    const birth = new Date(birthDate)
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  const addLoyaltyPoints = async (points: number, reason: string) => {
    try {
      const orgId = currentOrganization?.id || process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
      
      const response = await fetch(`/api/v1/salon/clients/${clientId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_loyalty_points',
          data: {
            points,
            reason,
            organizationId: orgId,
            salonId: orgId // In this case, salon is the organization
          }
        })
      })
      
      if (response.ok) {
        fetchClientDetails() // Refresh data
      }
    } catch (error) {
      console.error('Error adding loyalty points:', error)
    }
  }

  if (!isAuthenticated && !contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <Shield className="w-4 h-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            Please log in to access client details.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading client details...</p>
        </div>
      </div>
    )
  }

  if (error || !client) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertTitle className="text-red-800">Error</AlertTitle>
          <AlertDescription className="text-red-600">
            {error || 'Client not found'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const tier = getTierInfo(client.loyaltyPoints)
  const age = calculateAge(client.birthDate)
  const memberSince = new Date(client.createdAt).toLocaleDateString()
  const lastVisit = client.appointmentHistory.length > 0 
    ? new Date(client.appointmentHistory[0].date).toLocaleDateString()
    : 'No visits yet'

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon/clients')}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Clients
            </Button>
            
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">
                    {client.name}
                  </h1>
                  <Badge className={tier.color}>
                    <Sparkles className="w-3 h-3 mr-1" />
                    {tier.label} Member
                  </Badge>
                  {client.status === 'vip' && (
                    <Badge className="bg-purple-100 text-purple-700">
                      <Star className="w-3 h-3 mr-1" />
                      VIP
                    </Badge>
                  )}
                </div>
                <p className="text-gray-600">Client ID: {client.code}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => router.push(`/salon/clients/${clientId}/edit`)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Loyalty Points</p>
                    <p className="text-2xl font-bold text-purple-600">{client.loyaltyPoints}</p>
                    <p className="text-xs text-purple-600">{tier.discount} discount</p>
                  </div>
                  <Gift className="w-8 h-8 text-purple-600 opacity-50" />
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => addLoyaltyPoints(50, 'Manual adjustment')}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add Points
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-green-600">
                      AED {client.totalSpent.toFixed(0)}
                    </p>
                    <p className="text-xs text-gray-500">Lifetime value</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Visits</p>
                    <p className="text-2xl font-bold text-blue-600">{client.visitCount}</p>
                    <p className="text-xs text-gray-500">Last: {lastVisit}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Per Visit</p>
                    <p className="text-2xl font-bold text-orange-600">
                      AED {client.visitCount > 0 ? (client.totalSpent / client.visitCount).toFixed(0) : '0'}
                    </p>
                    <p className="text-xs text-gray-500">Per service</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600 opacity-50" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Member Since</p>
                    <p className="text-lg font-bold text-gray-700">{memberSince}</p>
                    <p className="text-xs text-gray-500">{age ? `${age} years old` : 'Age unknown'}</p>
                  </div>
                  <Award className="w-8 h-8 text-gray-600 opacity-50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="history">Visit History</TabsTrigger>
              <TabsTrigger value="preferences">Preferences</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Contact Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Phone</p>
                        <p className="font-medium">{client.phone || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="font-medium">{client.email || 'Not provided'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Birth Date</p>
                        <p className="font-medium">
                          {client.birthDate 
                            ? new Date(client.birthDate).toLocaleDateString() 
                            : 'Not provided'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Emergency Contact</p>
                        <p className="font-medium">{client.emergencyContact || 'Not provided'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Salon Preferences */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-600" />
                      Salon Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Preferred Stylist</p>
                      <p className="font-medium">{client.preferredStylist || 'No preference'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Allergies/Sensitivities</p>
                      <p className="font-medium text-red-600">
                        {client.allergies || 'None reported'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Preferences</p>
                      <p className="font-medium">{client.preferences || 'None specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Notes</p>
                      <p className="font-medium">{client.notes || 'No notes'}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="h-20 flex flex-col items-center justify-center gap-2"
                      onClick={() => router.push(`/salon/appointments/new?client=${clientId}`)}
                    >
                      <Calendar className="w-5 h-5 text-purple-600" />
                      <span className="text-sm">Book Appointment</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2"
                    >
                      <CreditCard className="w-5 h-5 text-green-600" />
                      <span className="text-sm">Process Payment</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5 text-blue-600" />
                      <span className="text-sm">Send Promotion</span>
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-20 flex flex-col items-center justify-center gap-2"
                    >
                      <FileText className="w-5 h-5 text-orange-600" />
                      <span className="text-sm">View Invoice</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Visit History</CardTitle>
                  <CardDescription>
                    Complete history of appointments and services
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {client.appointmentHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No visit history yet</p>
                      <Button 
                        className="mt-4"
                        onClick={() => router.push(`/salon/appointments/new?client=${clientId}`)}
                      >
                        Book First Appointment
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {client.appointmentHistory.map((visit) => (
                        <div key={visit.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{visit.service}</h4>
                              <p className="text-sm text-gray-600">
                                with {visit.stylist} • {new Date(visit.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">AED {visit.amount}</p>
                              <Badge 
                                variant="outline"
                                className={
                                  visit.status === 'completed' ? 'text-green-600' :
                                  visit.status === 'cancelled' ? 'text-red-600' :
                                  'text-blue-600'
                                }
                              >
                                {visit.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Preference Analytics Coming Soon
                    </h3>
                    <p className="text-gray-600">
                      Track favorite services, preferred times, and booking patterns
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="communications">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Communication History Coming Soon
                    </h3>
                    <p className="text-gray-600">
                      View SMS, email, and marketing communication history
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}