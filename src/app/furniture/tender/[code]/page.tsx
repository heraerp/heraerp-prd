'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  FileText,
  Download,
  Upload,
  DollarSign,
  Shield,
  Clock,
  MapPin,
  Truck,
  Users,
  AlertCircle,
  Calculator,
  Brain,
  Target,
  TrendingUp,
  Info,
  CheckCircle,
  XCircle
} from 'lucide-react'
import Link from 'next/link'
import { useFurnitureOrg } from '@/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import TenderWorkflowStatus from '@/components/furniture/tender/TenderWorkflowStatus'

export const dynamic = 'force-dynamic'

// Mock tender detail data
const mockTenderDetail = {
  code: 'KFD/2025/WOOD/001',
  title: 'Teak Wood Supply - Nilambur Range',
  department: 'Kerala Forest Department',
  publishDate: '2025-01-10',
  closingDate: '2025-01-25',
  status: 'active',
  daysLeft: 5,
  estimatedValue: '₹45,00,000',
  emdAmount: '₹90,000',
  tenderFee: '₹5,000',
  processingFee: '₹1,180',
  description: 'Supply of Teak wood logs from Nilambur Forest Range. The tender includes 15 lots of premium quality teak wood with specified dimensions and grading requirements.',
  location: 'Nilambur Forest Division, Malappuram District, Kerala',
  
  lots: [
    {
      id: 'LOT001',
      species: 'Teak',
      grade: 'A',
      volumeCbm: 25.5,
      reservePrice: '₹3,50,000',
      depot: 'Nilambur Main Depot',
      dimensions: '2-3m length, 45-60cm girth'
    },
    {
      id: 'LOT002',
      species: 'Teak',
      grade: 'B',
      volumeCbm: 18.2,
      reservePrice: '₹2,80,000',
      depot: 'Nilambur Main Depot',
      dimensions: '1.5-2m length, 35-45cm girth'
    },
    // ... more lots
  ],
  
  documents: [
    { name: 'Tender Notice', status: 'downloaded', date: '2025-01-10' },
    { name: 'Technical Specifications', status: 'downloaded', date: '2025-01-10' },
    { name: 'EMD Payment Receipt', status: 'uploaded', date: '2025-01-12' },
    { name: 'Technical Bid', status: 'pending', date: null },
    { name: 'Price Bid', status: 'pending', date: null }
  ],
  
  bidStrategy: {
    recommendation: 'aggressive',
    confidence: 78,
    suggestedMargin: '12-15%',
    riskLevel: 'medium',
    competitorCount: 5,
    historicalWinRate: '42%'
  },
  
  timeline: [
    { event: 'Tender Published', date: '2025-01-10', status: 'completed' },
    { event: 'Document Downloaded', date: '2025-01-10', status: 'completed' },
    { event: 'EMD Paid', date: '2025-01-12', status: 'completed' },
    { event: 'Technical Bid Submission', date: '2025-01-25', status: 'pending' },
    { event: 'Price Bid Opening', date: '2025-01-26', status: 'future' },
    { event: 'Award Decision', date: '2025-01-28', status: 'future' }
  ]
}

export default function TenderDetailPage() {
  const params = useParams()
  const tenderCode = params.code as string
  const { organizationId, orgLoading } = useFurnitureOrg()
  const [activeTab, setActiveTab] = useState('overview')

  if (orgLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400">Loading tender details...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="p-6 space-y-6">
        {/* Header */}
        <FurniturePageHeader
          title={mockTenderDetail.title}
          subtitle={`${mockTenderDetail.code} • ${mockTenderDetail.department}`}
          actions={
            <>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download All
              </Button>
              <Link href={`/furniture/tender/${params.code}/bid/new`}>
                <Button size="sm" className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700">
                  <Calculator className="h-4 w-4" />
                  Prepare Bid
                </Button>
              </Link>
            </>
          }
        />

        {/* Key Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-600/20">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Closing In</p>
                <p className="text-lg font-semibold text-white">{mockTenderDetail.daysLeft} days</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-600/20">
                <DollarSign className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Estimated Value</p>
                <p className="text-lg font-semibold text-white">{mockTenderDetail.estimatedValue}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">EMD Amount</p>
                <p className="text-lg font-semibold text-white">{mockTenderDetail.emdAmount}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-600/20">
                <Brain className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">AI Strategy</p>
                <p className="text-lg font-semibold text-white capitalize">{mockTenderDetail.bidStrategy.recommendation}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-gray-800/50 backdrop-blur-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="lots">Lots & Pricing</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="strategy">Bid Strategy</TabsTrigger>
            <TabsTrigger value="workflow">Workflow</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Tender Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-400">Description</p>
                  <p className="text-white mt-1">{mockTenderDetail.description}</p>
                </div>
                <Separator className="bg-gray-700/50" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Location</p>
                    <div className="flex items-start gap-2 mt-1">
                      <MapPin className="h-4 w-4 text-amber-400 mt-0.5" />
                      <p className="text-white">{mockTenderDetail.location}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Tender Fee</span>
                      <span className="text-white">{mockTenderDetail.tenderFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-400">Processing Fee</span>
                      <span className="text-white">{mockTenderDetail.processingFee}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Document Status */}
            <Card className="p-6 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Document Status</h3>
              <div className="space-y-3">
                {mockTenderDetail.documents.map((doc) => (
                  <div key={doc.name} className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-white font-medium">{doc.name}</p>
                        {doc.date && (
                          <p className="text-xs text-gray-400">{doc.date}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        doc.status === 'downloaded' ? 'default' :
                        doc.status === 'uploaded' ? 'secondary' :
                        'outline'
                      }>
                        {doc.status}
                      </Badge>
                      {doc.status === 'pending' && (
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="lots" className="space-y-6">
            <Card className="p-6 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Lot Details</h3>
                <Badge variant="secondary">{mockTenderDetail.lots.length} Lots</Badge>
              </div>
              <div className="space-y-4">
                {mockTenderDetail.lots.map((lot, index) => (
                  <div key={lot.id} className="p-4 rounded-lg bg-gray-700/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">Lot {lot.id}</h4>
                      <Badge>{lot.grade} Grade</Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-400">Species</p>
                        <p className="text-white font-medium">{lot.species}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Volume</p>
                        <p className="text-white font-medium">{lot.volumeCbm} cbm</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Reserve Price</p>
                        <p className="text-white font-medium">{lot.reservePrice}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Depot</p>
                        <p className="text-white font-medium">{lot.depot}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Dimensions</p>
                      <p className="text-sm text-white">{lot.dimensions}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="strategy" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-700/50">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-purple-600/20">
                  <Brain className="h-6 w-6 text-purple-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">AI Bid Recommendation</h3>
                  <p className="text-sm text-gray-300 mt-1">
                    Based on historical data, competitor analysis, and market conditions
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Bid Strategy</p>
                    <div className="flex items-center gap-3">
                      <Target className="h-5 w-5 text-amber-400" />
                      <p className="text-xl font-semibold text-white capitalize">{mockTenderDetail.bidStrategy.recommendation}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Confidence Level</p>
                    <Progress value={mockTenderDetail.bidStrategy.confidence} className="h-3" />
                    <p className="text-sm text-white mt-1">{mockTenderDetail.bidStrategy.confidence}% confidence</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-2">Suggested Margin</p>
                    <p className="text-lg font-medium text-white">{mockTenderDetail.bidStrategy.suggestedMargin}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                    <span className="text-gray-400">Risk Level</span>
                    <Badge variant={mockTenderDetail.bidStrategy.riskLevel === 'low' ? 'default' : 'secondary'}>
                      {mockTenderDetail.bidStrategy.riskLevel}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                    <span className="text-gray-400">Competitors</span>
                    <span className="text-white font-medium">{mockTenderDetail.bidStrategy.competitorCount}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-700/30">
                    <span className="text-gray-400">Historical Win Rate</span>
                    <span className="text-white font-medium">{mockTenderDetail.bidStrategy.historicalWinRate}</span>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="workflow" className="space-y-6">
            <TenderWorkflowStatus 
              tenderCode={mockTenderDetail.code}
              currentStage="bidding"
            />
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card className="p-6 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
              <h3 className="text-lg font-semibold text-white mb-4">Tender Timeline</h3>
              <div className="space-y-4">
                {mockTenderDetail.timeline.map((item, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        item.status === 'completed' ? 'bg-green-600/20' :
                        item.status === 'pending' ? 'bg-amber-600/20' :
                        'bg-gray-600/20'
                      }`}>
                        {item.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : item.status === 'pending' ? (
                          <Clock className="h-5 w-5 text-amber-400" />
                        ) : (
                          <Info className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      {index < mockTenderDetail.timeline.length - 1 && (
                        <div className="w-0.5 h-16 bg-gray-700/50 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 pb-8">
                      <h4 className="font-medium text-white">{item.event}</h4>
                      <p className="text-sm text-gray-400 mt-1">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}