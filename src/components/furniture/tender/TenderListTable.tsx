'use client'

import React, { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Search,
  Filter,
  Download,
  Eye,
  DollarSign,
  Clock,
  FileText,
  Brain,
  Target,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface Tender {
  id: string
  code: string
  title: string
  department: string
  status: 'active' | 'watchlist' | 'submitted' | 'won' | 'lost' | 'draft'
  closingDate: string
  daysLeft: number
  estimatedValue: string
  emdAmount: string
  lots: number
  bidStrategy?: 'aggressive' | 'moderate' | 'conservative'
  aiConfidence?: number
  competitorCount?: number
}

interface TenderListTableProps {
  tenders?: Tender[]
  onFilter?: (filters: any) => void
  onSearch?: (query: string) => void
}

const mockTenders: Tender[] = [
  {
    id: '1',
    code: 'KFD/2025/WOOD/001',
    title: 'Teak Wood Supply - Nilambur Range',
    department: 'Kerala Forest Department',
    status: 'active',
    closingDate: '2025-01-25',
    daysLeft: 5,
    estimatedValue: '₹45,00,000',
    emdAmount: '₹90,000',
    lots: 15,
    bidStrategy: 'aggressive',
    aiConfidence: 78,
    competitorCount: 5
  },
  {
    id: '2',
    code: 'KFD/2025/WOOD/002',
    title: 'Rosewood Logs - Wayanad Division',
    department: 'Kerala Forest Department',
    status: 'active',
    closingDate: '2025-01-28',
    daysLeft: 8,
    estimatedValue: '₹32,00,000',
    emdAmount: '₹64,000',
    lots: 8,
    bidStrategy: 'conservative',
    aiConfidence: 65,
    competitorCount: 8
  },
  {
    id: '3',
    code: 'KFD/2025/TIMBER/003',
    title: 'Mixed Timber - Palakkad Region',
    department: 'Kerala Forest Department',
    status: 'watchlist',
    closingDate: '2025-02-05',
    daysLeft: 16,
    estimatedValue: '₹18,00,000',
    emdAmount: '₹36,000',
    lots: 22,
    bidStrategy: 'moderate',
    aiConfidence: 72,
    competitorCount: 3
  },
  {
    id: '4',
    code: 'KFD/2024/WOOD/098',
    title: 'Sandalwood Auction - Marayur',
    department: 'Kerala Forest Department',
    status: 'won',
    closingDate: '2024-12-20',
    daysLeft: -30,
    estimatedValue: '₹85,00,000',
    emdAmount: '₹1,70,000',
    lots: 5,
    bidStrategy: 'aggressive',
    aiConfidence: 85,
    competitorCount: 12
  },
  {
    id: '5',
    code: 'KFD/2024/TIMBER/095',
    title: 'Bamboo Supply - Silent Valley',
    department: 'Kerala Forest Department',
    status: 'lost',
    closingDate: '2024-12-15',
    daysLeft: -35,
    estimatedValue: '₹12,00,000',
    emdAmount: '₹24,000',
    lots: 18,
    bidStrategy: 'moderate',
    aiConfidence: 45,
    competitorCount: 6
  }
]

export default function TenderListTable({
  tenders = mockTenders,
  onFilter,
  onSearch
}: TenderListTableProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('closing_date')

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'watchlist':
        return 'secondary'
      case 'submitted':
        return 'outline'
      case 'won':
        return 'default' // with green color
      case 'lost':
        return 'destructive'
      default:
        return 'secondary'
    }
  }

  const getStrategyIcon = (strategy?: string) => {
    switch (strategy) {
      case 'aggressive':
        return <Target className="h-4 w-4 text-red-400" />
      case 'moderate':
        return <Brain className="h-4 w-4 text-amber-400" />
      case 'conservative':
        return <TrendingUp className="h-4 w-4 text-green-400" />
      default:
        return null
    }
  }

  // Filter tenders based on search and status
  const filteredTenders = tenders.filter(tender => {
    const matchesSearch =
      searchQuery === '' ||
      tender.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tender.department.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || tender.status === statusFilter

    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <Input
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value)
              onSearch?.(e.target.value)
            }}
            placeholder="Search by code, title, or department..."
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
          />
        </div>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[200px] bg-gray-800/50 border-gray-700 text-white">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="watchlist">Watchlist</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full md:w-[200px] bg-gray-800/50 border-gray-700 text-white">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="closing_date">Closing Date</SelectItem>
            <SelectItem value="value">Estimated Value</SelectItem>
            <SelectItem value="lots">Number of Lots</SelectItem>
            <SelectItem value="ai_confidence">AI Confidence</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="icon">
          <Download className="h-4 w-4" />
        </Button>
      </div>

      {/* Tender List Table */}
      <Card className="bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700/50">
                <TableHead className="text-gray-400">Tender Code</TableHead>
                <TableHead className="text-gray-400">Title & Department</TableHead>
                <TableHead className="text-gray-400">Status</TableHead>
                <TableHead className="text-gray-400">Closing</TableHead>
                <TableHead className="text-gray-400 text-right">Value</TableHead>
                <TableHead className="text-gray-400 text-right">EMD</TableHead>
                <TableHead className="text-gray-400 text-center">Lots</TableHead>
                <TableHead className="text-gray-400 text-center">AI</TableHead>
                <TableHead className="text-gray-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenders.map(tender => (
                <TableRow
                  key={tender.id}
                  className="border-gray-700/50 hover:bg-gray-700/30 transition-colors"
                >
                  <TableCell className="font-mono text-sm text-white">{tender.code}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium text-white">{tender.title}</p>
                      <p className="text-sm text-gray-400">{tender.department}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={getStatusBadgeVariant(tender.status)}
                      className={cn(
                        tender.status === 'won' &&
                          'bg-green-600/20 text-green-400 border-green-600',
                        tender.status === 'active' &&
                          'bg-amber-600/20 text-amber-400 border-amber-600'
                      )}
                    >
                      {tender.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-white">{tender.closingDate}</p>
                        <p
                          className={cn(
                            'text-xs',
                            tender.daysLeft > 0 ? 'text-amber-400' : 'text-gray-500'
                          )}
                        >
                          {tender.daysLeft > 0 ? `${tender.daysLeft} days left` : 'Closed'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <p className="font-medium text-white">{tender.estimatedValue}</p>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span className="text-white">{tender.emdAmount}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-white font-medium">{tender.lots}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center gap-1">
                      {getStrategyIcon(tender.bidStrategy)}
                      {tender.aiConfidence && (
                        <span className="text-xs text-gray-400">{tender.aiConfidence}%</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Link href={`/furniture/tender/${tender.code}`}>
                        <Button size="sm" variant="outline" className="gap-1">
                          <Eye className="h-3 w-3" />
                          View
                        </Button>
                      </Link>
                      {tender.status === 'active' && (
                        <Button size="sm" variant="outline" className="gap-1">
                          <FileText className="h-3 w-3" />
                          Bid
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Active Tenders</p>
              <p className="text-xl font-bold text-white">
                {filteredTenders.filter(t => t.status === 'active').length}
              </p>
            </div>
            <FileText className="h-5 w-5 text-amber-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Total Value</p>
              <p className="text-xl font-bold text-white">₹2.1Cr</p>
            </div>
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Win Rate</p>
              <p className="text-xl font-bold text-white">42%</p>
            </div>
            <Target className="h-5 w-5 text-purple-400" />
          </div>
        </Card>

        <Card className="p-4 bg-gray-800/70 backdrop-blur-sm border-gray-700/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">Avg AI Score</p>
              <p className="text-xl font-bold text-white">72%</p>
            </div>
            <Brain className="h-5 w-5 text-blue-400" />
          </div>
        </Card>
      </div>
    </div>
  )
}
