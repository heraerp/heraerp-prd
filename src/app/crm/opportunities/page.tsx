'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Target,
  Plus,
  Search,
  Filter,
  Calendar,
  DollarSign,
  Building2,
  User,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  GripVertical
} from 'lucide-react'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface Opportunity {
  id: string
  name: string
  account: string
  contact: string
  value: number
  stage: string
  closeDate: string
  probability: number
  owner: string
  description?: string
  nextStep?: string
  createdAt: string
}

interface Stage {
  name: string
  opportunities: Opportunity[]
  value: number
  count: number
  color: string
}

export default function OpportunitiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStage, setSelectedStage] = useState('all')
  const [draggedOpportunity, setDraggedOpportunity] = useState<Opportunity | null>(null)
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Sample opportunities data
  const [opportunities, setOpportunities] = useState<Opportunity[]>([
    {
      id: '1',
      name: 'Enterprise Broadband - Infosys',
      account: 'Infosys Ltd',
      contact: 'Rajesh Kumar',
      value: 8500000,
      stage: 'Negotiation',
      closeDate: '2024-06-30',
      probability: 80,
      owner: 'Amit Sharma',
      description: 'Large enterprise broadband deployment across 5 locations',
      nextStep: 'Final pricing approval',
      createdAt: '2024-05-15'
    },
    {
      id: '2',
      name: 'Cloud Connect - TCS',
      account: 'Tata Consultancy Services',
      contact: 'Priya Sharma',
      value: 6200000,
      stage: 'Proposal',
      closeDate: '2024-07-15',
      probability: 60,
      owner: 'Neha Patel',
      description: 'Direct cloud connectivity for their data centers',
      nextStep: 'Technical review meeting',
      createdAt: '2024-05-20'
    },
    {
      id: '3',
      name: 'SD-WAN Solution - Wipro',
      account: 'Wipro Limited',
      contact: 'Vikram Singh',
      value: 5400000,
      stage: 'Qualification',
      closeDate: '2024-07-31',
      probability: 40,
      owner: 'Rahul Verma',
      description: 'Complete SD-WAN transformation project',
      nextStep: 'Requirements gathering',
      createdAt: '2024-05-25'
    },
    {
      id: '4',
      name: 'Managed Services - HCL',
      account: 'HCL Technologies',
      contact: 'Anjali Gupta',
      value: 4800000,
      stage: 'Negotiation',
      closeDate: '2024-06-25',
      probability: 75,
      owner: 'Amit Sharma',
      description: '24x7 managed network services',
      nextStep: 'Contract finalization',
      createdAt: '2024-05-10'
    },
    {
      id: '5',
      name: 'MPLS Network - Cognizant',
      account: 'Cognizant',
      contact: 'Suresh Reddy',
      value: 7200000,
      stage: 'Prospecting',
      closeDate: '2024-08-30',
      probability: 20,
      owner: 'Neha Patel',
      description: 'Pan-India MPLS network upgrade',
      nextStep: 'Initial discovery call',
      createdAt: '2024-06-01'
    },
    {
      id: '6',
      name: 'Internet Leased Line - Mindtree',
      account: 'Mindtree',
      contact: 'Deepak Joshi',
      value: 3200000,
      stage: 'Proposal',
      closeDate: '2024-07-20',
      probability: 55,
      owner: 'Rahul Verma',
      description: 'High-speed internet connectivity',
      nextStep: 'Proposal presentation',
      createdAt: '2024-05-28'
    },
    {
      id: '7',
      name: 'Data Center Connect - Tech Mahindra',
      account: 'Tech Mahindra',
      contact: 'Ravi Krishnan',
      value: 3600000,
      stage: 'Closed Won',
      closeDate: '2024-06-10',
      probability: 100,
      owner: 'Amit Sharma',
      description: 'DC connectivity project completed',
      createdAt: '2024-04-15'
    },
    {
      id: '8',
      name: 'Voice Solutions - Mphasis',
      account: 'Mphasis',
      contact: 'Kavita Nair',
      value: 2800000,
      stage: 'Closed Lost',
      closeDate: '2024-06-05',
      probability: 0,
      owner: 'Neha Patel',
      description: 'Lost to competitor',
      createdAt: '2024-04-20'
    }
  ])

  const stageConfig = [
    { name: 'Prospecting', color: 'from-gray-500 to-gray-600' },
    { name: 'Qualification', color: 'from-blue-500 to-blue-600' },
    { name: 'Proposal', color: 'from-[#ec7f37] to-[#be4f0c]' },
    { name: 'Negotiation', color: 'from-[#FF5A09] to-[#ec7f37]' },
    { name: 'Closed Won', color: 'from-emerald-500 to-green-600' },
    { name: 'Closed Lost', color: 'from-red-500 to-rose-600' }
  ]

  const supabase = createClientComponentClient()

  // Group opportunities by stage
  const getStages = (): Stage[] => {
    return stageConfig.map(config => {
      const stageOpps = opportunities.filter(opp => opp.stage === config.name)
      return {
        name: config.name,
        opportunities: stageOpps,
        value: stageOpps.reduce((sum, opp) => sum + opp.value, 0),
        count: stageOpps.length,
        color: config.color
      }
    })
  }

  const handleDragStart = (e: React.DragEvent, opportunity: Opportunity) => {
    setDraggedOpportunity(opportunity)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedOpportunity(null)
    setDraggedOverStage(null)
  }

  const handleDragOver = (e: React.DragEvent, stageName: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDraggedOverStage(stageName)
  }

  const handleDragLeave = () => {
    setDraggedOverStage(null)
  }

  const handleDrop = (e: React.DragEvent, stageName: string) => {
    e.preventDefault()
    if (draggedOpportunity && draggedOpportunity.stage !== stageName) {
      // Update opportunity stage
      const updatedOpportunities = opportunities.map(opp => {
        if (opp.id === draggedOpportunity.id) {
          // Update probability based on stage
          let probability = opp.probability
          switch (stageName) {
            case 'Prospecting':
              probability = 20
              break
            case 'Qualification':
              probability = 40
              break
            case 'Proposal':
              probability = 60
              break
            case 'Negotiation':
              probability = 80
              break
            case 'Closed Won':
              probability = 100
              break
            case 'Closed Lost':
              probability = 0
              break
          }
          return { ...opp, stage: stageName, probability }
        }
        return opp
      })
      setOpportunities(updatedOpportunities)
    }
    setDraggedOverStage(null)
  }

  const stages = getStages()
  const totalPipeline = stages.reduce((sum, stage) => {
    if (stage.name !== 'Closed Won' && stage.name !== 'Closed Lost') {
      return sum + stage.value
    }
    return sum
  }, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Opportunities</h1>
          <p className="text-white/60 mt-1">Manage your sales pipeline and track deals</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all duration-300"
        >
          <Plus className="h-5 w-5" />
          <span>New Opportunity</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            placeholder="Search opportunities..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF5A09] transition-colors"
          />
        </div>
        <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
          <Filter className="h-5 w-5" />
          <span>Filter</span>
        </button>
      </div>

      {/* Pipeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="h-5 w-5 text-[#FF5A09]" />
              <span className="text-xs text-emerald-400 font-medium">+15.2%</span>
            </div>
            <p className="text-2xl font-bold text-white">
              ₹{(totalPipeline / 10000000).toFixed(2)} Cr
            </p>
            <p className="text-xs text-white/60 mt-1">Total Pipeline Value</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ec7f37]/50 to-[#be4f0c]/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="h-5 w-5 text-[#ec7f37]" />
              <span className="text-xs text-emerald-400 font-medium">+8.3%</span>
            </div>
            <p className="text-2xl font-bold text-white">₹9.4L</p>
            <p className="text-xs text-white/60 mt-1">Average Deal Size</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/50 to-green-600/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              <span className="text-xs text-emerald-400 font-medium">68%</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stages.find(s => s.name === 'Closed Won')?.count || 0}
            </p>
            <p className="text-xs text-white/60 mt-1">Won Deals (MTD)</p>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-red-500/50 to-rose-600/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-xs text-red-400 font-medium">32%</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {stages.find(s => s.name === 'Closed Lost')?.count || 0}
            </p>
            <p className="text-xs text-white/60 mt-1">Lost Deals (MTD)</p>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto pb-4">
        <div className="flex space-x-4 min-w-max">
          {stages.map(stage => (
            <div
              key={stage.name}
              className="w-80 flex-shrink-0"
              onDragOver={e => handleDragOver(e, stage.name)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, stage.name)}
            >
              {/* Stage Header */}
              <div className="relative group mb-4">
                <div
                  className={`absolute -inset-0.5 bg-gradient-to-r ${stage.color} rounded-xl blur opacity-20`}
                />
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-white mb-1">{stage.name}</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">{stage.count} deals</span>
                    <span className="text-sm font-medium text-white">
                      ₹{(stage.value / 10000000).toFixed(2)} Cr
                    </span>
                  </div>
                </div>
              </div>

              {/* Opportunities */}
              <div
                className={`space-y-3 min-h-[400px] p-2 rounded-xl transition-all duration-300 ${
                  draggedOverStage === stage.name
                    ? 'bg-white/5 border-2 border-dashed border-[#FF5A09]/50'
                    : ''
                }`}
              >
                {stage.opportunities.map(opportunity => (
                  <div
                    key={opportunity.id}
                    draggable
                    onDragStart={e => handleDragStart(e, opportunity)}
                    onDragEnd={handleDragEnd}
                    className={`relative group cursor-move transition-all duration-300 ${
                      draggedOpportunity?.id === opportunity.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/30 to-[#ec7f37]/30 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10">
                      {/* Drag Handle */}
                      <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <GripVertical className="h-4 w-4 text-white/40" />
                      </div>

                      <div className="pl-6">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="text-sm font-medium text-white line-clamp-2">
                            {opportunity.name}
                          </h4>
                          <button className="opacity-0 group-hover:opacity-100 transition-opacity text-white/40 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs text-white/60">
                            <Building2 className="h-3 w-3" />
                            <span className="line-clamp-1">{opportunity.account}</span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-white/60">
                            <User className="h-3 w-3" />
                            <span>{opportunity.contact}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-semibold text-[#FF5A09]">
                              ₹{(opportunity.value / 100000).toFixed(1)}L
                            </span>
                            <div className="flex items-center space-x-1">
                              <div className="w-12 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-full"
                                  style={{ width: `${opportunity.probability}%` }}
                                />
                              </div>
                              <span className="text-xs text-white/60">
                                {opportunity.probability}%
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center space-x-1 text-white/60">
                              <Calendar className="h-3 w-3" />
                              <span>{new Date(opportunity.closeDate).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-white/60">
                              <Clock className="h-3 w-3" />
                              <span>
                                {Math.ceil(
                                  (new Date(opportunity.closeDate).getTime() -
                                    new Date().getTime()) /
                                    (1000 * 60 * 60 * 24)
                                )}
                                d
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center justify-center space-x-8 text-sm text-white/60">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#FF5A09] to-[#ec7f37]" />
          <span>
            Active Deals:{' '}
            {opportunities.filter(o => !['Closed Won', 'Closed Lost'].includes(o.stage)).length}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Won Rate: 68%</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span>Avg Sales Cycle: 45 days</span>
        </div>
      </div>
    </div>
  )
}
