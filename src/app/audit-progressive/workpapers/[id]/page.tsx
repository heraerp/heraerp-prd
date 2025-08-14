'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  FileText,
  Download,
  Share2,
  Edit3,
  Eye,
  Lock,
  Unlock,
  MessageSquare,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Star,
  History,
  MoreHorizontal,
  Send,
  Paperclip,
  Flag
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'

interface WorkPaper {
  id: string
  name: string
  section: string
  type: string
  status: 'draft' | 'in_review' | 'reviewed' | 'approved' | 'requires_update'
  owner: string
  reviewer?: string
  created_date: string
  last_modified: string
  size: string
  comments: Comment[]
  locked: boolean
  starred: boolean
  client: string
  engagement_year: string
  version: string
  content: string
}

interface Comment {
  id: string
  author: string
  text: string
  timestamp: string
  resolved: boolean
  type: 'comment' | 'review_note' | 'change_request'
}

interface VersionHistory {
  version: string
  date: string
  author: string
  changes: string
  size: string
}

export default function WorkPaperDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [workpaper, setWorkpaper] = useState<WorkPaper | null>(null)
  const [activeTab, setActiveTab] = useState('content')
  const [newComment, setNewComment] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWorkpaper()
  }, [params.id])

  const loadWorkpaper = async () => {
    // Mock workpaper data - Cyprus Trading Ltd Revenue Testing
    const mockWorkpaper: WorkPaper = {
      id: params.id as string,
      name: 'Revenue Cycle Testing',
      section: 'substantive',
      type: 'test',
      status: 'in_review',
      owner: 'Michael Chen',
      reviewer: 'Sarah Johnson',
      created_date: '2025-01-15',
      last_modified: '2025-02-01',
      size: '5.7 MB',
      locked: false,
      starred: false,
      client: 'Cyprus Trading Ltd',
      engagement_year: '2025',
      version: '2.1',
      content: `# Revenue Cycle Testing - Cyprus Trading Ltd

## Objective
To test the effectiveness of controls over revenue recognition and ensure revenue transactions are properly recorded in accordance with IFRS 15.

## Scope
- All revenue transactions for the period January 1, 2024 to December 31, 2024
- Focus on high-value transactions (>€50,000)
- Sample size: 45 transactions representing 75% of total revenue

## Key Controls Tested

### 1. Sales Order Approval
- **Control**: All sales orders require approval by authorized personnel
- **Test Performed**: Selected 45 sales orders and verified approval signatures
- **Results**: 43/45 properly approved (95.6% effectiveness)
- **Exceptions**: 2 orders lacked proper approval documentation

### 2. Revenue Recognition Timing
- **Control**: Revenue is recognized upon delivery of goods/services
- **Test Performed**: Traced delivery confirmations to revenue recognition dates
- **Results**: All 45 transactions properly timed
- **Conclusion**: Control operating effectively

### 3. Credit Approval Process
- **Control**: Credit checks performed for new customers >€25,000
- **Test Performed**: Reviewed credit files for 12 new customers
- **Results**: 11/12 had adequate credit documentation
- **Exception**: Kyrios Shipping Ltd - missing credit approval

## Analytical Procedures

### Monthly Revenue Trend Analysis
- Q1 2024: €2.3M (expected €2.1M) - Variance: +9.5%
- Q2 2024: €2.8M (expected €2.6M) - Variance: +7.7%
- Q3 2024: €3.1M (expected €2.9M) - Variance: +6.9%
- Q4 2024: €2.9M (expected €3.2M) - Variance: -9.4%

**Investigation Required**: Q4 variance exceeds 5% threshold

## Sample Testing Results

| Transaction | Amount (€) | Customer | Date | Result |
|-------------|-----------|----------|------|---------|
| INV-2024-001 | 125,000 | Mediterra Shipping | 15-Jan | ✓ |
| INV-2024-015 | 89,500 | Cyprus Hotels Ltd | 28-Jan | ✓ |
| INV-2024-032 | 156,750 | Limassol Trading | 12-Feb | Exception* |
| ... | ... | ... | ... | ... |

*Exception: Invoice dated 12-Feb but goods delivered 18-Feb

## Conclusions and Recommendations

### Strengths
1. Strong approval controls with 95.6% effectiveness
2. Accurate revenue timing controls
3. Robust analytical review procedures

### Areas for Improvement
1. **High Priority**: Strengthen credit approval process
2. **Medium Priority**: Address Q4 revenue variance
3. **Low Priority**: Improve documentation for sales approvals

### Management Response Required
- Action plan for credit approval enhancement
- Explanation for Q4 revenue decline
- Timeline for implementing improvements

## Next Steps
1. Discuss findings with Cyprus Trading management
2. Obtain management responses by February 15, 2025
3. Complete follow-up testing if required
4. Document final conclusions

---
*Prepared by: Michael Chen, Senior Auditor*
*Reviewed by: Sarah Johnson, Audit Manager*
*Date: February 1, 2025*`,
      comments: [
        {
          id: 'c1',
          author: 'Sarah Johnson',
          text: 'Excellent work on the revenue testing. The analytical procedures clearly identify the Q4 variance that needs investigation. Please follow up with management on the credit approval process.',
          timestamp: '2025-02-02T09:15:00Z',
          resolved: false,
          type: 'review_note'
        },
        {
          id: 'c2',
          author: 'John Smith',
          text: 'The sample size looks appropriate. Can you also test the cutoff procedures around year-end to ensure no revenue is recorded in the wrong period?',
          timestamp: '2025-02-01T14:30:00Z',
          resolved: true,
          type: 'comment'
        },
        {
          id: 'c3',
          author: 'Michael Chen',
          text: 'Good point on cutoff testing. I\'ve added that to our procedures for next week. Will also schedule meeting with Cyprus Trading CFO regarding the credit approval issues.',
          timestamp: '2025-02-02T11:20:00Z',
          resolved: false,
          type: 'comment'
        }
      ]
    }
    
    setWorkpaper(mockWorkpaper)
    setIsLoading(false)
  }

  const handleAddComment = () => {
    if (!newComment.trim() || !workpaper) return
    
    const comment: Comment = {
      id: `c${Date.now()}`,
      author: 'Current User',
      text: newComment,
      timestamp: new Date().toISOString(),
      resolved: false,
      type: 'comment'
    }
    
    setWorkpaper({
      ...workpaper,
      comments: [...workpaper.comments, comment]
    })
    
    setNewComment('')
    toast.success('Comment added successfully')
  }

  const toggleStar = () => {
    if (!workpaper) return
    setWorkpaper({ ...workpaper, starred: !workpaper.starred })
    toast.success(workpaper.starred ? 'Removed from favorites' : 'Added to favorites')
  }

  const toggleLock = () => {
    if (!workpaper) return
    setWorkpaper({ ...workpaper, locked: !workpaper.locked })
    toast.success(workpaper.locked ? 'Workpaper unlocked' : 'Workpaper locked')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading workpaper...</p>
        </div>
      </div>
    )
  }

  if (!workpaper) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Workpaper not found</h3>
          <Button onClick={() => router.push('/audit-progressive/workpapers')}>
            Back to Working Papers
          </Button>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'in_review': return 'bg-blue-100 text-blue-800'
      case 'reviewed': return 'bg-green-100 text-green-800'
      case 'approved': return 'bg-emerald-100 text-emerald-800'
      case 'requires_update': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const versionHistory: VersionHistory[] = [
    { version: '2.1', date: '2025-02-01', author: 'Michael Chen', changes: 'Added analytical procedures and Q4 variance analysis', size: '5.7 MB' },
    { version: '2.0', date: '2025-01-28', author: 'Michael Chen', changes: 'Completed control testing section', size: '4.9 MB' },
    { version: '1.5', date: '2025-01-22', author: 'Michael Chen', changes: 'Updated sample selection methodology', size: '3.2 MB' },
    { version: '1.0', date: '2025-01-15', author: 'Michael Chen', changes: 'Initial draft with testing scope', size: '2.1 MB' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/audit-progressive/workpapers')}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-semibold">{workpaper.name}</h1>
                  <Badge className={getStatusColor(workpaper.status)}>
                    {workpaper.status.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {workpaper.client} • FY {workpaper.engagement_year} • v{workpaper.version}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleStar}
                className={workpaper.starred ? 'text-yellow-600 border-yellow-200' : ''}
              >
                <Star className={`w-4 h-4 mr-1 ${workpaper.starred ? 'fill-current' : ''}`} />
                {workpaper.starred ? 'Starred' : 'Star'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleLock}
                className={workpaper.locked ? 'text-red-600 border-red-200' : ''}
              >
                {workpaper.locked ? <Lock className="w-4 h-4 mr-1" /> : <Unlock className="w-4 h-4 mr-1" />}
                {workpaper.locked ? 'Locked' : 'Lock'}
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Download
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
              <Button size="sm" className="bg-black text-white hover:bg-gray-800" disabled={workpaper.locked}>
                <Edit3 className="w-4 h-4 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="comments">
                  Comments ({workpaper.comments.length})
                </TabsTrigger>
                <TabsTrigger value="history">Version History</TabsTrigger>
              </TabsList>

              <TabsContent value="content">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-8">
                    <div className="prose max-w-none">
                      <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                        {workpaper.content}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="comments">
                <div className="space-y-4">
                  {/* Add Comment */}
                  <Card className="border-0 shadow-sm">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Add a comment or review note..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={3}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              <Paperclip className="w-4 h-4 mr-1" />
                              Attach
                            </Button>
                            <Button variant="outline" size="sm">
                              <Flag className="w-4 h-4 mr-1" />
                              Flag
                            </Button>
                          </div>
                          <Button onClick={handleAddComment} disabled={!newComment.trim()}>
                            <Send className="w-4 h-4 mr-1" />
                            Add Comment
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Comments List */}
                  {workpaper.comments.map((comment) => (
                    <Card key={comment.id} className="border-0 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback>
                              {comment.author.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.author}</span>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs ${
                                  comment.type === 'review_note' ? 'bg-blue-100 text-blue-800' :
                                  comment.type === 'change_request' ? 'bg-orange-100 text-orange-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {comment.type.replace('_', ' ')}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {new Date(comment.timestamp).toLocaleString()}
                              </span>
                              {comment.resolved && (
                                <Badge variant="outline" className="text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Resolved
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-700">{comment.text}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button variant="ghost" size="sm" className="text-xs h-6">
                                Reply
                              </Button>
                              {!comment.resolved && (
                                <Button variant="ghost" size="sm" className="text-xs h-6">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Mark Resolved
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="history">
                <Card className="border-0 shadow-sm">
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {versionHistory.map((version) => (
                        <div key={version.version} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-blue-600">v{version.version}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">Version {version.version}</span>
                                  <span className="text-sm text-gray-500">•</span>
                                  <span className="text-sm text-gray-500">{version.author}</span>
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{version.changes}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-500">{new Date(version.date).toLocaleDateString()}</div>
                              <div className="text-xs text-gray-400">{version.size}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Workpaper Info */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Workpaper Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Owner</span>
                  <span className="font-medium">{workpaper.owner}</span>
                </div>
                {workpaper.reviewer && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reviewer</span>
                    <span className="font-medium">{workpaper.reviewer}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-medium">{new Date(workpaper.created_date).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Modified</span>
                  <span className="font-medium">{new Date(workpaper.last_modified).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Size</span>
                  <span className="font-medium">{workpaper.size}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Version</span>
                  <span className="font-medium">v{workpaper.version}</span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start" variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Eye className="w-4 h-4 mr-2" />
                  Print Preview
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <History className="w-4 h-4 mr-2" />
                  View All Versions
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="w-4 h-4 mr-2" />
                  Share with Team
                </Button>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">Sarah Johnson added review comments</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">Michael Chen updated content</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2" />
                  <div className="flex-1">
                    <p className="text-sm">John Smith requested changes</p>
                    <p className="text-xs text-gray-500">2 days ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}