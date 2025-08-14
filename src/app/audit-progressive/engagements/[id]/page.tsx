'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Users,
  Shield,
  FileText,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Activity,
  Target,
  Zap,
  Eye,
  Download,
  Send,
  MoreHorizontal,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// Steve Jobs: Focus on what's essential
const PHASES = [
  { id: 1, name: 'Planning', icon: Target },
  { id: 2, name: 'Fieldwork', icon: Activity },
  { id: 3, name: 'Review', icon: Eye },
  { id: 4, name: 'Reporting', icon: FileText },
  { id: 5, name: 'Complete', icon: CheckCircle2 }
]

export default function EngagementDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [engagement, setEngagement] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEngagement()
  }, [params.id])

  const loadEngagement = async () => {
    try {
      // For demo, create a mock engagement
      const mockEngagement = {
        id: params.id,
        client_name: 'Cyprus Trading Ltd',
        client_code: 'CLI-2025-' + params.id,
        year_end_date: '2025-12-31',
        audit_year: '2025',
        estimated_fees: 75000,
        estimated_hours: 500,
        risk_rating: 'moderate',
        status: 'active',
        phase: 2,
        completion: 35,
        engagement_partner: 'John Smith',
        audit_manager: 'Sarah Johnson',
        team_size: 5,
        days_until_deadline: 45,
        key_risks: [
          'Revenue recognition complexity',
          'Inventory valuation concerns',
          'Related party transactions'
        ],
        milestones: [
          { name: 'Planning Complete', date: '2025-02-28', status: 'complete' },
          { name: 'Fieldwork Start', date: '2025-03-15', status: 'in_progress' },
          { name: 'Draft Report', date: '2025-04-15', status: 'upcoming' },
          { name: 'Final Sign-off', date: '2025-04-30', status: 'upcoming' }
        ]
      }
      
      setEngagement(mockEngagement)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load engagement:', error)
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading engagement...</p>
        </div>
      </div>
    )
  }

  if (!engagement) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Engagement not found</h3>
          <Button onClick={() => router.push('/audit-progressive/engagements')}>
            Back to Engagements
          </Button>
        </div>
      </div>
    )
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50'
      case 'moderate': return 'text-yellow-600 bg-yellow-50'
      case 'high': return 'text-red-600 bg-red-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Minimal and Clean */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/audit-progressive/engagements')}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-xl font-semibold">{engagement.client_name}</h1>
                <p className="text-sm text-gray-600">{engagement.client_code} • FY {engagement.audit_year}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export
              </Button>
              <Button variant="outline" size="sm">
                <Send className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics - Visual Impact */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Progress</p>
                <p className="text-2xl font-bold">{engagement.completion}%</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Fee</p>
                <p className="text-2xl font-bold">${(engagement.estimated_fees / 1000).toFixed(0)}K</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Hours</p>
                <p className="text-2xl font-bold">{engagement.estimated_hours}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team</p>
                <p className="text-2xl font-bold">{engagement.team_size}</p>
              </div>
              <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-0 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="text-2xl font-bold">{engagement.days_until_deadline}d</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Phase Progress - Visual Timeline */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <Card className="p-6 border-0 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Audit Progress</h3>
          <div className="flex items-center justify-between mb-6">
            {PHASES.map((phase, index) => {
              const Icon = phase.icon
              const isActive = phase.id === engagement.phase
              const isComplete = phase.id < engagement.phase
              
              return (
                <div key={phase.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-12 h-12 rounded-full flex items-center justify-center transition-all
                      ${isComplete ? 'bg-green-500 text-white' :
                        isActive ? 'bg-blue-500 text-white' :
                        'bg-gray-200 text-gray-600'}
                    `}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className={`text-sm mt-2 font-medium
                      ${isActive ? 'text-blue-600' : isComplete ? 'text-green-600' : 'text-gray-600'}
                    `}>
                      {phase.name}
                    </span>
                  </div>
                  {index < PHASES.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 transition-all
                      ${phase.id < engagement.phase ? 'bg-green-500' : 'bg-gray-200'}
                    `} />
                  )}
                </div>
              )
            })}
          </div>
          <Progress value={engagement.completion} className="h-2" />
        </Card>
      </div>

      {/* Main Content - Tabbed Interface */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team</TabsTrigger>
            <TabsTrigger value="risks">Key Risks</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-2 gap-6">
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Engagement Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Risk Rating</span>
                    <Badge className={getRiskColor(engagement.risk_rating)}>
                      {engagement.risk_rating}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Year End</span>
                    <span className="font-medium">{new Date(engagement.year_end_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Partner</span>
                    <span className="font-medium">{engagement.engagement_partner}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Manager</span>
                    <span className="font-medium">{engagement.audit_manager}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    View Working Papers
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Client Portal
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Shield className="w-4 h-4 mr-2" />
                    Risk Assessment
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Eye className="w-4 h-4 mr-2" />
                    Review Points
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Engagement Team</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">JS</span>
                      </div>
                      <div>
                        <p className="font-medium">John Smith</p>
                        <p className="text-sm text-gray-600">Engagement Partner</p>
                      </div>
                    </div>
                    <Badge>Partner</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">SJ</span>
                      </div>
                      <div>
                        <p className="font-medium">Sarah Johnson</p>
                        <p className="text-sm text-gray-600">Audit Manager</p>
                      </div>
                    </div>
                    <Badge>Manager</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">+3</span>
                      </div>
                      <div>
                        <p className="font-medium">3 Team Members</p>
                        <p className="text-sm text-gray-600">Senior & Staff Auditors</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">View All</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="risks">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Key Risk Areas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {engagement.key_risks.map((risk: string, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-orange-500" />
                        <span className="font-medium">{risk}</span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Key Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {engagement.milestones.map((milestone: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {milestone.status === 'complete' ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                        ) : milestone.status === 'in_progress' ? (
                          <Zap className="w-5 h-5 text-blue-500" />
                        ) : (
                          <Clock className="w-5 h-5 text-gray-400" />
                        )}
                        <div>
                          <p className="font-medium">{milestone.name}</p>
                          <p className="text-sm text-gray-600">{new Date(milestone.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Badge variant={
                        milestone.status === 'complete' ? 'default' :
                        milestone.status === 'in_progress' ? 'secondary' : 'outline'
                      }>
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Documents</CardTitle>
                <Button size="sm">
                  <FileText className="w-4 h-4 mr-2" />
                  Request Documents
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No documents uploaded yet</p>
                  <Button variant="outline">Upload First Document</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}