'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  Building2,
  FileText,
  Upload,
  Download,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Users,
  MessageSquare,
  Bell,
  LogOut,
  Shield,
  TrendingUp,
  FileCheck,
  Info,
  Send,
  Paperclip,
  ChevronRight,
  Eye
} from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { DocumentUploadModal } from '@/components/audit/client-portal/DocumentUploadModal'

interface ClientInfo {
  clientCode: string
  email: string
  company: string
  contactPerson: string
  auditYear: string
  organization_id: string
}

interface Document {
  id: string
  code: string
  name: string
  category: string
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected'
  dueDate: string
  submittedDate?: string
  notes?: string
  priority: 'high' | 'medium' | 'low'
}

export default function ClientPortalDashboard() {
  const router = useRouter()
  const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  // Mock data - in production, this would come from API
  const [auditProgress] = useState(35)
  const [documents] = useState<Document[]>([
    {
      id: 'doc_001',
      code: 'A.1',
      name: 'Commercial Registration Certificate',
      category: 'Company Formation',
      status: 'approved',
      dueDate: '2025-02-15',
      submittedDate: '2025-01-20',
      priority: 'high'
    },
    {
      id: 'doc_002',
      code: 'B.1',
      name: 'Audited Financial Statements 2024',
      category: 'Financial Statements',
      status: 'pending',
      dueDate: '2025-02-20',
      priority: 'high'
    },
    {
      id: 'doc_003',
      code: 'B.2',
      name: 'Management Accounts Dec 2024',
      category: 'Financial Statements',
      status: 'submitted',
      dueDate: '2025-02-20',
      submittedDate: '2025-02-01',
      priority: 'medium'
    },
    {
      id: 'doc_004',
      code: 'D.11',
      name: 'Bank Confirmations',
      category: 'Banking & Finance',
      status: 'under_review',
      dueDate: '2025-02-25',
      submittedDate: '2025-02-05',
      priority: 'high'
    },
    {
      id: 'doc_005',
      code: 'E.2',
      name: 'VAT Returns 2024',
      category: 'Compliance & Tax',
      status: 'rejected',
      dueDate: '2025-02-28',
      submittedDate: '2025-02-03',
      notes: 'Missing Q4 returns. Please resubmit with complete documentation.',
      priority: 'medium'
    }
  ])

  const [notifications] = useState([
    {
      id: 1,
      type: 'reminder',
      message: 'Financial statements due in 5 days',
      date: '2025-02-15',
      read: false
    },
    {
      id: 2,
      type: 'approval',
      message: 'Commercial registration certificate approved',
      date: '2025-01-20',
      read: true
    },
    {
      id: 3,
      type: 'request',
      message: 'Additional information requested for bank confirmations',
      date: '2025-02-05',
      read: false
    }
  ])

  useEffect(() => {
    // Set up demo client for public access
    const demoClient = {
      company: 'Cyprus Trading Ltd',
      contactPerson: 'Maria Georgiou',
      email: 'maria@cyprustrading.com',
      phone: '+357 22 123456',
      isClient: true,
      services: ['Statutory Audit', 'Tax Advisory'],
      status: 'Active Client',
      since: '2020',
      nextAudit: '2025-12-31',
      documents: [
        { name: 'Annual Returns 2024', status: 'submitted', date: '2024-03-15' },
        { name: 'VAT Returns Q1 2025', status: 'pending', date: '2025-04-30' },
        { name: 'Management Accounts', status: 'in_review', date: '2025-01-31' }
      ]
    }
    setClientInfo(demoClient)
    setIsLoading(false)
  }, [])

  const handleLogout = () => {
    // Demo logout - redirect to main dashboard
    router.push('/audit-progressive')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'submitted': return 'bg-blue-100 text-blue-800'
      case 'under_review': return 'bg-purple-100 text-purple-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-gray-600'
      default: return 'text-gray-600'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading client portal...</p>
        </div>
      </div>
    )
  }

  if (!clientInfo) {
    return null
  }

  const pendingDocs = documents.filter(d => d.status === 'pending').length
  const submittedDocs = documents.filter(d => d.status === 'submitted' || d.status === 'under_review').length
  const approvedDocs = documents.filter(d => d.status === 'approved').length
  const rejectedDocs = documents.filter(d => d.status === 'rejected').length
  const unreadNotifications = notifications.filter(n => !n.read).length

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-blue-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-emerald-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{clientInfo.company}</h1>
                <p className="text-sm text-gray-600">Client Code: {clientInfo.clientCode} • Audit Year: {clientInfo.auditYear}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Audit Progress</p>
                  <p className="text-2xl font-bold text-gray-900">{auditProgress}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500" />
              </div>
              <Progress value={auditProgress} className="h-2 mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{pendingDocs}</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Under Review</p>
                  <p className="text-2xl font-bold text-purple-600">{submittedDocs}</p>
                </div>
                <Eye className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved</p>
                  <p className="text-2xl font-bold text-green-600">{approvedDocs}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Action Required</p>
                  <p className="text-2xl font-bold text-red-600">{rejectedDocs}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Required Alert */}
        {rejectedDocs > 0 && (
          <Card className="border-l-4 border-l-red-500 bg-red-50 mb-6">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-medium text-red-900">Action Required</h3>
                  <p className="text-sm text-red-700 mt-1">
                    You have {rejectedDocs} document{rejectedDocs > 1 ? 's' : ''} that require resubmission. 
                    Please review the feedback and submit updated documents.
                  </p>
                </div>
                <Button size="sm" variant="outline" className="text-red-700 border-red-300">
                  View Documents
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="team">Audit Team</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Audit Information */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Audit Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Audit Type</p>
                      <p className="font-medium">Statutory Audit</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Financial Year End</p>
                      <p className="font-medium">December 31, 2024</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Audit Start Date</p>
                      <p className="font-medium">January 15, 2025</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Expected Completion</p>
                      <p className="font-medium">March 31, 2025</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Current Phase</p>
                      <p className="font-medium">Fieldwork - Document Collection</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Risk Assessment</p>
                      <Badge className="bg-yellow-100 text-yellow-800">Moderate Risk</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <div key={notif.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className={`w-2 h-2 rounded-full mt-2 ${notif.read ? 'bg-gray-400' : 'bg-blue-500'}`}></div>
                        <div className="flex-1">
                          <p className="text-sm text-gray-900">{notif.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notif.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Document Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Document Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <div>
                        <p className="font-medium text-gray-900">Pending Submission</p>
                        <p className="text-sm text-gray-600">{pendingDocs} documents awaiting upload</p>
                      </div>
                    </div>
                    <DocumentUploadModal
                      onUploadComplete={(data) => {
                        console.log('Documents uploaded:', data)
                        // Update document statuses
                      }}
                    >
                      <Button size="sm" variant="outline">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Documents
                      </Button>
                    </DocumentUploadModal>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Eye className="w-5 h-5 text-purple-600" />
                      <div>
                        <p className="font-medium text-gray-900">Under Review</p>
                        <p className="text-sm text-gray-600">{submittedDocs} documents being reviewed</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>

                  {rejectedDocs > 0 && (
                    <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-medium text-gray-900">Action Required</p>
                          <p className="text-sm text-gray-600">{rejectedDocs} documents need resubmission</p>
                        </div>
                      </div>
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        View & Resubmit
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Documents Tab */}
          <TabsContent value="documents" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Document Requisition List</CardTitle>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download List
                    </Button>
                    <DocumentUploadModal
                      onUploadComplete={(data) => {
                        console.log('Documents uploaded:', data)
                        // Update document statuses
                      }}
                    >
                      <Button size="sm">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Documents
                      </Button>
                    </DocumentUploadModal>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge variant="outline" className="text-xs">{doc.code}</Badge>
                            <h4 className="font-medium text-gray-900">{doc.name}</h4>
                            <Badge className={getStatusColor(doc.status)}>
                              {doc.status.replace('_', ' ')}
                            </Badge>
                            <span className={`text-xs ${getPriorityColor(doc.priority)}`}>
                              {doc.priority} priority
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>Category: {doc.category}</span>
                            <span>Due: {new Date(doc.dueDate).toLocaleDateString()}</span>
                            {doc.submittedDate && (
                              <span>Submitted: {new Date(doc.submittedDate).toLocaleDateString()}</span>
                            )}
                          </div>
                          {doc.notes && (
                            <div className="mt-2 p-3 bg-red-50 rounded-lg">
                              <p className="text-sm text-red-700">
                                <strong>Feedback:</strong> {doc.notes}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          {doc.status === 'approved' && (
                            <Button size="sm" variant="outline">
                              <Download className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          )}
                          {(doc.status === 'pending' || doc.status === 'rejected') && (
                            <DocumentUploadModal
                              documentId={doc.id}
                              documentName={doc.name}
                              documentCode={doc.code}
                              onUploadComplete={(data) => {
                                console.log('Document uploaded:', data)
                                // Here you would update the document status
                                // and refresh the documents list
                              }}
                            >
                              <Button size="sm">
                                <Upload className="w-3 h-3 mr-1" />
                                Upload
                              </Button>
                            </DocumentUploadModal>
                          )}
                          {(doc.status === 'submitted' || doc.status === 'under_review') && (
                            <Button size="sm" variant="outline" disabled>
                              <Clock className="w-3 h-3 mr-1" />
                              In Review
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Communication with Audit Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-blue-600">SJ</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-gray-100 rounded-lg p-4">
                        <p className="font-medium text-sm">Sarah Johnson (Audit Manager)</p>
                        <p className="text-sm text-gray-700 mt-1">
                          Good morning! We've received your bank confirmations and are currently reviewing them. 
                          We may need some additional information regarding the foreign currency accounts.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Yesterday at 2:30 PM</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-emerald-600">You</span>
                    </div>
                    <div className="flex-1">
                      <div className="bg-blue-50 rounded-lg p-4 ml-auto max-w-[80%]">
                        <p className="text-sm text-gray-700">
                          Thank you for the update. I'll prepare the foreign currency account details and 
                          send them over by end of day today.
                        </p>
                        <p className="text-xs text-gray-500 mt-2">Yesterday at 3:15 PM</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-end gap-2">
                      <input
                        type="text"
                        placeholder="Type your message..."
                        className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <Button size="sm" variant="ghost">
                        <Paperclip className="w-4 h-4" />
                      </Button>
                      <Button size="sm">
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Team Tab */}
          <TabsContent value="team" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Your Audit Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-purple-600">JS</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">John Smith</h4>
                        <p className="text-sm text-gray-600">Engagement Partner</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">Lead Partner</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">SJ</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Sarah Johnson</h4>
                        <p className="text-sm text-gray-600">Audit Manager</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">Primary Contact</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-green-600">MB</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Michael Brown</h4>
                        <p className="text-sm text-gray-600">Senior Auditor</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">Manufacturing Specialist</Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">ED</span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">Emily Davis</h4>
                        <p className="text-sm text-gray-600">Quality Reviewer</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">EQCR</Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-blue-900 font-medium">Contact Information</p>
                      <p className="text-sm text-blue-700 mt-1">
                        For urgent matters, please contact Sarah Johnson (Audit Manager) at 
                        sarah.johnson@gspu.com or call +973 1234 5679.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}