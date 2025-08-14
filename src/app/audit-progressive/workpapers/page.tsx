'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  FileText, 
  Folder,
  Search,
  Filter,
  Download,
  Share2,
  Eye,
  Edit3,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Calendar,
  MoreHorizontal,
  ArrowLeft,
  Upload,
  Star,
  Lock,
  Unlock,
  MessageSquare,
  History,
  Target
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'

// Steve Jobs principle: Focus on what auditors actually need
interface WorkPaper {
  id: string
  name: string
  section: string
  type: string
  status: 'draft' | 'in_review' | 'reviewed' | 'approved' | 'requires_update'
  owner: string
  reviewer?: string
  last_modified: string
  size: string
  comments: number
  locked: boolean
  starred: boolean
  client: string
  engagement_year: string
}

const WORKPAPER_SECTIONS = {
  planning: { label: 'Planning', color: 'bg-blue-500', icon: Target },
  risk: { label: 'Risk Assessment', color: 'bg-orange-500', icon: AlertCircle },
  controls: { label: 'Controls Testing', color: 'bg-purple-500', icon: Lock },
  substantive: { label: 'Substantive Testing', color: 'bg-green-500', icon: CheckCircle2 },
  completion: { label: 'Completion', color: 'bg-gray-500', icon: FileText },
  review: { label: 'Review', color: 'bg-indigo-500', icon: Eye }
}

const WORKPAPER_TYPES = {
  memo: { label: 'Audit Memo', icon: FileText },
  schedule: { label: 'Schedule', icon: FileText },
  lead_sheet: { label: 'Lead Sheet', icon: FileText },
  test: { label: 'Test of Controls', icon: CheckCircle2 },
  analytical: { label: 'Analytical Review', icon: Target },
  confirmation: { label: 'Confirmation', icon: MessageSquare }
}

export default function WorkPapersPage() {
  const router = useRouter()
  const [workpapers, setWorkpapers] = useState<WorkPaper[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSection, setSelectedSection] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadWorkpapers()
  }, [])

  const loadWorkpapers = async () => {
    // Mock data - Cyprus Trading Ltd workpapers
    const mockWorkpapers: WorkPaper[] = [
      {
        id: 'wp_001',
        name: 'Planning Memorandum',
        section: 'planning',
        type: 'memo',
        status: 'approved',
        owner: 'Sarah Johnson',
        reviewer: 'John Smith',
        last_modified: '2025-01-15',
        size: '2.4 MB',
        comments: 3,
        locked: true,
        starred: true,
        client: 'Cyprus Trading Ltd',
        engagement_year: '2025'
      },
      {
        id: 'wp_002',
        name: 'Revenue Cycle Testing',
        section: 'substantive',
        type: 'test',
        status: 'in_review',
        owner: 'Michael Chen',
        reviewer: 'Sarah Johnson',
        last_modified: '2025-02-01',
        size: '5.7 MB',
        comments: 7,
        locked: false,
        starred: false,
        client: 'Cyprus Trading Ltd',
        engagement_year: '2025'
      },
      {
        id: 'wp_003',
        name: 'Cash and Bank Confirmations',
        section: 'substantive',
        type: 'confirmation',
        status: 'requires_update',
        owner: 'Emily Davis',
        reviewer: 'Sarah Johnson',
        last_modified: '2025-01-28',
        size: '1.2 MB',
        comments: 12,
        locked: false,
        starred: true,
        client: 'Cyprus Trading Ltd',
        engagement_year: '2025'
      },
      {
        id: 'wp_004',
        name: 'Inventory Count Procedures',
        section: 'controls',
        type: 'test',
        status: 'draft',
        owner: 'David Wilson',
        last_modified: '2025-02-03',
        size: '890 KB',
        comments: 2,
        locked: false,
        starred: false,
        client: 'Cyprus Trading Ltd',
        engagement_year: '2025'
      },
      {
        id: 'wp_005',
        name: 'Risk Assessment Matrix',
        section: 'risk',
        type: 'schedule',
        status: 'reviewed',
        owner: 'Sarah Johnson',
        reviewer: 'John Smith',
        last_modified: '2025-01-20',
        size: '3.1 MB',
        comments: 5,
        locked: true,
        starred: true,
        client: 'Cyprus Trading Ltd',
        engagement_year: '2025'
      }
    ]
    
    setWorkpapers(mockWorkpapers)
    setIsLoading(false)
  }

  // Filter workpapers
  const filteredWorkpapers = workpapers.filter(wp => {
    const matchesSearch = wp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         wp.owner.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSection = selectedSection === 'all' || wp.section === selectedSection
    const matchesStatus = selectedStatus === 'all' || wp.status === selectedStatus
    return matchesSearch && matchesSection && matchesStatus
  })

  // Calculate stats
  const stats = {
    total: workpapers.length,
    draft: workpapers.filter(wp => wp.status === 'draft').length,
    in_review: workpapers.filter(wp => wp.status === 'in_review').length,
    requires_update: workpapers.filter(wp => wp.status === 'requires_update').length,
    completed: workpapers.filter(wp => wp.status === 'approved' || wp.status === 'reviewed').length
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return <Edit3 className="w-3 h-3" />
      case 'in_review': return <Eye className="w-3 h-3" />
      case 'reviewed': return <CheckCircle2 className="w-3 h-3" />
      case 'approved': return <CheckCircle2 className="w-3 h-3" />
      case 'requires_update': return <AlertCircle className="w-3 h-3" />
      default: return <Clock className="w-3 h-3" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Ultra Clean */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/audit-progressive')}
                className="text-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <div>
                <h1 className="text-2xl font-semibold">Working Papers</h1>
                <p className="text-sm text-gray-600">Cyprus Trading Ltd • FY 2025</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-1" />
                Export All
              </Button>
              <Button size="sm" className="bg-black text-white hover:bg-gray-800">
                <Plus className="w-4 h-4 mr-1" />
                New Workpaper
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-5 gap-4">
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-gray-600 mt-1">Total Papers</div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">{stats.draft}</div>
              <div className="text-sm text-gray-600 mt-1">Draft</div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.in_review}</div>
              <div className="text-sm text-gray-600 mt-1">In Review</div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.requires_update}</div>
              <div className="text-sm text-gray-600 mt-1">Updates Needed</div>
            </div>
          </Card>
          <Card className="p-4 border-0 shadow-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              <div className="text-sm text-gray-600 mt-1">Completed</div>
            </div>
          </Card>
        </div>
      </div>

      {/* Filters - Minimal and Powerful */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search workpapers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-gray-200"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            >
              <option value="all">All Sections</option>
              {Object.entries(WORKPAPER_SECTIONS).map(([key, section]) => (
                <option key={key} value={key}>{section.label}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="reviewed">Reviewed</option>
              <option value="approved">Approved</option>
              <option value="requires_update">Requires Update</option>
            </select>
            
            <div className="flex border border-gray-200 rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                List
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Workpapers Grid/List */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="p-6 border-0 shadow-sm">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              </Card>
            ))}
          </div>
        ) : filteredWorkpapers.length === 0 ? (
          <Card className="p-12 text-center border-0 shadow-sm">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No workpapers found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery || selectedSection !== 'all' || selectedStatus !== 'all' 
                ? 'Try adjusting your filters' 
                : 'Start by creating your first workpaper'}
            </p>
            <Button className="bg-black text-white hover:bg-gray-800">
              <Plus className="w-4 h-4 mr-2" />
              Create First Workpaper
            </Button>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkpapers.map((wp) => (
              <motion.div
                key={wp.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${WORKPAPER_SECTIONS[wp.section]?.color}`} />
                        <span className="text-xs text-gray-600 uppercase tracking-wide">
                          {WORKPAPER_SECTIONS[wp.section]?.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {wp.starred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        {wp.locked ? <Lock className="w-4 h-4 text-gray-400" /> : <Unlock className="w-4 h-4 text-gray-400" />}
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="text-lg leading-tight">{wp.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className={getStatusColor(wp.status)}>
                          {getStatusIcon(wp.status)}
                          <span className="ml-1 capitalize">{wp.status.replace('_', ' ')}</span>
                        </Badge>
                        <span className="text-sm text-gray-500">{wp.size}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{wp.owner}</span>
                        {wp.reviewer && (
                          <>
                            <span className="mx-1">•</span>
                            <span>Rev: {wp.reviewer}</span>
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          <span>{new Date(wp.last_modified).toLocaleDateString()}</span>
                        </div>
                        {wp.comments > 0 && (
                          <div className="flex items-center">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            <span>{wp.comments}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" disabled={wp.locked}>
                          <Edit3 className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <Card className="border-0 shadow-sm">
            <div className="divide-y">
              {filteredWorkpapers.map((wp) => (
                <div key={wp.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`w-3 h-3 rounded-full ${WORKPAPER_SECTIONS[wp.section]?.color}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{wp.name}</h3>
                          {wp.starred && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                          {wp.locked && <Lock className="w-4 h-4 text-gray-400" />}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          <span>{WORKPAPER_SECTIONS[wp.section]?.label}</span>
                          <span>•</span>
                          <span>{wp.owner}</span>
                          {wp.reviewer && (
                            <>
                              <span>•</span>
                              <span>Rev: {wp.reviewer}</span>
                            </>
                          )}
                          <span>•</span>
                          <span>{new Date(wp.last_modified).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(wp.status)}>
                        {getStatusIcon(wp.status)}
                        <span className="ml-1 capitalize">{wp.status.replace('_', ' ')}</span>
                      </Badge>
                      
                      {wp.comments > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          <span>{wp.comments}</span>
                        </div>
                      )}
                      
                      <span className="text-sm text-gray-500 min-w-[60px]">{wp.size}</span>
                      
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" disabled={wp.locked}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}