

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

export const dynamic = 'force-dynamic' // Mock tender detail data
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
  description:
    'Supply of Teak wood logs from Nilambur Forest Range. The tender includes 15 lots of premium quality teak wood with specified dimensions and grading requirements.',
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
    }

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
      <div className="min-h-screen bg-[var(--color-body)] flex items-center justify-center">
        {' '}
        <div className="text-center">
          {' '}
          <div className="inline-flex items-center space-x-2">
            {' '}
            <div className="w-8 h-8 border-4 border-[var(--color-accent-indigo)] border-t-transparent rounded-full animate-spin"></div>{' '}
            <p className="text-[var(--color-text-secondary)]">Loading tender details...</p>{' '}
          </div>{' '}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      {' '}
      <div className="p-6 space-y-6">
        {' '}
        {/* Header */}{' '}
        <FurniturePageHeader
          title={mockTenderDetail.title}
          subtitle={`${mockTenderDetail.code} • ${mockTenderDetail.department}`}
          actions={
            <>
              {' '}
              <Button variant="outline" size="sm" className="gap-2 hover:bg-[var(--color-hover)]">
                {' '}
                <Download className="h-4 w-4" /> Download All{' '}
              </Button>{' '}
              <Link href={`/furniture/tender/${params.code}/bid/new`}>
                {' '}
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-teal)] hover:from-[var(--color-accent-indigo)] hover:to-[var(--color-accent-teal)]"
                >
                  {' '}
                  <Calculator className="h-4 w-4" /> Prepare Bid{' '}
                </Button>{' '}
              </Link>{' '}
            </>
          }
        />{' '}
        {/* Key Info Cards */}{' '}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {' '}
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
            {' '}
            <div className="flex items-center gap-3">
              {' '}
              <div className="p-2 rounded-lg bg-[var(--color-accent-indigo)]/20">
                {' '}
                <Clock className="h-5 w-5 text-[var(--color-icon-secondary)]" />{' '}
              </div>{' '}
              <div>
                {' '}
                <p className="text-xs text-[var(--color-text-secondary)]">Closing In</p>{' '}
                <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {mockTenderDetail.daysLeft} days
                </p>{' '}
              </div>{' '}
            </div>{' '}
          </Card>{' '}
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
            {' '}
            <div className="flex items-center gap-3">
              {' '}
              <div className="p-2 rounded-lg bg-green-600/20">
                {' '}
                <DollarSign className="h-5 w-5 text-green-400" />{' '}
              </div>{' '}
              <div>
                {' '}
                <p className="text-xs text-[var(--color-text-secondary)]">Estimated Value</p>{' '}
                <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {' '}
                  {mockTenderDetail.estimatedValue}{' '}
                </p>{' '}
              </div>{' '}
            </div>{' '}
          </Card>{' '}
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
            {' '}
            <div className="flex items-center gap-3">
              {' '}
              <div className="p-2 rounded-lg bg-[var(--color-body)]/20">
                {' '}
                <Shield className="h-5 w-5 text-[var(--color-icon-secondary)]" />{' '}
              </div>{' '}
              <div>
                {' '}
                <p className="text-xs text-[var(--color-text-secondary)]">EMD Amount</p>{' '}
                <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {mockTenderDetail.emdAmount}
                </p>{' '}
              </div>{' '}
            </div>{' '}
          </Card>{' '}
          <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-4 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
            {' '}
            <div className="flex items-center gap-3">
              {' '}
              <div className="p-2 rounded-lg bg-[var(--color-accent-indigo)]/20">
                {' '}
                <Brain className="h-5 w-5 text-[var(--color-icon-secondary)]" />{' '}
              </div>{' '}
              <div>
                {' '}
                <p className="text-xs text-[var(--color-text-secondary)]">AI Strategy</p>{' '}
                <p className="text-lg font-semibold text-[var(--color-text-primary)] capitalize">
                  {' '}
                  {mockTenderDetail.bidStrategy.recommendation}{' '}
                </p>{' '}
              </div>{' '}
            </div>{' '}
          </Card>{' '}
        </div>{' '}
        {/* Main Content Tabs */}{' '}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="bg-[var(--color-body)] space-y-4"
        >
          {' '}
          <TabsList className="bg-[var(--color-body)]/50 backdrop-blur-sm">
            {' '}
            <TabsTrigger value="overview">Overview</TabsTrigger>{' '}
            <TabsTrigger value="lots">Lots & Pricing</TabsTrigger>{' '}
            <TabsTrigger value="documents">Documents</TabsTrigger>{' '}
            <TabsTrigger value="strategy">Bid Strategy</TabsTrigger>{' '}
            <TabsTrigger value="workflow">Workflow</TabsTrigger>{' '}
            <TabsTrigger value="timeline">Timeline</TabsTrigger>{' '}
          </TabsList>{' '}
          <TabsContent value="overview" className="bg-[var(--color-body)] space-y-6">
            {' '}
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
              {' '}
              <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                Tender Details
              </h3>{' '}
              <div className="space-y-4">
                {' '}
                <div>
                  {' '}
                  <p className="text-sm text-[var(--color-text-secondary)]">Description</p>{' '}
                  <p className="text-[var(--color-text-primary)] mt-1">
                    {mockTenderDetail.description}
                  </p>{' '}
                </div>{' '}
                <Separator className="bg-muted-foreground/10/50" />{' '}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {' '}
                  <div>
                    {' '}
                    <p className="text-sm text-[var(--color-text-secondary)]">Location</p>{' '}
                    <div className="flex items-start gap-2 mt-1">
                      {' '}
                      <MapPin className="h-4 w-4 text-[var(--color-text-secondary)] mt-0.5" />{' '}
                      <p className="text-[var(--color-text-primary)]">
                        {mockTenderDetail.location}
                      </p>{' '}
                    </div>{' '}
                  </div>{' '}
                  <div className="space-y-2">
                    {' '}
                    <div className="flex justify-between">
                      {' '}
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        Tender Fee
                      </span>{' '}
                      <span className="text-[var(--color-text-primary)]">
                        {mockTenderDetail.tenderFee}
                      </span>{' '}
                    </div>{' '}
                    <div className="flex justify-between">
                      {' '}
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        Processing Fee
                      </span>{' '}
                      <span className="text-[var(--color-text-primary)]">
                        {mockTenderDetail.processingFee}
                      </span>{' '}
                    </div>{' '}
                  </div>{' '}
                </div>{' '}
              </div>{' '}
            </Card>{' '}
            {/* Document Status */}{' '}
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
              {' '}
              <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                Document Status
              </h3>{' '}
              <div className="space-y-3">
                {' '}
                {mockTenderDetail.documents.map(doc => (
                  <div
                    key={doc.name}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted-foreground/10/30"
                  >
                    {' '}
                    <div className="bg-[var(--color-body)] flex items-center gap-3">
                      {' '}
                      <FileText className="h-5 w-5 text-[var(--color-icon-secondary)]" />{' '}
                      <div>
                        {' '}
                        <p className="text-[var(--color-text-primary)] font-medium">
                          {doc.name}
                        </p>{' '}
                        {doc.date && (
                          <p className="text-xs text-[var(--color-text-secondary)]">{doc.date}</p>
                        )}{' '}
                      </div>{' '}
                    </div>{' '}
                    <div className="bg-[var(--color-body)] flex items-center gap-2">
                      {' '}
                      <Badge
                        variant={
                          doc.status === 'downloaded'
                            ? 'default'
                            : doc.status === 'uploaded'
                              ? 'secondary'
                              : 'outline'
                        }
                      >
                        {' '}
                        {doc.status}{' '}
                      </Badge>{' '}
                      {doc.status === 'pending' && (
                        <Button size="sm" variant="outline">
                          {' '}
                          <Upload className="h-4 w-4" />{' '}
                        </Button>
                      )}{' '}
                    </div>
                  </div>
                ))}{' '}
              </div>{' '}
            </Card>{' '}
          </TabsContent>{' '}
          <TabsContent value="lots" className="bg-[var(--color-body)] space-y-6">
            {' '}
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
              {' '}
              <div className="flex items-center justify-between mb-4">
                {' '}
                <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)]">
                  Lot Details
                </h3>{' '}
                <Badge variant="secondary">{mockTenderDetail.lots.length} Lots</Badge>{' '}
              </div>{' '}
              <div className="space-y-4">
                {' '}
                {mockTenderDetail.lots.map((lot, index) => (
                  <div key={lot.id} className="p-4 rounded-lg bg-muted-foreground/10/30 space-y-3">
                    {' '}
                    <div className="flex items-center justify-between">
                      {' '}
                      <h4 className="bg-[var(--color-body)] font-medium text-[var(--color-text-primary)]">
                        Lot {lot.id}
                      </h4>{' '}
                      <Badge>{lot.grade} Grade</Badge>{' '}
                    </div>{' '}
                    <div className="bg-[var(--color-body)] grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {' '}
                      <div>
                        {' '}
                        <p className="text-[var(--color-text-secondary)]">Species</p>{' '}
                        <p className="text-[var(--color-text-primary)] font-medium">
                          {lot.species}
                        </p>{' '}
                      </div>{' '}
                      <div>
                        {' '}
                        <p className="text-[var(--color-text-secondary)]">Volume</p>{' '}
                        <p className="text-[var(--color-text-primary)] font-medium">
                          {lot.volumeCbm} cbm
                        </p>{' '}
                      </div>{' '}
                      <div>
                        {' '}
                        <p className="text-[var(--color-text-secondary)]">Reserve Price</p>{' '}
                        <p className="text-[var(--color-text-primary)] font-medium">
                          {lot.reservePrice}
                        </p>{' '}
                      </div>{' '}
                      <div>
                        {' '}
                        <p className="text-[var(--color-text-secondary)]">Depot</p>{' '}
                        <p className="text-[var(--color-text-primary)] font-medium">
                          {lot.depot}
                        </p>{' '}
                      </div>{' '}
                    </div>{' '}
                    <div>
                      {' '}
                      <p className="text-xs text-[var(--color-text-secondary)]">Dimensions</p>{' '}
                      <p className="text-sm text-[var(--color-text-primary)]">
                        {lot.dimensions}
                      </p>{' '}
                    </div>
                  </div>
                ))}{' '}
              </div>{' '}
            </Card>{' '}
          </TabsContent>{' '}
          <TabsContent value="strategy" className="bg-[var(--color-body)] space-y-6">
            {' '}
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-gradient-to-br from-[var(--color-accent-teal)]-900/20 to-[var(--color-accent-teal)]-900/20 border-[var(--color-accent-teal)]-700/50">
              {' '}
              <div className="flex items-start gap-4 mb-6">
                {' '}
                <div className="p-3 rounded-xl bg-[var(--color-accent-indigo)]/20">
                  {' '}
                  <Brain className="h-6 w-6 text-[var(--color-icon-secondary)]" />{' '}
                </div>{' '}
                <div className="bg-[var(--color-body)] flex-1">
                  {' '}
                  <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)]">
                    AI Bid Recommendation
                  </h3>{' '}
                  <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                    {' '}
                    Based on historical data, competitor analysis, and market conditions{' '}
                  </p>{' '}
                </div>{' '}
              </div>{' '}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {' '}
                <div className="space-y-4">
                  {' '}
                  <div>
                    {' '}
                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                      Bid Strategy
                    </p>{' '}
                    <div className="bg-[var(--color-body)] flex items-center gap-3">
                      {' '}
                      <Target className="h-5 w-5 text-[var(--color-icon-secondary)]" />{' '}
                      <p className="text-xl font-semibold text-[var(--color-text-primary)] capitalize">
                        {' '}
                        {mockTenderDetail.bidStrategy.recommendation}{' '}
                      </p>{' '}
                    </div>{' '}
                  </div>{' '}
                  <div>
                    {' '}
                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                      Confidence Level
                    </p>{' '}
                    <Progress
                      value={mockTenderDetail.bidStrategy.confidence}
                      className="bg-[var(--color-body)] h-3"
                    />{' '}
                    <p className="text-sm text-[var(--color-text-primary)] mt-1">
                      {' '}
                      {mockTenderDetail.bidStrategy.confidence}% confidence{' '}
                    </p>{' '}
                  </div>{' '}
                  <div>
                    {' '}
                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">
                      Suggested Margin
                    </p>{' '}
                    <p className="text-lg font-medium text-[var(--color-text-primary)]">
                      {' '}
                      {mockTenderDetail.bidStrategy.suggestedMargin}{' '}
                    </p>{' '}
                  </div>{' '}
                </div>{' '}
                <div className="space-y-4">
                  {' '}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted-foreground/10/30">
                    {' '}
                    <span className="text-[var(--color-text-secondary)]">Risk Level</span>{' '}
                    <Badge
                      variant={
                        mockTenderDetail.bidStrategy.riskLevel === 'low' ? 'default' : 'secondary'
                      }
                    >
                      {' '}
                      {mockTenderDetail.bidStrategy.riskLevel}{' '}
                    </Badge>{' '}
                  </div>{' '}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted-foreground/10/30">
                    {' '}
                    <span className="text-[var(--color-text-secondary)]">Competitors</span>{' '}
                    <span className="text-[var(--color-text-primary)] font-medium">
                      {' '}
                      {mockTenderDetail.bidStrategy.competitorCount}{' '}
                    </span>{' '}
                  </div>{' '}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted-foreground/10/30">
                    {' '}
                    <span className="text-[var(--color-text-secondary)]">
                      Historical Win Rate
                    </span>{' '}
                    <span className="text-[var(--color-text-primary)] font-medium">
                      {' '}
                      {mockTenderDetail.bidStrategy.historicalWinRate}{' '}
                    </span>{' '}
                  </div>{' '}
                </div>{' '}
              </div>{' '}
            </Card>{' '}
          </TabsContent>{' '}
          <TabsContent value="workflow" className="bg-[var(--color-body)] space-y-6">
            {' '}
            <TenderWorkflowStatus tenderCode={mockTenderDetail.code} currentStage="bidding" />{' '}
          </TabsContent>{' '}
          <TabsContent value="timeline" className="bg-[var(--color-body)] space-y-6">
            {' '}
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
              {' '}
              <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">
                Tender Timeline
              </h3>{' '}
              <div className="space-y-4">
                {' '}
                {mockTenderDetail.timeline.map((item, index) => (
                  <div key={index} className="bg-[var(--color-body)] flex items-start gap-4">
                    {' '}
                    <div className="bg-[var(--color-body)] flex flex-col items-center">
                      {' '}
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${item.status === 'completed' ? 'bg-green-600/20' : item.status === 'pending' ? 'bg-[var(--color-accent-indigo)]/20' : 'bg-muted-foreground/20'}`}
                      >
                        {' '}
                        {item.status === 'completed' ? (
                          <CheckCircle className="h-5 w-5 text-green-400" />
                        ) : item.status === 'pending' ? (
                          <Clock className="h-5 w-5 text-[var(--color-icon-secondary)]" />
                        ) : (
                          <Info className="h-5 w-5 text-[var(--color-icon-secondary)]" />
                        )}{' '}
                      </div>{' '}
                      {index < mockTenderDetail.timeline.length - 1 && (
                        <div className="w-0.5 h-16 bg-muted-foreground/10/50 mt-2" />
                      )}{' '}
                    </div>{' '}
                    <div className="bg-[var(--color-body)] flex-1 pb-8">
                      {' '}
                      <h4 className="bg-[var(--color-body)] font-medium text-[var(--color-text-primary)]">
                        {item.event}
                      </h4>{' '}
                      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                        {item.date}
                      </p>{' '}
                    </div>
                  </div>
                ))}{' '}
              </div>{' '}
            </Card>{' '}
          </TabsContent>{' '}
        </Tabs>{' '}
      </div>
    </div>
  )
}
