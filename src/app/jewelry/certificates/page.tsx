'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Award,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Download,
  Upload,
  CheckCircle,
  Clock,
  AlertTriangle,
  XCircle,
  Calendar,
  User,
  Shield,
  FileText,
  Gem,
  Diamond,
  Crown,
  Sparkles,
  Scale,
  DollarSign,
  Camera,
  FileImage,
  Printer,
  Share2,
  Archive,
  TrendingUp,
  BarChart3,
  PieChart,
  Star,
  MapPin,
  Phone,
  Mail,
  Building2,
  CreditCard,
  Lock,
  Zap,
  Target,
  Layers,
  Activity,
  Globe,
  BookOpen,
  Settings,
  RefreshCw,
  ExternalLink,
  QrCode,
  Fingerprint,
  Key,
  Database,
  CloudUpload,
  HardDrive,
  FileCheck,
  AlertCircle,
  Timer,
  Bookmark,
  Hash,
  GitBranch
} from 'lucide-react'
import '@/styles/jewelry-glassmorphism.css'

interface Certificate {
  id: string
  certificateNumber: string
  certificateType: 'authenticity' | 'appraisal' | 'grading' | 'origin' | 'insurance' | 'warranty'
  itemName: string
  itemId: string
  itemSku: string
  clientName: string
  clientEmail: string
  clientPhone: string
  issuerName: string
  issuerLicense: string
  issuerOrganization: string
  certificateDate: string
  expiryDate: string
  status: 'draft' | 'pending' | 'issued' | 'verified' | 'expired' | 'revoked'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  digitalSignature: boolean
  blockchainVerified: boolean
  qrCode: string
  certificateDetails: {
    itemDescription: string
    metal: string
    purity: number
    grossWeight: number
    netWeight: number
    stoneDetails: Array<{
      type: string
      carat: number
      color: string
      clarity: string
      cut: string
      origin?: string
    }>
    photos: string[]
    measurements: {
      length?: number
      width?: number
      height?: number
      diameter?: number
    }
    craftsmanship: string
    historicalSignificance?: string
    provenance?: string
    estimatedValue: number
    insuranceValue: number
    marketValue: number
  }
  verification: {
    verificationMethod: 'visual' | 'spectrometry' | 'xray' | 'laser' | 'ultrasonic'
    equipmentUsed: string[]
    testResults: any[]
    confidenceLevel: number
    verifiedBy: string
    verificationDate: string
    notes: string[]
  }
  compliance: {
    standards: string[]
    regulations: string[]
    certifyingBody: string
    accreditation: string
    complianceNotes: string
  }
  digitalAssets: {
    certificatePdf: string
    photos: string[]
    videos: string[]
    threeDModel?: string
    nftToken?: string
  }
  auditTrail: Array<{
    action: string
    performedBy: string
    timestamp: string
    details: string
  }>
  createdAt: string
  updatedAt: string
  location: string
  notes: string[]
}

export default function JewelryCertificatesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [selectedPriority, setSelectedPriority] = useState('all')
  const [sortBy, setSortBy] = useState('certificateDate')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'kanban'>('grid')
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null)

  // Mock certificate data
  const certificates: Certificate[] = [
    {
      id: '1',
      certificateNumber: 'CERT-2024-001',
      certificateType: 'authenticity',
      itemName: 'Vintage Royal Diamond Tiara',
      itemId: 'ITM-001',
      itemSku: 'VRT-001',
      clientName: 'Lady Catherine Windsor',
      clientEmail: 'catherine.windsor@royalestate.com',
      clientPhone: '+44 20 7946 0958',
      issuerName: 'Dr. Jonathan Sterling',
      issuerLicense: 'GIA-CERT-12345',
      issuerOrganization: 'Royal Gemological Institute',
      certificateDate: '2024-01-15',
      expiryDate: '2027-01-15',
      status: 'issued',
      priority: 'high',
      digitalSignature: true,
      blockchainVerified: true,
      qrCode: 'QR-CERT-001',
      certificateDetails: {
        itemDescription: 'Victorian-era diamond tiara with 127 brilliant-cut diamonds',
        metal: 'Platinum',
        purity: 950,
        grossWeight: 185.2,
        netWeight: 182.4,
        stoneDetails: [
          {
            type: 'Diamond',
            carat: 25.8,
            color: 'D',
            clarity: 'IF',
            cut: 'Brilliant',
            origin: 'Golconda'
          }
        ],
        photos: ['tiara1.jpg', 'tiara2.jpg', 'tiara3.jpg'],
        measurements: {
          length: 18.5,
          width: 15.2,
          height: 8.3
        },
        craftsmanship: 'Exceptional Victorian craftsmanship with intricate milgrain detailing',
        historicalSignificance: 'Commissioned for Queen Victoria\'s Diamond Jubilee, 1897',
        provenance: 'Royal Collection, documented provenance since 1897',
        estimatedValue: 2500000,
        insuranceValue: 3000000,
        marketValue: 2800000
      },
      verification: {
        verificationMethod: 'spectrometry',
        equipmentUsed: ['FTIR Spectrometer', 'Diamond Sure', 'Photoluminescence'],
        testResults: [],
        confidenceLevel: 99.8,
        verifiedBy: 'Dr. Jonathan Sterling',
        verificationDate: '2024-01-15',
        notes: ['All diamonds confirmed natural', 'No treatments detected', 'Exceptional clarity throughout']
      },
      compliance: {
        standards: ['ISO 21067', 'CIBJO Guidelines', 'Responsible Jewellery Council'],
        regulations: ['Kimberley Process', 'CITES', 'Cultural Property Protection'],
        certifyingBody: 'Royal Gemological Institute',
        accreditation: 'ISO/IEC 17025:2017',
        complianceNotes: 'Full compliance with international standards'
      },
      digitalAssets: {
        certificatePdf: 'cert_001.pdf',
        photos: ['photo1.jpg', 'photo2.jpg'],
        videos: ['inspection_video.mp4'],
        threeDModel: 'tiara_3d.obj',
        nftToken: 'NFT-CERT-001'
      },
      auditTrail: [
        {
          action: 'Certificate Created',
          performedBy: 'Dr. Jonathan Sterling',
          timestamp: '2024-01-10T09:00:00Z',
          details: 'Initial certificate creation'
        },
        {
          action: 'Verification Completed',
          performedBy: 'Dr. Jonathan Sterling',
          timestamp: '2024-01-15T14:30:00Z',
          details: 'Gemological analysis completed'
        },
        {
          action: 'Certificate Issued',
          performedBy: 'System',
          timestamp: '2024-01-15T16:00:00Z',
          details: 'Certificate officially issued to client'
        }
      ],
      createdAt: '2024-01-10',
      updatedAt: '2024-01-15',
      location: 'High Security Vault',
      notes: ['Exceptional historical piece', 'Requires specialized handling', 'Insurance documentation updated']
    },
    {
      id: '2',
      certificateNumber: 'CERT-2024-002',
      certificateType: 'grading',
      itemName: 'Burmese Ruby Ring',
      itemId: 'ITM-002',
      itemSku: 'BRR-002',
      clientName: 'Mr. Alexander Chen',
      clientEmail: 'alex.chen@gemcollector.com',
      clientPhone: '+1 (555) 987-6543',
      issuerName: 'Dr. Sarah Mitchell',
      issuerLicense: 'SSEF-CERT-67890',
      issuerOrganization: 'Swiss Gemmological Institute',
      certificateDate: '2024-01-12',
      expiryDate: '2026-01-12',
      status: 'verified',
      priority: 'high',
      digitalSignature: true,
      blockchainVerified: true,
      qrCode: 'QR-CERT-002',
      certificateDetails: {
        itemDescription: 'Exceptional Burmese ruby ring with no heat treatment',
        metal: '18K Yellow Gold',
        purity: 750,
        grossWeight: 8.7,
        netWeight: 8.2,
        stoneDetails: [
          {
            type: 'Ruby',
            carat: 5.15,
            color: 'Vivid Red',
            clarity: 'VVS',
            cut: 'Cushion',
            origin: 'Myanmar (Burma)'
          }
        ],
        photos: ['ruby1.jpg', 'ruby2.jpg'],
        measurements: {
          length: 12.8,
          width: 10.4,
          height: 7.2
        },
        craftsmanship: 'Modern setting with classic appeal',
        estimatedValue: 450000,
        insuranceValue: 540000,
        marketValue: 480000
      },
      verification: {
        verificationMethod: 'spectrometry',
        equipmentUsed: ['UV-Vis Spectrometer', 'FTIR', 'Raman Spectroscopy'],
        testResults: [],
        confidenceLevel: 99.5,
        verifiedBy: 'Dr. Sarah Mitchell',
        verificationDate: '2024-01-12',
        notes: ['No heat treatment detected', 'Burmese origin confirmed', 'Exceptional color saturation']
      },
      compliance: {
        standards: ['CIBJO Guidelines', 'LMHC Standards'],
        regulations: ['Responsible Mining Initiative'],
        certifyingBody: 'Swiss Gemmological Institute',
        accreditation: 'ISO/IEC 17025:2017',
        complianceNotes: 'Ethical sourcing verified'
      },
      digitalAssets: {
        certificatePdf: 'cert_002.pdf',
        photos: ['ruby_photo1.jpg'],
        videos: [],
        nftToken: 'NFT-CERT-002'
      },
      auditTrail: [
        {
          action: 'Certificate Created',
          performedBy: 'Dr. Sarah Mitchell',
          timestamp: '2024-01-08T10:00:00Z',
          details: 'Grading certificate initiated'
        },
        {
          action: 'Laboratory Analysis',
          performedBy: 'Lab Team',
          timestamp: '2024-01-12T13:00:00Z',
          details: 'Complete gemological analysis'
        }
      ],
      createdAt: '2024-01-08',
      updatedAt: '2024-01-12',
      location: 'Secure Display',
      notes: ['Exceptional natural ruby', 'No treatment documentation']
    },
    {
      id: '3',
      certificateNumber: 'CERT-2024-003',
      certificateType: 'appraisal',
      itemName: 'Edwardian Pearl Necklace',
      itemId: 'ITM-003',
      itemSku: 'EPN-003',
      clientName: 'Mrs. Elizabeth Hartwell',
      clientEmail: 'e.hartwell@vintage-collection.com',
      clientPhone: '+1 (555) 456-7890',
      issuerName: 'Prof. David Richardson',
      issuerLicense: 'ASA-CERT-54321',
      issuerOrganization: 'American Society of Appraisers',
      certificateDate: '2024-01-18',
      expiryDate: '2026-01-18',
      status: 'pending',
      priority: 'medium',
      digitalSignature: false,
      blockchainVerified: false,
      qrCode: 'QR-CERT-003',
      certificateDetails: {
        itemDescription: 'Edwardian natural pearl necklace with diamond clasp',
        metal: 'Platinum',
        purity: 950,
        grossWeight: 42.3,
        netWeight: 41.8,
        stoneDetails: [
          {
            type: 'Natural Pearl',
            carat: 0,
            color: 'Cream',
            clarity: 'AAA',
            cut: 'Round',
            origin: 'Persian Gulf'
          }
        ],
        photos: ['pearl1.jpg', 'pearl2.jpg'],
        measurements: {
          length: 45.0
        },
        craftsmanship: 'Edwardian period craftsmanship, circa 1905',
        historicalSignificance: 'Representative of Edwardian luxury jewelry',
        estimatedValue: 185000,
        insuranceValue: 220000,
        marketValue: 195000
      },
      verification: {
        verificationMethod: 'xray',
        equipmentUsed: ['X-ray imaging', 'Endoscope'],
        testResults: [],
        confidenceLevel: 98.2,
        verifiedBy: 'Prof. David Richardson',
        verificationDate: '2024-01-18',
        notes: ['Natural pearls confirmed', 'Period-appropriate construction', 'Minor restoration evidence']
      },
      compliance: {
        standards: ['USPAP Standards', 'ISA Guidelines'],
        regulations: ['CITES Appendix III'],
        certifyingBody: 'American Society of Appraisers',
        accreditation: 'ASA Accredited',
        complianceNotes: 'Compliant with appraisal standards'
      },
      digitalAssets: {
        certificatePdf: 'cert_003.pdf',
        photos: ['pearls1.jpg', 'pearls2.jpg'],
        videos: []
      },
      auditTrail: [
        {
          action: 'Appraisal Initiated',
          performedBy: 'Prof. David Richardson',
          timestamp: '2024-01-15T11:00:00Z',
          details: 'Estate appraisal commenced'
        }
      ],
      createdAt: '2024-01-15',
      updatedAt: '2024-01-18',
      location: 'Appraisal Lab',
      notes: ['Estate piece', 'Historical documentation available']
    }
  ]

  const certificateTypes = ['all', 'authenticity', 'appraisal', 'grading', 'origin', 'insurance', 'warranty']
  const statuses = ['all', 'draft', 'pending', 'issued', 'verified', 'expired', 'revoked']
  const priorities = ['all', 'low', 'medium', 'high', 'urgent']

  // Calculate summary metrics
  const totalCertificates = certificates.length
  const totalValue = certificates.reduce((sum, cert) => sum + cert.certificateDetails.estimatedValue, 0)
  const pendingCertificates = certificates.filter(cert => ['draft', 'pending'].includes(cert.status)).length
  const verifiedCertificates = certificates.filter(cert => cert.blockchainVerified).length

  // Filter and sort certificates
  const filteredCertificates = certificates
    .filter(cert => {
      const matchesSearch = cert.itemName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cert.certificateNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           cert.clientName.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesType = selectedType === 'all' || cert.certificateType === selectedType
      const matchesStatus = selectedStatus === 'all' || cert.status === selectedStatus
      const matchesPriority = selectedPriority === 'all' || cert.priority === selectedPriority
      return matchesSearch && matchesType && matchesStatus && matchesPriority
    })
    .sort((a, b) => {
      const direction = sortOrder === 'asc' ? 1 : -1
      switch (sortBy) {
        case 'certificateDate':
          return (new Date(a.certificateDate).getTime() - new Date(b.certificateDate).getTime()) * direction
        case 'value':
          return (a.certificateDetails.estimatedValue - b.certificateDetails.estimatedValue) * direction
        case 'client':
          return a.clientName.localeCompare(b.clientName) * direction
        case 'priority':
          const priorityOrder = { low: 1, medium: 2, high: 3, urgent: 4 }
          return (priorityOrder[a.priority] - priorityOrder[b.priority]) * direction
        default:
          return 0
      }
    })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'issued': return <CheckCircle className="jewelry-icon-success" size={16} />
      case 'verified': return <Shield className="jewelry-icon-success" size={16} />
      case 'pending': return <Clock className="jewelry-icon-warning" size={16} />
      case 'expired': return <AlertTriangle className="jewelry-icon-error" size={16} />
      case 'revoked': return <XCircle className="jewelry-icon-error" size={16} />
      case 'draft': return <FileText className="jewelry-icon-gold" size={16} />
      default: return null
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <Zap className="jewelry-icon-error" size={16} />
      case 'high': return <TrendingUp className="jewelry-icon-warning" size={16} />
      case 'medium': return <Target className="jewelry-icon-info" size={16} />
      case 'low': return <Activity className="jewelry-icon-success" size={16} />
      default: return null
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'authenticity': return <Shield className="jewelry-icon-gold" size={16} />
      case 'grading': return <Diamond className="jewelry-icon-gold" size={16} />
      case 'appraisal': return <DollarSign className="jewelry-icon-gold" size={16} />
      case 'origin': return <MapPin className="jewelry-icon-gold" size={16} />
      case 'insurance': return <Lock className="jewelry-icon-gold" size={16} />
      case 'warranty': return <Award className="jewelry-icon-gold" size={16} />
      default: return <FileText className="jewelry-icon-gold" size={16} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'issued': return 'jewelry-status-active'
      case 'verified': return 'jewelry-status-premium'
      case 'pending': return 'jewelry-status-pending'
      case 'expired': return 'jewelry-status-inactive'
      case 'revoked': return 'jewelry-status-inactive'
      case 'draft': return 'jewelry-status-pending'
      default: return 'jewelry-status-inactive'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700'
      case 'high': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300 border-orange-300 dark:border-orange-700'
      case 'medium': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700'
      case 'low': return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-300 dark:border-green-700'
      default: return 'bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700'
    }
  }

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
          {/* Page Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <h1 className="jewelry-heading text-4xl md:text-5xl mb-4">
              <Award className="inline-block mr-3 mb-2 jewelry-icon-gold" size={48} />
              Certification Center
            </h1>
            <p className="jewelry-text-luxury text-lg md:text-xl">
              Enterprise-grade jewelry certification and verification system
            </p>
          </motion.div>

          {/* Summary Metrics */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <div className="jewelry-glass-card jewelry-float p-6 text-center">
              <FileText className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{totalCertificates}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Total Certificates</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.1s' }}>
              <DollarSign className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">${(totalValue / 1000000).toFixed(1)}M</h3>
              <p className="jewelry-text-muted text-sm font-medium">Certified Value</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.2s' }}>
              <Clock className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{pendingCertificates}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Pending</p>
            </div>
            
            <div className="jewelry-glass-card jewelry-float p-6 text-center" style={{ animationDelay: '0.3s' }}>
              <Shield className="mx-auto mb-3 jewelry-icon-gold" size={32} />
              <h3 className="jewelry-text-high-contrast text-2xl font-bold">{verifiedCertificates}</h3>
              <p className="jewelry-text-muted text-sm font-medium">Blockchain Verified</p>
            </div>
          </motion.div>

          {/* Action Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="jewelry-glass-panel"
          >
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 items-center flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 jewelry-icon-gold" size={20} />
                  <input
                    type="text"
                    placeholder="Search certificates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="jewelry-input pl-10 w-64"
                  />
                </div>
                
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="jewelry-input"
                >
                  {certificateTypes.map(type => (
                    <option key={type} value={type}>
                      {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="jewelry-input"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status === 'all' ? 'All Status' : status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedPriority}
                  onChange={(e) => setSelectedPriority(e.target.value)}
                  className="jewelry-input"
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>
                      {priority === 'all' ? 'All Priorities' : priority.charAt(0).toUpperCase() + priority.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <Download className="jewelry-icon-gold" size={18} />
                  <span>Export</span>
                </button>
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <QrCode className="jewelry-icon-gold" size={18} />
                  <span>Verify</span>
                </button>
                <button className="jewelry-btn-secondary flex items-center space-x-2 px-4 py-2">
                  <BarChart3 className="jewelry-icon-gold" size={18} />
                  <span>Reports</span>
                </button>
                <button className="jewelry-btn-primary flex items-center space-x-2 px-4 py-2">
                  <Plus className="jewelry-icon-gold" size={18} />
                  <span>New Certificate</span>
                </button>
              </div>
            </div>

            {/* View Controls */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-4 pt-4 border-t border-jewelry-blue-200">
              <div className="flex items-center space-x-4">
                <span className="jewelry-text-luxury text-sm font-medium">Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="jewelry-input text-sm"
                >
                  <option value="certificateDate">Date</option>
                  <option value="value">Value</option>
                  <option value="client">Client</option>
                  <option value="priority">Priority</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="jewelry-btn-secondary p-2"
                >
                  {sortOrder === 'asc' ? <TrendingUp className="jewelry-icon-gold" size={16} /> : <TrendingUp className="jewelry-icon-gold rotate-180" size={16} />}
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <span className="jewelry-text-luxury text-sm font-medium">View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                >
                  <Layers size={16} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                >
                  <BarChart3 size={16} />
                </button>
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`p-2 rounded ${viewMode === 'kanban' ? 'jewelry-btn-primary' : 'jewelry-btn-secondary'}`}
                >
                  <Activity size={16} />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Certificates Display */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            className="jewelry-glass-panel"
          >
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredCertificates.map((certificate, index) => (
                  <motion.div
                    key={certificate.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    className="jewelry-glass-card jewelry-scale-hover p-6"
                  >
                    {/* Certificate Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          {getTypeIcon(certificate.certificateType)}
                          <h3 className="jewelry-text-high-contrast font-semibold text-lg">{certificate.itemName}</h3>
                          {getPriorityIcon(certificate.priority)}
                        </div>
                        <p className="jewelry-text-muted text-sm font-mono">{certificate.certificateNumber}</p>
                        <p className="jewelry-text-muted text-sm">{certificate.clientName}</p>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(certificate.status)}
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(certificate.status)}`}>
                            {certificate.status.toUpperCase()}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(certificate.priority)}`}>
                          {certificate.priority.toUpperCase()}
                        </span>
                        {certificate.blockchainVerified && (
                          <div className="flex items-center space-x-1">
                            <Shield className="jewelry-icon-success" size={12} />
                            <span className="text-xs jewelry-text-high-contrast">Blockchain</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Certificate Details */}
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="jewelry-text-muted text-xs">Type:</span>
                          <p className="jewelry-text-high-contrast text-sm font-medium">{certificate.certificateType.toUpperCase()}</p>
                        </div>
                        <div>
                          <span className="jewelry-text-muted text-xs">Issuer:</span>
                          <p className="jewelry-text-high-contrast text-sm font-medium">{certificate.issuerName}</p>
                        </div>
                        <div>
                          <span className="jewelry-text-muted text-xs">Issue Date:</span>
                          <p className="jewelry-text-high-contrast text-sm font-medium">{new Date(certificate.certificateDate).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <span className="jewelry-text-muted text-xs">Expires:</span>
                          <p className="jewelry-text-high-contrast text-sm font-medium">{new Date(certificate.expiryDate).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Item Details */}
                      <div>
                        <span className="jewelry-text-muted text-xs">Item Details:</span>
                        <p className="jewelry-text-high-contrast text-sm font-medium">
                          {certificate.certificateDetails.metal} - {certificate.certificateDetails.netWeight}g
                        </p>
                      </div>

                      {/* Stone Details */}
                      {certificate.certificateDetails.stoneDetails.length > 0 && (
                        <div>
                          <span className="jewelry-text-muted text-xs">Primary Stone:</span>
                          <p className="jewelry-text-high-contrast text-sm font-medium">
                            {certificate.certificateDetails.stoneDetails[0].carat > 0 ? 
                              `${certificate.certificateDetails.stoneDetails[0].carat}ct ` : ''}
                            {certificate.certificateDetails.stoneDetails[0].type} - {certificate.certificateDetails.stoneDetails[0].color} {certificate.certificateDetails.stoneDetails[0].clarity}
                          </p>
                        </div>
                      )}

                      {/* Valuation */}
                      <div className="grid grid-cols-2 gap-4 pt-2 border-t border-jewelry-blue-200">
                        <div>
                          <span className="jewelry-text-muted text-xs">Estimated Value:</span>
                          <p className="jewelry-text-high-contrast text-lg font-bold">${certificate.certificateDetails.estimatedValue.toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="jewelry-text-muted text-xs">Insurance Value:</span>
                          <p className="jewelry-text-high-contrast text-lg font-bold">${certificate.certificateDetails.insuranceValue.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>

                    {/* Verification Info */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="jewelry-text-muted">Confidence:</span>
                        <span className="jewelry-text-high-contrast font-medium">{certificate.verification.confidenceLevel}%</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="jewelry-text-muted">Method:</span>
                        <span className="jewelry-text-high-contrast">{certificate.verification.verificationMethod.toUpperCase()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-jewelry-blue-200">
                      <div className="flex items-center space-x-2">
                        <MapPin className="jewelry-icon-gold" size={14} />
                        <span className="jewelry-text-muted text-xs">{certificate.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => setSelectedCertificate(certificate)}
                          className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform"
                        >
                          <Eye className="jewelry-icon-gold" size={16} />
                        </button>
                        <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                          <Edit className="jewelry-icon-gold" size={16} />
                        </button>
                        <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                          <Download className="jewelry-icon-gold" size={16} />
                        </button>
                        <button className="p-2 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                          <QrCode className="jewelry-icon-gold" size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
              <div className="space-y-2">
                {/* List Header */}
                <div className="grid grid-cols-12 gap-4 p-4 jewelry-glass-card-subtle">
                  <div className="col-span-3 jewelry-text-luxury text-sm font-semibold">Certificate</div>
                  <div className="col-span-2 jewelry-text-luxury text-sm font-semibold">Type</div>
                  <div className="col-span-2 jewelry-text-luxury text-sm font-semibold">Client</div>
                  <div className="col-span-2 jewelry-text-luxury text-sm font-semibold">Value</div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">Status</div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">Priority</div>
                  <div className="col-span-1 jewelry-text-luxury text-sm font-semibold">Actions</div>
                </div>

                {/* List Items */}
                {filteredCertificates.map((certificate, index) => (
                  <motion.div
                    key={certificate.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="grid grid-cols-12 gap-4 p-4 jewelry-glass-card hover:scale-[1.01] transition-transform"
                  >
                    <div className="col-span-3">
                      <h3 className="jewelry-text-high-contrast font-medium">{certificate.itemName}</h3>
                      <p className="jewelry-text-muted text-sm font-mono">{certificate.certificateNumber}</p>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(certificate.certificateType)}
                        <span className="jewelry-text-high-contrast">{certificate.certificateType.toUpperCase()}</span>
                      </div>
                    </div>
                    <div className="col-span-2 jewelry-text-high-contrast">{certificate.clientName}</div>
                    <div className="col-span-2 jewelry-text-high-contrast font-bold">${certificate.certificateDetails.estimatedValue.toLocaleString()}</div>
                    <div className="col-span-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(certificate.status)}`}>
                        {certificate.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getPriorityColor(certificate.priority)}`}>
                        {certificate.priority.toUpperCase()}
                      </span>
                    </div>
                    <div className="col-span-1 flex items-center space-x-1">
                      <button className="p-1 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                        <Eye className="jewelry-icon-gold" size={14} />
                      </button>
                      <button className="p-1 rounded jewelry-btn-secondary hover:scale-105 transition-transform">
                        <Download className="jewelry-icon-gold" size={14} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {/* Kanban View */}
            {viewMode === 'kanban' && (
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {['draft', 'pending', 'issued', 'verified', 'expired', 'revoked'].map(status => (
                  <div key={status} className="jewelry-glass-card-subtle p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="jewelry-text-luxury font-semibold text-sm">{status.toUpperCase()}</h3>
                      <span className="jewelry-text-muted text-xs">
                        {filteredCertificates.filter(c => c.status === status).length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {filteredCertificates.filter(c => c.status === status).map(certificate => (
                        <div key={certificate.id} className="jewelry-glass-card p-3">
                          <h4 className="jewelry-text-high-contrast font-medium text-sm mb-1">{certificate.itemName}</h4>
                          <p className="jewelry-text-muted text-xs mb-2">{certificate.clientName}</p>
                          <p className="jewelry-text-high-contrast text-sm font-bold">${certificate.certificateDetails.estimatedValue.toLocaleString()}</p>
                          {certificate.blockchainVerified && (
                            <div className="flex items-center space-x-1 mt-2">
                              <Shield className="jewelry-icon-success" size={10} />
                              <span className="text-xs jewelry-text-high-contrast">Verified</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {filteredCertificates.length === 0 && (
              <div className="text-center py-12">
                <Award className="mx-auto mb-4 jewelry-icon-gold opacity-50" size={64} />
                <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">No Certificates Found</h3>
                <p className="jewelry-text-muted">Try adjusting your filters or create a new certificate.</p>
              </div>
            )}
          </motion.div>

          {/* Footer */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="text-center mt-12 mb-6"
          >
            <p className="text-jewelry-platinum-500 text-sm">
              Blockchain-secured certification powered by <span className="jewelry-text-luxury font-semibold">HERA Verification System</span>
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}