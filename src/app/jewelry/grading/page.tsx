'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import Image from 'next/image'
import { Gem, Diamond, Scale, Search, Plus, Eye, Edit, CheckCircle, XCircle, Clock, AlertTriangle, Award, Calendar, User, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { GRADING_JOB_PRESET } from '@/hooks/entityPresets'
import GradingJobModal from './GradingJobModal'
import IssueCertificateModal from './IssueCertificateModal'
import { useToast } from '@/components/ui/use-toast'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { canIssueCertificate, canEditGradingJob, canDeleteGradingJob } from '@/lib/acl'
import '@/styles/jewelry-glassmorphism.css'

type GradingStatus = 'pipeline' | 'in_progress' | 'graded' | 'pending_review'
type Priority = 'low' | 'normal' | 'urgent'

interface GradingItem {
  id: string
  entityId: string
  itemName: string
  sku: string
  category: string
  image?: string
  status: GradingStatus
  priority: Priority
  grader: {
    id: string
    name: string
    certification: string
  }
  fourCs: {
    carat: number
    cut: 'EX' | 'VG' | 'G' | 'F' | 'P'
    color: 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L'
    clarity: 'IF' | 'VVS1' | 'VVS2' | 'VS1' | 'VS2' | 'SI1' | 'SI2' | 'I1'
  }
  measurements?: string
  fluorescence?: 'None' | 'Faint' | 'Medium' | 'Strong'
  comments?: string
  certificate?: {
    lab: 'GIA' | 'IGI' | 'HRD' | 'AGS' | 'In-house'
    number: string
    date?: string
    grade?: string
  }
  dateReceived: string
  dateCompleted?: string
}

export default function JewelryGradingPage() {
  const { toast } = useToast()
  const { user } = useHERAAuth()
  const role = (user?.role || 'viewer') as any
  // Universal hook bound to GRADING_JOB preset
  const {
    entities: jobs,
    isLoading: loading,
    error,
    refetch,
    create,
    update,
    delete: remove,
    link
  } = useUniversalEntity({
    entity_type: GRADING_JOB_PRESET.entity_type,
    dynamicFields: GRADING_JOB_PRESET.dynamicFields,
    relationships: GRADING_JOB_PRESET.relationships,
    filters: { 
      include_dynamic: true, 
      include_relationships: false, // Temporarily disable to prevent infinite loops
      limit: 100 
    }
  })

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | GradingStatus>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all')
  const [gradeBand, setGradeBand] = useState<'all' | 'D-F' | 'G-H' | 'I-J' | 'K-L'>('all')
  const [openJobModal, setOpenJobModal] = useState(false)
  const [editEntity, setEditEntity] = useState<any | null>(null)
  const [openCertModal, setOpenCertModal] = useState(false)
  const [certJobId, setCertJobId] = useState<string | null>(null)
  
  // Normalize dynamic fields (supports plain or { value })
  const dyn = (obj: any, key: string) => {
    const v = obj?.[key]
    if (v === undefined || v === null) return undefined
    return typeof v === 'object' && 'value' in v ? v.value : v
  }

  // Map jobs to display items using useMemo to prevent infinite re-renders
  const items = useMemo<GradingItem[]>(() => {
    // Ensure we only process when we have valid data
    if (!jobs || !Array.isArray(jobs)) return []
    
    return jobs.map((j: any) => {
      const d = j.dynamic_fields || j.dynamic || {}
      const status = (dyn(d, 'status') as GradingStatus) || 'pipeline'
      const priority = (dyn(d, 'priority') as Priority) || 'normal'
      const carat = Number(dyn(d, 'carat') ?? 0)
      const cut = (dyn(d, 'cut') as any) || 'VG'
      const color = (dyn(d, 'color') as any) || 'G'
      const clarity = (dyn(d, 'clarity') as any) || 'VS2'
      const measurements = dyn(d, 'measurements') as string | undefined
      const certNo = dyn(d, 'certificate_number') as string | undefined
      const pass = dyn(d, 'pass') as boolean | undefined

      // Attempt to read grader from relationships
      const rels: any = j.relationships || j.relationships_by_type || {}
      const graderName = rels?.ASSIGNED_TO?.[0]?.entity_name || rels?.ASSIGNED_TO?.[0]?.to_entity_name || '-'

      return {
        id: j.id || j.entity_id,
        entityId: j.id || j.entity_id,
        itemName: j.entity_name || 'Grading Job',
        sku: certNo || j.entity_code || '-',
        category: 'Grading',
        status,
        priority,
        grader: { id: '', name: graderName, certification: '' },
        fourCs: { carat, cut, color, clarity },
        measurements,
        certificate: certNo ? { lab: 'In-house', number: certNo } as any : undefined,
        dateReceived: j.created_at || new Date().toISOString(),
        dateCompleted: status === 'graded' ? (j.updated_at || undefined) : undefined
      }
    })
  }, [jobs])

  const filtered = useMemo(() => {
    return items.filter(i => {
      const matchesSearch =
        i.itemName.toLowerCase().includes(search.toLowerCase()) ||
        i.sku.toLowerCase().includes(search.toLowerCase()) ||
        i.grader.name.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = statusFilter === 'all' || i.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || i.priority === priorityFilter
      const matchesBand = (() => {
        if (gradeBand === 'all') return true
        const color = i.fourCs.color
        const bands: Record<string, string[]> = {
          'D-F': ['D', 'E', 'F'],
          'G-H': ['G', 'H'],
          'I-J': ['I', 'J'],
          'K-L': ['K', 'L']
        }
        return bands[gradeBand]?.includes(color) ?? true
      })()

      return matchesSearch && matchesStatus && matchesPriority && matchesBand
    })
  }, [items, search, statusFilter, priorityFilter, gradeBand])

  const stats = useMemo(() => {
    const total = items.length
    const graded = items.filter(i => i.status === 'graded').length
    const inProgress = items.filter(i => i.status === 'in_progress').length
    const pending = items.filter(i => i.status === 'pipeline' || i.status === 'pending_review').length
    const passedCount = items.filter(i => i.status === 'graded').length // refined later if pass flag is present
    const passRate = total ? (passedCount / total) * 100 : 0
    return { total, graded, pending, inProgress, passRate }
  }, [items])

  const statusBadge = (s: GradingStatus) => {
    switch (s) {
      case 'graded':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'pipeline':
      case 'pending_review':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const statusIcon = (s: GradingStatus) => {
    if (s === 'graded') return <CheckCircle className="h-3 w-3 text-green-600" />
    if (s === 'in_progress') return <Clock className="h-3 w-3 text-blue-600" />
    if (s === 'pending_review') return <AlertTriangle className="h-3 w-3 text-yellow-600" />
    return <Clock className="h-3 w-3 text-gray-600" />
  }

  return (
    <div className="min-h-screen">
      <div className="relative">
        <div className="absolute inset-0 jewelry-gradient-primary opacity-80" />
        <div className="relative z-10">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
              <div>
                <h1 className="jewelry-heading text-4xl font-bold flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="jewelry-crown-glow p-3 rounded-xl"
                  >
                    <Diamond className="h-8 w-8 jewelry-icon-gold" />
                  </motion.div>
                  Grading Lab
                </h1>
                <p className="jewelry-text-luxury mt-2 text-lg">Professional diamond and gemstone grading</p>
              </div>
              <div className="flex items-center gap-4">
                <Button className="jewelry-btn-primary" onClick={() => { setEditEntity(null); setOpenJobModal(true) }}>
                  <Plus className="h-4 w-4 mr-2" /> New Grading
                </Button>
                <Button variant="outline" className="jewelry-btn-secondary">
                  <Download className="h-4 w-4 mr-2" /> Export
                </Button>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
              <span className="jewelry-text-muted mr-2">Legend:</span>
              <Badge className={`text-xs ${statusBadge('pipeline')}`}>Pipeline</Badge>
              <Badge className={`text-xs ${statusBadge('in_progress')}`}>In Progress</Badge>
              <Badge className={`text-xs ${statusBadge('graded')}`}>Graded</Badge>
              <Badge className={`text-xs ${statusBadge('pending_review')}`}>Pending Review</Badge>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
          >
            <div className="jewelry-glass-card p-6 text-center">
              <Gem className="mx-auto mb-3 jewelry-icon-gold" size={28} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">{stats.total}</h3>
              <p className="jewelry-text-muted text-sm">In Pipeline</p>
            </div>
            <div className="jewelry-glass-card p-6 text-center">
              <CheckCircle className="mx-auto mb-3 text-green-600" size={28} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">{stats.graded}</h3>
              <p className="jewelry-text-muted text-sm">Graded</p>
            </div>
            <div className="jewelry-glass-card p-6 text-center">
              <Clock className="mx-auto mb-3 text-blue-600" size={28} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">{stats.inProgress}</h3>
              <p className="jewelry-text-muted text-sm">In Progress</p>
            </div>
            <div className="jewelry-glass-card p-6 text-center">
              <AlertTriangle className="mx-auto mb-3 text-yellow-600" size={28} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">{stats.pending}</h3>
              <p className="jewelry-text-muted text-sm">Pending</p>
            </div>
            <div className="jewelry-glass-card p-6 text-center">
              <Award className="mx-auto mb-3 jewelry-icon-gold" size={28} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">{stats.passRate.toFixed(1)}%</h3>
              <p className="jewelry-text-muted text-sm">Pass Rate</p>
            </div>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="jewelry-glass-panel p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 jewelry-text-muted" />
                <Input
                  placeholder="Search by item, SKU, or grader..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-12 jewelry-glass-input"
                />
              </div>
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                  <SelectTrigger className="w-40 jewelry-glass-input">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="jewelry-glass-dropdown">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pipeline">Pipeline</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="graded">Graded</SelectItem>
                    <SelectItem value="pending_review">Pending Review</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={v => setPriorityFilter(v as any)}>
                  <SelectTrigger className="w-40 jewelry-glass-input">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="jewelry-glass-dropdown">
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={gradeBand} onValueChange={v => setGradeBand(v as any)}>
                  <SelectTrigger className="w-40 jewelry-glass-input">
                    <SelectValue placeholder="Color" />
                  </SelectTrigger>
                  <SelectContent className="jewelry-glass-dropdown">
                    <SelectItem value="all">All Colors</SelectItem>
                    <SelectItem value="D-F">D–F</SelectItem>
                    <SelectItem value="G-H">G–H</SelectItem>
                    <SelectItem value="I-J">I–J</SelectItem>
                    <SelectItem value="K-L">K–L</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Grid */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filtered.map((it, idx) => (
              <motion.div
                key={it.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.06 * idx }}
                className="jewelry-glass-card group"
              >
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="jewelry-crown-glow aspect-square w-16 rounded-lg bg-gradient-to-br from-jewelry-cream to-jewelry-blue-50 relative overflow-hidden">
                        {it.image ? (
                          <Image
                            src={it.image}
                            alt={it.itemName}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="64px"
                          />
                        ) : (
                          <Gem className="h-8 w-8 jewelry-icon-gold m-4" />
                        )}
                      </div>
                      <div>
                        <h3 className="jewelry-text-high-contrast font-bold text-sm group-hover:jewelry-text-gold transition-colors">
                          {it.itemName}
                        </h3>
                        <p className="jewelry-text-muted text-xs">SKU: {it.sku}</p>
                        <p className="jewelry-text-muted text-xs">{it.category}</p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge className={`text-xs ${statusBadge(it.status)}`}>
                        {statusIcon(it.status)}
                        <span className="ml-1 capitalize">{it.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge className="text-xs bg-amber-100 text-amber-800 border-amber-200">
                        {it.fourCs.carat.toFixed(2)}ct {it.fourCs.color}/{it.fourCs.clarity}/{it.fourCs.cut}
                      </Badge>
                    </div>
                  </div>

                  {/* Grader */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 jewelry-text-muted" />
                    <div>
                      <p className="jewelry-text-high-contrast text-sm font-medium">{it.grader.name}</p>
                      <p className="jewelry-text-muted text-xs">{it.grader.certification}</p>
                    </div>
                  </div>

                  {/* 4Cs */}
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div className="jewelry-glass-card-subtle p-2 rounded-md text-center">
                      <p className="jewelry-text-muted">Carat</p>
                      <p className="jewelry-text-high-contrast font-semibold">{it.fourCs.carat.toFixed(2)}</p>
                    </div>
                    <div className="jewelry-glass-card-subtle p-2 rounded-md text-center">
                      <p className="jewelry-text-muted">Cut</p>
                      <p className="jewelry-text-high-contrast font-semibold">{it.fourCs.cut}</p>
                    </div>
                    <div className="jewelry-glass-card-subtle p-2 rounded-md text-center">
                      <p className="jewelry-text-muted">Color</p>
                      <p className="jewelry-text-high-contrast font-semibold">{it.fourCs.color}</p>
                    </div>
                    <div className="jewelry-glass-card-subtle p-2 rounded-md text-center">
                      <p className="jewelry-text-muted">Clarity</p>
                      <p className="jewelry-text-high-contrast font-semibold">{it.fourCs.clarity}</p>
                    </div>
                  </div>

                  {/* Measurements / Cert */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Scale className="h-3 w-3 jewelry-icon-gold" />
                      <span className="jewelry-text-muted truncate">{it.measurements ?? '—'}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3 jewelry-icon-gold" />
                      <span className="jewelry-text-muted truncate">
                        {it.certificate ? `${it.certificate.lab} • ${it.certificate.number}` : 'No certificate'}
                      </span>
                    </div>
                  </div>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 jewelry-text-muted" />
                      <span className="jewelry-text-muted">Rec: {new Date(it.dateReceived).toLocaleDateString()}</span>
                    </div>
                    {it.dateCompleted && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="jewelry-text-muted">{new Date(it.dateCompleted).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/20">
                    <Button size="sm" variant="outline" className="flex-1 jewelry-btn-secondary">
                      <Eye className="h-4 w-4 mr-1" /> Details
                    </Button>
                    {canEditGradingJob(role) && (
                      <Button size="sm" className="flex-1 jewelry-btn-primary" onClick={() => {
                        const raw = (jobs || []).find((j: any) => (j.id || j.entity_id) === it.entityId)
                        setEditEntity(raw || null)
                        setOpenJobModal(true)
                      }}>
                        <Edit className="h-4 w-4 mr-1" /> Grade
                      </Button>
                    )}
                  </div>
                  <div className="pt-2">
                    {canIssueCertificate(role) && (
                      <Button size="sm" variant="outline" className="w-full jewelry-btn-secondary disabled:opacity-40" disabled={it.status !== 'graded'} onClick={() => { setCertJobId(it.entityId); setOpenCertModal(true) }}>
                        <Award className="h-4 w-4 mr-1" /> Issue Certificate
                      </Button>
                    )}
                  </div>
                  <div className="pt-2">
                    {canEditGradingJob(role) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full jewelry-btn-secondary disabled:opacity-40"
                        disabled={it.status === 'in_progress'}
                        onClick={async () => {
                          try {
                            await update({ entity_id: it.entityId, dynamic_patch: { status: 'in_progress' } })
                            toast({ title: 'Regrade started', description: `${it.itemName} moved to In Progress` })
                            refetch()
                          } catch (e: any) {
                            toast({ title: 'Regrade failed', description: e?.message || 'Update error', variant: 'destructive' })
                          }
                        }}
                      >
                        <Edit className="h-4 w-4 mr-1" /> Regrade
                      </Button>
                    )}
                  </div>
                  {canDeleteGradingJob(role) && (
                    <div className="pt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full bg-red-500/10 text-red-700 hover:bg-red-500/20"
                        onClick={async () => {
                          try {
                            await remove({ entity_id: it.entityId })
                            toast({ title: 'Deleted', description: `${it.itemName} removed` })
                            refetch()
                          } catch (e: any) {
                            toast({ title: 'Delete failed', description: e?.message || 'Error', variant: 'destructive' })
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty state */}
          {filtered.length === 0 && !loading && (
            <div className="jewelry-glass-panel text-center py-12 mt-6">
              <Diamond className="h-16 w-16 jewelry-text-muted mx-auto mb-4" />
              <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">No grading items found</h3>
              <p className="jewelry-text-muted mb-6">Adjust search or filters to find items.</p>
              <Button className="jewelry-btn-primary" onClick={() => { setEditEntity(null); setOpenJobModal(true) }}>
                <Plus className="h-4 w-4 mr-2" /> Create Grading Job
              </Button>
            </div>
          )}
          {/* Modals */}
          <GradingJobModal
            open={openJobModal}
            mode={editEntity ? 'edit' : 'create'}
            entity={editEntity}
            onClose={() => { setOpenJobModal(false); setEditEntity(null); refetch() }}
          />

          <IssueCertificateModal
            open={openCertModal}
            jobId={certJobId || ''}
            onClose={() => { setOpenCertModal(false); setCertJobId(null); refetch() }}
          />
        </div>
      </div>
    </div>
  )
}
// Modals appended below main return
