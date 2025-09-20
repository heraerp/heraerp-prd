'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Building2,
  UserCheck,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  DollarSign,
  Users,
  Briefcase,
  Calendar,
  TrendingUp,
  AlertCircle,
  Save,
  Edit,
  Plus
} from 'lucide-react'
import type { AuditClient } from '@/types/audit.types'

interface ClientProfileProps {
  clientId?: string
  mode?: 'view' | 'edit' | 'create'
}

export function ClientProfile({ clientId, mode = 'view' }: ClientProfileProps) {
  const [editMode, setEditMode] = useState(mode === 'create')
  const [client, setClient] = useState<Partial<AuditClient>>({
    entity_name: '',
    entity_code: '',
    status: 'prospective',
    metadata: {
      client_type: 'private',
      risk_rating: 'moderate',
      industry_code: '',
      annual_revenue: 0,
      total_assets: 0,
      public_interest_entity: false,
      audit_history: []
    }
  })

  const [independenceChecks, setIndependenceChecks] = useState({
    partners_id: '',
    sijilat_verification: 'pending',
    credit_rating: '',
    aml_risk_score: 0,
    zigram_assessment: {
      score: 0,
      factors: [],
      date: new Date().toISOString()
    },
    independence_confirmed: false,
    conflict_check_completed: false,
    compliance_approved: false
  })

  const handleSave = async () => {
    // Save client profile
    console.log('Saving client profile:', client)
    setEditMode(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
            <Building2 className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-100">
              {mode === 'create' ? 'New Client Engagement' : client.entity_name || 'Client Profile'}
            </h2>
            <p className="text-muted-foreground">
              {mode === 'create'
                ? 'Complete client acceptance process'
                : 'Manage client information and compliance'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {mode !== 'create' && (
            <Button variant="outline" onClick={() => setEditMode(!editMode)}>
              <Pencil className="w-4 h-4 mr-2" />
              {editMode ? 'Cancel' : 'Edit'}
            </Button>
          )}
          {editMode && (
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Client
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Information</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="independence">Independence</TabsTrigger>
          <TabsTrigger value="history">Audit History</TabsTrigger>
          <TabsTrigger value="team">Team Assignment</TabsTrigger>
        </TabsList>

        {/* Basic Information Tab */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="entity_name">Client Name *</Label>
                  <Input
                    id="entity_name"
                    value={client.entity_name}
                    onChange={e => setClient({ ...client, entity_name: e.target.value })}
                    disabled={!editMode}
                    placeholder="Enter client name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="entity_code">Client Code *</Label>
                  <Input
                    id="entity_code"
                    value={client.entity_code}
                    onChange={e => setClient({ ...client, entity_code: e.target.value })}
                    disabled={!editMode}
                    placeholder="e.g., CLI-2025-001"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_type">Client Type *</Label>
                  <Select
                    value={(client.metadata as any)?.client_type}
                    onValueChange={value =>
                      setClient({
                        ...client,
                        metadata: { ...client.metadata!, client_type: value as any }
                      })
                    }
                    disabled={!editMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select client type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public Company</SelectItem>
                      <SelectItem value="private">Private Company</SelectItem>
                      <SelectItem value="non_profit">Non-Profit Organization</SelectItem>
                      <SelectItem value="government">Government Entity</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry_code">Industry</Label>
                  <Input
                    id="industry_code"
                    value={(client.metadata as any)?.industry_code}
                    onChange={e =>
                      setClient({
                        ...client,
                        metadata: { ...client.metadata!, industry_code: e.target.value }
                      })
                    }
                    disabled={!editMode}
                    placeholder="Industry classification"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="annual_revenue">Annual Revenue</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="annual_revenue"
                      type="number"
                      value={(client.metadata as any)?.annual_revenue}
                      onChange={e =>
                        setClient({
                          ...client,
                          metadata: {
                            ...client.metadata!,
                            annual_revenue: parseFloat(e.target.value)
                          }
                        })
                      }
                      disabled={!editMode}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="total_assets">Total Assets</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="total_assets"
                      type="number"
                      value={(client.metadata as any)?.total_assets}
                      onChange={e =>
                        setClient({
                          ...client,
                          metadata: {
                            ...client.metadata!,
                            total_assets: parseFloat(e.target.value)
                          }
                        })
                      }
                      disabled={!editMode}
                      className="pl-10"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={(client.metadata as any)?.public_interest_entity}
                    onChange={e =>
                      setClient({
                        ...client,
                        metadata: { ...client.metadata!, public_interest_entity: e.target.checked }
                      })
                    }
                    disabled={!editMode}
                    className="rounded border-border"
                  />
                  <span className="text-sm text-gray-700">Public Interest Entity (PIE)</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Risk Assessment Tab */}
        <TabsContent value="risk" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="risk_rating">Overall Risk Rating</Label>
                  <Select
                    value={(client.metadata as any)?.risk_rating}
                    onValueChange={value =>
                      setClient({
                        ...client,
                        metadata: { ...client.metadata!, risk_rating: value as any }
                      })
                    }
                    disabled={!editMode}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select risk rating" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low Risk</SelectItem>
                      <SelectItem value="moderate">Moderate Risk</SelectItem>
                      <SelectItem value="high">High Risk</SelectItem>
                      <SelectItem value="very_high">Very High Risk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credit_rating">Credit Rating</Label>
                  <Input
                    id="credit_rating"
                    value={independenceChecks.credit_rating}
                    onChange={e =>
                      setIndependenceChecks({
                        ...independenceChecks,
                        credit_rating: e.target.value
                      })
                    }
                    disabled={!editMode}
                    placeholder="e.g., A-, BBB+"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aml_risk_score">AML Risk Score (Zigram)</Label>
                  <Input
                    id="aml_risk_score"
                    type="number"
                    step="0.1"
                    min="0"
                    max="10"
                    value={independenceChecks.aml_risk_score}
                    onChange={e =>
                      setIndependenceChecks({
                        ...independenceChecks,
                        aml_risk_score: parseFloat(e.target.value)
                      })
                    }
                    disabled={!editMode}
                    placeholder="0.0 - 10.0"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previous_auditor">Previous Auditor</Label>
                  <Input
                    id="previous_auditor"
                    value={(client.metadata as any)?.previous_auditor}
                    onChange={e =>
                      setClient({
                        ...client,
                        metadata: { ...client.metadata!, previous_auditor: e.target.value }
                      })
                    }
                    disabled={!editMode}
                    placeholder="Name of previous audit firm"
                  />
                </div>
              </div>

              {/* Risk Factors */}
              <div className="space-y-2">
                <Label>Risk Factors</Label>
                <Textarea
                  placeholder="Document specific risk factors..."
                  disabled={!editMode}
                  rows={4}
                />
              </div>

              {/* Risk Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <Card
                  className={
                    (client.metadata as any)?.risk_rating === 'high' ||
                    (client.metadata as any)?.risk_rating === 'very_high'
                      ? 'border-red-200 bg-red-50'
                      : 'border-green-200 bg-green-50'
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">EQCR Required</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Based on risk assessment and PIE status
                        </p>
                      </div>
                      {(client.metadata as any)?.risk_rating === 'high' ||
                      (client.metadata as any)?.risk_rating === 'very_high' ||
                      (client.metadata as any)?.public_interest_entity ? (
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      ) : (
                        <CheckCircle2 className="w-6 h-6 text-green-500" />
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Materiality Planning</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Calculate based on revenue/assets
                        </p>
                      </div>
                      <TrendingUp className="w-6 h-6 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Independence Tab */}
        <TabsContent value="independence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Independence & Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="partners_id">Partners ID (Sijilat)</Label>
                  <Input
                    id="partners_id"
                    value={independenceChecks.partners_id}
                    onChange={e =>
                      setIndependenceChecks({
                        ...independenceChecks,
                        partners_id: e.target.value
                      })
                    }
                    disabled={!editMode}
                    placeholder="Enter partners ID"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sijilat_verification">Sijilat Verification Status</Label>
                  <Select
                    value={independenceChecks.sijilat_verification}
                    onValueChange={value =>
                      setIndependenceChecks({
                        ...independenceChecks,
                        sijilat_verification: value
                      })
                    }
                    disabled={!editMode}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Compliance Checklist */}
              <div className="space-y-3 pt-4">
                <h4 className="font-medium text-gray-100">Compliance Checklist</h4>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={independenceChecks.independence_confirmed}
                        onChange={e =>
                          setIndependenceChecks({
                            ...independenceChecks,
                            independence_confirmed: e.target.checked
                          })
                        }
                        disabled={!editMode}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-gray-700">Independence Confirmed</span>
                    </div>
                    {independenceChecks.independence_confirmed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </label>

                  <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={independenceChecks.conflict_check_completed}
                        onChange={e =>
                          setIndependenceChecks({
                            ...independenceChecks,
                            conflict_check_completed: e.target.checked
                          })
                        }
                        disabled={!editMode}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-gray-700">Conflict Check Completed</span>
                    </div>
                    {independenceChecks.conflict_check_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </label>

                  <label className="flex items-center justify-between p-3 bg-muted rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={independenceChecks.compliance_approved}
                        onChange={e =>
                          setIndependenceChecks({
                            ...independenceChecks,
                            compliance_approved: e.target.checked
                          })
                        }
                        disabled={!editMode}
                        className="rounded border-border"
                      />
                      <span className="text-sm text-gray-700">Compliance Officer Approval</span>
                    </div>
                    {independenceChecks.compliance_approved ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    )}
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Audit History
                </span>
                {editMode && (
                  <Button size="sm" variant="outline">
                    <Plus className="w-4 h-4 mr-1" />
                    Add Year
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(client.metadata as any)?.audit_history?.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No audit history recorded</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add previous audit information
                  </p>
                </div>
              ) : (
                <div className="space-y-3">{/* Audit history items would go here */}</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Assignment Tab */}
        <TabsContent value="team" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Audit Team Assignment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Engagement Partner</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="john_smith">John Smith, CPA</SelectItem>
                      <SelectItem value="michael_brown">Michael Brown, CPA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Audit Manager</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sarah_johnson">Sarah Johnson, CPA</SelectItem>
                      <SelectItem value="emily_davis">Emily Davis, CPA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>EQCR Partner</Label>
                  <Select
                    disabled={
                      !editMode ||
                      (!(client.metadata as any)?.public_interest_entity &&
                        (client.metadata as any)?.risk_rating !== 'high' &&
                        (client.metadata as any)?.risk_rating !== 'very_high')
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select EQCR partner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="david_lee">David Lee, CPA</SelectItem>
                      <SelectItem value="robert_chen">Robert Chen, CPA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Engagement Type</Label>
                  <Select disabled={!editMode}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="statutory">Statutory Audit</SelectItem>
                      <SelectItem value="voluntary">Voluntary Audit</SelectItem>
                      <SelectItem value="special">Special Purpose Audit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
