'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { 
  CheckSquare, Target, Users, Calendar, DollarSign, TrendingUp,
  FileText, AlertTriangle, Shield, BarChart3, Clock, Settings,
  BookOpen, Calculator, Zap, Star, Award, ChevronRight, Plus,
  Building2, User, PieChart, TrendingDown, ArrowRight, Eye,
  Briefcase, Globe, Lock, Activity, Layers, Database
} from 'lucide-react'
import Link from 'next/link'

// KPMG-Level Professional Audit Planning Data
const auditEngagements = [
  {
    id: 'eng_001',
    client_name: 'Cyprus Trading Ltd',
    client_code: 'CLI-2025-001',
    engagement_partner: 'Michael Harrison, CPA',
    audit_manager: 'Sarah Chen, CA',
    year_end: '2025-12-31',
    planned_hours: 580,
    budget: 89000,
    risk_rating: 'moderate',
    status: 'planning',
    completion: 45,
    industry: 'Technology Services',
    revenue: 12500000,
    materiality: 125000,
    performance_materiality: 93750,
    trivial_threshold: 6250,
    planning_areas: [
      { area: 'Risk Assessment', status: 'completed', hours: 24, completion: 100 },
      { area: 'Analytical Review', status: 'in_progress', hours: 16, completion: 75 },
      { area: 'Controls Testing', status: 'planned', hours: 32, completion: 0 },
      { area: 'Substantive Testing', status: 'planned', hours: 48, completion: 0 }
    ]
  }
]

const riskAreas = [
  {
    id: 'risk_001',
    category: 'Revenue Recognition',
    risk_level: 'high',
    inherent_risk: 'high',
    control_risk: 'moderate',
    detection_risk: 'low',
    planned_procedures: 8,
    estimated_hours: 45,
    assigned_to: 'Senior Team',
    status: 'planned'
  },
  {
    id: 'risk_002', 
    category: 'Management Override',
    risk_level: 'high',
    inherent_risk: 'high',
    control_risk: 'high',
    detection_risk: 'low',
    planned_procedures: 12,
    estimated_hours: 32,
    assigned_to: 'Partner Review',
    status: 'planning'
  },
  {
    id: 'risk_003',
    category: 'IT General Controls',
    risk_level: 'moderate',
    inherent_risk: 'moderate', 
    control_risk: 'moderate',
    detection_risk: 'moderate',
    planned_procedures: 6,
    estimated_hours: 28,
    assigned_to: 'IT Specialist',
    status: 'planned'
  }
]

const planningMilestones = [
  { phase: 'Client Acceptance', date: '2025-01-15', status: 'completed', responsible: 'Partner' },
  { phase: 'Planning Memorandum', date: '2025-02-01', status: 'in_progress', responsible: 'Manager' },
  { phase: 'Risk Assessment', date: '2025-02-15', status: 'planned', responsible: 'Senior' },
  { phase: 'Audit Program', date: '2025-02-28', status: 'planned', responsible: 'Manager' },
  { phase: 'Team Briefing', date: '2025-03-05', status: 'planned', responsible: 'Partner' }
]

export default function AuditPlanningPage() {
  const [selectedEngagement, setSelectedEngagement] = useState(auditEngagements[0])
  const [activeTab, setActiveTab] = useState('overview')
  const [planningProgress, setPlanningProgress] = useState(45)

  const getRiskColor = (level: string) => {
    switch(level) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200' 
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'completed': return <CheckSquare className="h-4 w-4 text-green-600" />
      case 'in_progress': return <Activity className="h-4 w-4 text-blue-600" />
      case 'planned': return <Clock className="h-4 w-4 text-gray-600" />
      case 'planning': return <Settings className="h-4 w-4 text-orange-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Professional Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                <Target className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Audit Planning</h1>
                <p className="text-gray-600">Professional audit planning and risk assessment</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant="outline" className="px-3 py-1">
                <Globe className="h-3 w-3 mr-1" />
                GSPU Standards
              </Badge>
              <Badge variant="outline" className="px-3 py-1">
                <Shield className="h-3 w-3 mr-1" />
                ISA Compliant
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Engagement Summary Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-slate-900 to-slate-700 text-white">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <div className="flex items-center space-x-3 mb-4">
                  <Building2 className="h-6 w-6" />
                  <h2 className="text-2xl font-bold">{selectedEngagement.client_name}</h2>
                  <Badge className="bg-white/20 text-white hover:bg-white/30">
                    {selectedEngagement.client_code}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-white/70">Engagement Partner</p>
                    <p className="font-semibold">{selectedEngagement.engagement_partner}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Audit Manager</p>
                    <p className="font-semibold">{selectedEngagement.audit_manager}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Year End</p>
                    <p className="font-semibold">{selectedEngagement.year_end}</p>
                  </div>
                  <div>
                    <p className="text-white/70">Industry</p>
                    <p className="font-semibold">{selectedEngagement.industry}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-white/70 text-sm mb-1">Planning Progress</p>
                  <div className="text-3xl font-bold mb-2">{planningProgress}%</div>
                  <Progress value={planningProgress} className="h-2 bg-white/20" />
                </div>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">${(selectedEngagement.budget / 1000).toFixed(0)}K</p>
                    <p className="text-white/70 text-xs">Budget</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{selectedEngagement.planned_hours}h</p>
                    <p className="text-white/70 text-xs">Planned Hours</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-blue-100 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${(selectedEngagement.materiality / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-gray-600">Overall Materiality</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${(selectedEngagement.performance_materiality / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-gray-600">Performance Materiality</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${(selectedEngagement.trivial_threshold / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-gray-600">Trivial Threshold</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6 text-center">
              <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${(selectedEngagement.revenue / 1000000).toFixed(1)}M
              </p>
              <p className="text-sm text-gray-600">Client Revenue</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Planning Interface */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="risk-assessment" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Risk Assessment
            </TabsTrigger>
            <TabsTrigger value="planning-areas" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              Planning Areas
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="team" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Planning Progress by Area
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {selectedEngagement.planning_areas.map((area, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(area.status)}
                          <span className="font-medium">{area.area}</span>
                        </div>
                        <Badge variant="outline">{area.hours}h</Badge>
                      </div>
                      <Progress value={area.completion} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{area.status.replace('_', ' ').toUpperCase()}</span>
                        <span>{area.completion}% complete</span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="h-5 w-5" />
                    Materiality Calculation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-2">Calculation Basis</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>Total Revenue:</span>
                        <span className="font-medium">${selectedEngagement.revenue.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Materiality %:</span>
                        <span className="font-medium">1.0%</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between font-semibold">
                        <span>Overall Materiality:</span>
                        <span>${selectedEngagement.materiality.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Performance Materiality (75%)</span>
                      <span className="font-medium">${selectedEngagement.performance_materiality.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Trivial Threshold (5%)</span>
                      <span className="font-medium">${selectedEngagement.trivial_threshold.toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Risk Assessment Tab */}
          <TabsContent value="risk-assessment" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Significant Risk Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {riskAreas.map((risk, index) => (
                    <Card key={index} className="border-l-4 border-l-red-500">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                          <div className="lg:col-span-2">
                            <h4 className="font-semibold text-lg mb-2">{risk.category}</h4>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getRiskColor(risk.risk_level)}>
                                {risk.risk_level.toUpperCase()} RISK
                              </Badge>
                              {getStatusIcon(risk.status)}
                              <span className="text-sm text-gray-600">{risk.status.replace('_', ' ')}</span>
                            </div>
                            <p className="text-sm text-gray-600">
                              {risk.planned_procedures} planned procedures • {risk.estimated_hours} hours
                            </p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="text-xs">
                              <span className="text-gray-500">Inherent Risk:</span>
                              <Badge size="sm" className={`ml-2 ${getRiskColor(risk.inherent_risk)}`}>
                                {risk.inherent_risk}
                              </Badge>
                            </div>
                            <div className="text-xs">
                              <span className="text-gray-500">Control Risk:</span>
                              <Badge size="sm" className={`ml-2 ${getRiskColor(risk.control_risk)}`}>
                                {risk.control_risk}
                              </Badge>
                            </div>
                            <div className="text-xs">
                              <span className="text-gray-500">Detection Risk:</span>
                              <Badge size="sm" className={`ml-2 ${getRiskColor(risk.detection_risk)}`}>
                                {risk.detection_risk}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className="text-sm text-gray-600 mb-1">Assigned to</p>
                            <p className="font-semibold">{risk.assigned_to}</p>
                            <Button size="sm" variant="outline" className="mt-2">
                              <Eye className="h-3 w-3 mr-1" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Planning Areas Tab */}
          <TabsContent value="planning-areas" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {selectedEngagement.planning_areas.map((area, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(area.status)}
                        {area.area}
                      </div>
                      <Badge variant="outline">{area.hours}h</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm text-gray-600">Progress</span>
                          <span className="text-sm font-medium">{area.completion}%</span>
                        </div>
                        <Progress value={area.completion} className="h-3" />
                      </div>
                      
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <span className="font-medium capitalize">{area.status.replace('_', ' ')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estimated Hours:</span>
                          <span className="font-medium">{area.hours} hours</span>
                        </div>
                      </div>
                      
                      <Button className="w-full" variant="outline">
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Open Work Program
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Planning Milestones
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {planningMilestones.map((milestone, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {getStatusIcon(milestone.status)}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{milestone.phase}</h4>
                        <p className="text-sm text-gray-600">
                          Due: {milestone.date} • Responsible: {milestone.responsible}
                        </p>
                      </div>
                      <Badge 
                        variant={
                          milestone.status === 'completed' ? 'default' : 
                          milestone.status === 'in_progress' ? 'secondary' : 'outline'
                        }
                      >
                        {milestone.status.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Engagement Team
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarFallback>MH</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">Michael Harrison</h4>
                      <p className="text-sm text-gray-600">Engagement Partner • CPA</p>
                    </div>
                    <Badge>Partner</Badge>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Avatar>
                      <AvatarFallback>SC</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-semibold">Sarah Chen</h4>
                      <p className="text-sm text-gray-600">Audit Manager • CA</p>
                    </div>
                    <Badge variant="secondary">Manager</Badge>
                  </div>
                  
                  <Button className="w-full" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Resource Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Partner Hours</span>
                      <span className="font-medium">45h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Manager Hours</span>
                      <span className="font-medium">120h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Senior Hours</span>
                      <span className="font-medium">200h</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Staff Hours</span>
                      <span className="font-medium">215h</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Total Hours</span>
                      <span>{selectedEngagement.planned_hours}h</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex justify-between items-center bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="outline" asChild>
              <Link href="/audit-progressive">
                <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
                Back to Audit Hub
              </Link>
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              Export Planning Memo
            </Button>
            <Button className="bg-slate-900 hover:bg-slate-800">
              <CheckSquare className="h-4 w-4 mr-2" />
              Approve Planning
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}