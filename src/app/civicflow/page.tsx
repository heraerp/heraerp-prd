'use client'

import { useState } from 'react'
import { useOrgStore } from '@/state/org'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Users,
  Building2,
  Briefcase,
  DollarSign,
  FileText,
  MessageSquare,
  Activity,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react'

export default function CivicFlowPage() {
  const { currentOrgId } = useOrgStore()
  const [activeTab, setActiveTab] = useState('overview')

  const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'
  const isDemoMode = currentOrgId === DEMO_ORG_ID

  // Demo statistics (will be populated by seed data)
  const stats = {
    constituents: 100,
    organizations: 20,
    programs: 10,
    activeGrants: 20,
    openCases: 6,
    completedCases: 3
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-text-100">CivicFlow</h1>
        <p className="text-xl text-text-300">Public Sector CRM for Government Services</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <Card className="bg-panel border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-300">Constituents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-100">{stats.constituents}</span>
              <Users className="h-5 w-5 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-panel border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-300">Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-100">{stats.organizations}</span>
              <Building2 className="h-5 w-5 text-secondary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-panel border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-300">Programs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-100">{stats.programs}</span>
              <Briefcase className="h-5 w-5 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-panel border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-300">Active Grants</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-100">{stats.activeGrants}</span>
              <DollarSign className="h-5 w-5 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-panel border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-300">Open Cases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-100">{stats.openCases}</span>
              <Clock className="h-5 w-5 text-accent2" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-panel border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-text-300">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-text-100">{stats.completedCases}</span>
              <CheckCircle className="h-5 w-5 text-secondary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl bg-panel-alt border-border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="constituents">Constituents</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="cases">Cases</TabsTrigger>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card className="bg-panel border-border">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest updates from CivicFlow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Activity className="h-4 w-4 text-accent" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-100">New constituent intake</p>
                      <p className="text-xs text-text-500">Maria Garcia - 2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-4 w-4 text-secondary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-100">Grant approved</p>
                      <p className="text-xs text-text-500">Community Development - $250,000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-text-100">Outreach campaign sent</p>
                      <p className="text-xs text-text-500">Senior Services - 150 recipients</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Playbooks */}
            <Card className="bg-panel border-border">
              <CardHeader>
                <CardTitle>Active Playbooks</CardTitle>
                <CardDescription>Workflows currently in progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-100">Constituents Intake</p>
                      <p className="text-xs text-text-500">3 in progress</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-100">Services Eligibility</p>
                      <p className="text-xs text-text-500">2 in progress</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-100">Grants Processing</p>
                      <p className="text-xs text-text-500">1 in progress</p>
                    </div>
                    <Badge>Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="constituents">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Constituent Management</CardTitle>
              <CardDescription>Manage citizen profiles and services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-text-300">
                    {stats.constituents} constituents registered
                  </p>
                  <Button className="bg-accent hover:bg-accent/90 text-accent-fg">
                    <Users className="h-4 w-4 mr-2" />
                    New Constituent
                  </Button>
                </div>
                <div className="border-t border-border pt-4">
                  <p className="text-sm text-text-500">
                    Demo includes diverse constituent profiles with various eligibility flags for
                    programs including Medicaid, SNAP, Housing Assistance, and Veterans Benefits.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="programs">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Government Programs</CardTitle>
              <CardDescription>Active programs and grant rounds</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  'Healthcare Access Program',
                  'Housing First Initiative',
                  'Community Development Grants'
                ].map((program, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 border border-border rounded bg-panel-alt"
                  >
                    <div>
                      <p className="font-medium text-text-100">{program}</p>
                      <p className="text-sm text-text-500">Active grant rounds: 2</p>
                    </div>
                    <Badge variant="outline" className="border-accent text-accent">
                      Active
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cases">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Case Management</CardTitle>
              <CardDescription>Service requests and inquiries</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border border-border rounded bg-panel-alt">
                  <Clock className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text-100">{stats.openCases}</p>
                  <p className="text-sm text-text-300">Open Cases</p>
                </div>
                <div className="text-center p-4 border border-border rounded bg-panel-alt">
                  <Activity className="h-8 w-8 text-accent mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text-100">4.2</p>
                  <p className="text-sm text-text-300">Avg Days to Close</p>
                </div>
                <div className="text-center p-4 border border-border rounded bg-panel-alt">
                  <CheckCircle className="h-8 w-8 text-secondary mx-auto mb-2" />
                  <p className="text-2xl font-bold text-text-100">94%</p>
                  <p className="text-sm text-text-300">SLA Compliance</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playbooks">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Workflow Playbooks</CardTitle>
              <CardDescription>Automated processes for government services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Constituents Intake Process', steps: 5, runs: 15 },
                  { name: 'Services Eligibility Assessment', steps: 6, runs: 23 },
                  { name: 'Grants Intake and Processing', steps: 5, runs: 8 },
                  { name: 'Case Lifecycle Management', steps: 6, runs: 18 },
                  { name: 'Outreach Notification Campaign', steps: 5, runs: 12 }
                ].map((playbook, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 border border-border rounded hover:bg-panel-alt bg-panel"
                  >
                    <div>
                      <p className="font-medium text-text-100">{playbook.name}</p>
                      <p className="text-sm text-text-500">
                        {playbook.steps} steps • {playbook.runs} total runs
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-border hover:bg-accent-soft hover:text-accent"
                    >
                      View Details
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Demo Mode Notice */}
      {isDemoMode && (
        <Card className="mt-8 bg-accent-soft border-accent">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Activity className="h-5 w-5 text-accent" />
              <div>
                <p className="font-medium text-text-100">Demo Mode Active</p>
                <p className="text-sm text-text-300">
                  This is a demonstration environment with sample data. External communications are
                  disabled.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
