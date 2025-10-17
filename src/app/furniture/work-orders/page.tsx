'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  ClipboardList,
  Factory,
  Hammer,
  TreePine,
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Target,
  Star,
  Zap,
  Award,
  MapPin,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Play,
  Pause,
  MoreHorizontal,
  TrendingUp,
  TrendingDown,
  Package,
  Truck,
  Building2,
  Phone,
  Mail,
  User,
  Settings,
  FileText,
  BarChart3,
  Activity,
  Timer,
  Wrench,
  ShoppingCart,
  DollarSign,
  Percent,
  Globe,
  Shield,
  Clipboard,
  HardHat,
  Ruler,
  Palette,
  Layers,
  CheckSquare,
  XCircle,
  RotateCcw,
  Archive,
  Send,
  Download,
  Upload,
  PrinterIcon,
  Share2
} from 'lucide-react'

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState([])
  const [materials, setMaterials] = useState([])
  const [craftsmen, setCraftsmen] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterPriority, setFilterPriority] = useState('all')
  const [selectedView, setSelectedView] = useState('grid')

  // Enterprise-grade work order data structure
  const sampleWorkOrders = [
    {
      id: 'WO-2024-001',
      workOrderNumber: 'KFW-WO-001',
      title: 'Executive Boardroom Table Set',
      description: 'Custom teak boardroom table with 16 matching chairs for corporate client',
      customerInfo: {
        name: 'ITC Grand Chola Chennai',
        contact: 'Rajesh Menon',
        phone: '+91 44 2220 0000',
        email: 'procurement@itchotels.in',
        address: '63, Mount Road, Chennai - 600032'
      },
      productDetails: {
        category: 'Commercial Furniture',
        type: 'Boardroom Set',
        specifications: {
          'Table Dimensions': '14 feet x 6 feet x 30 inches',
          'Chair Count': '16 executive chairs',
          'Wood Type': 'Premium Teak',
          'Finish': 'High Gloss Polyurethane',
          'Hardware': 'Brass fittings'
        },
        customizations: ['Company logo engraving', 'Cable management system', 'Leather inlay']
      },
      orderDetails: {
        quantity: 1,
        unitPrice: 850000,
        totalValue: 850000,
        currency: 'INR',
        deliveryMode: 'Installation included',
        paymentTerms: '40% advance, 40% on completion, 20% after installation'
      },
      timeline: {
        orderDate: '2024-01-10',
        startDate: '2024-01-15',
        dueDate: '2024-02-20',
        estimatedDays: 36,
        actualDays: 28,
        milestones: [
          { stage: 'Design Approval', date: '2024-01-18', status: 'completed' },
          { stage: 'Wood Preparation', date: '2024-01-22', status: 'completed' },
          { stage: 'Joinery Work', date: '2024-02-05', status: 'in_progress' },
          { stage: 'Finishing', date: '2024-02-12', status: 'pending' },
          { stage: 'Quality Check', date: '2024-02-18', status: 'pending' },
          { stage: 'Delivery & Installation', date: '2024-02-20', status: 'pending' }
        ]
      },
      resources: {
        assignedTeam: {
          leadCraftsman: 'Master Raman Nair',
          assistants: ['Suresh Kumar', 'Anitha Devi', 'Mohan Pillai'],
          supervisor: 'Krishnan Master',
          qualityInspector: 'Lakshmi Menon'
        },
        workstation: 'Premium Crafting Section A',
        tools: ['CNC Router', 'Hand Carving Tools', 'Sanding Station', 'Finishing Booth'],
        estimatedHours: 288,
        actualHours: 195
      },
      materials: {
        primary: [
          { item: 'Premium Teak Planks', quantity: '2.5 cubic meters', cost: 425000, supplier: 'Kerala Forest Corp' },
          { item: 'Brass Hardware Set', quantity: '1 set', cost: 35000, supplier: 'Chennai Metals' },
          { item: 'Premium Leather', quantity: '8 sq meters', cost: 24000, supplier: 'Leather Craft India' }
        ],
        consumables: [
          { item: 'Wood Polish', quantity: '5 liters', cost: 3500 },
          { item: 'Sandpaper Assorted', quantity: '20 sheets', cost: 1200 },
          { item: 'Wood Glue', quantity: '2 kg', cost: 800 }
        ],
        totalMaterialCost: 489500
      },
      status: 'in_progress',
      priority: 'high',
      progress: 68,
      qualityMetrics: {
        designAccuracy: 95,
        craftmanship: 92,
        finishQuality: 88,
        overallScore: 92
      },
      compliance: {
        isExport: false,
        certifications: ['FSC Certified Wood', 'Fire Safety Standards'],
        environmentalRating: 'A+',
        safetyCompliance: true
      },
      financials: {
        budgetedCost: 520000,
        actualCost: 489500,
        profitMargin: 42.3,
        costBreakdown: {
          materials: 489500,
          labor: 86400,
          overhead: 15600,
          total: 591500
        }
      },
      notes: [
        'Client requested additional brass detailing',
        'Wood grain selection approved by client',
        'Installation team confirmed for Feb 20'
      ],
      attachments: [
        'Technical Drawings.dwg',
        'Material Specifications.pdf',
        'Client Approval Email.msg'
      ],
      workflow: {
        approvals: [
          { stage: 'Design', approver: 'Design Head', date: '2024-01-18', status: 'approved' },
          { stage: 'Costing', approver: 'Finance Manager', date: '2024-01-19', status: 'approved' },
          { stage: 'Production', approver: 'Production Head', date: '2024-01-20', status: 'approved' }
        ],
        currentStage: 'Production',
        nextAction: 'Complete joinery work',
        blockers: []
      }
    },
    {
      id: 'WO-2024-002',
      workOrderNumber: 'KFW-WO-002',
      title: 'Traditional Kerala Dining Set',
      description: 'Handcrafted traditional Kerala style dining table with 8 chairs',
      customerInfo: {
        name: 'Heritage Resort Kumarakom',
        contact: 'Priya Nambiar',
        phone: '+91 481 252 4900',
        email: 'orders@heritageresorts.com',
        address: 'Kumarakom, Kottayam District, Kerala - 686563'
      },
      productDetails: {
        category: 'Hospitality Furniture',
        type: 'Dining Set',
        specifications: {
          'Table Size': '8 feet x 4 feet x 30 inches',
          'Chair Count': '8 traditional chairs',
          'Wood Type': 'Rosewood with Jackfruit accents',
          'Style': 'Traditional Kerala',
          'Carvings': 'Hand-carved traditional motifs'
        },
        customizations: ['Resort logo carving', 'Weather-resistant finish', 'Cushioned seats']
      },
      orderDetails: {
        quantity: 1,
        unitPrice: 320000,
        totalValue: 320000,
        currency: 'INR',
        deliveryMode: 'Resort delivery',
        paymentTerms: '50% advance, 50% on delivery'
      },
      timeline: {
        orderDate: '2024-01-12',
        startDate: '2024-01-18',
        dueDate: '2024-02-25',
        estimatedDays: 38,
        actualDays: 0,
        milestones: [
          { stage: 'Wood Selection', date: '2024-01-20', status: 'completed' },
          { stage: 'Carving Work', date: '2024-02-02', status: 'in_progress' },
          { stage: 'Assembly', date: '2024-02-15', status: 'pending' },
          { stage: 'Finishing', date: '2024-02-22', status: 'pending' },
          { stage: 'Delivery', date: '2024-02-25', status: 'pending' }
        ]
      },
      resources: {
        assignedTeam: {
          leadCraftsman: 'Gopalan Master',
          assistants: ['Radha Kumari', 'Biju Nair'],
          supervisor: 'Unni Master',
          qualityInspector: 'Sharada Nair'
        },
        workstation: 'Traditional Craft Section',
        tools: ['Hand Carving Tools', 'Traditional Joinery Tools', 'Finishing Station'],
        estimatedHours: 152,
        actualHours: 48
      },
      materials: {
        primary: [
          { item: 'Rosewood Planks', quantity: '1.8 cubic meters', cost: 216000, supplier: 'Wayanad Timber' },
          { item: 'Jackfruit Wood', quantity: '0.5 cubic meters', cost: 22500, supplier: 'Local Suppliers' },
          { item: 'Traditional Hardware', quantity: '1 set', cost: 8500, supplier: 'Heritage Metals' }
        ],
        consumables: [
          { item: 'Natural Wood Stain', quantity: '3 liters', cost: 2100 },
          { item: 'Carving Tools Maintenance', quantity: '1 set', cost: 1500 }
        ],
        totalMaterialCost: 250600
      },
      status: 'in_progress',
      priority: 'medium',
      progress: 32,
      qualityMetrics: {
        designAccuracy: 94,
        craftmanship: 96,
        finishQuality: 0,
        overallScore: 90
      },
      compliance: {
        isExport: false,
        certifications: ['Traditional Craft Certified'],
        environmentalRating: 'A',
        safetyCompliance: true
      },
      financials: {
        budgetedCost: 280000,
        actualCost: 250600,
        profitMargin: 21.7,
        costBreakdown: {
          materials: 250600,
          labor: 38000,
          overhead: 9600,
          total: 298200
        }
      },
      notes: [
        'Traditional carving patterns selected',
        'Weather-resistant coating required for outdoor use'
      ],
      attachments: [
        'Traditional Design Reference.jpg',
        'Wood Selection Photos.zip'
      ],
      workflow: {
        approvals: [
          { stage: 'Design', approver: 'Traditional Craft Head', date: '2024-01-19', status: 'approved' },
          { stage: 'Material Selection', approver: 'Quality Head', date: '2024-01-20', status: 'approved' }
        ],
        currentStage: 'Carving',
        nextAction: 'Complete traditional motif carving',
        blockers: []
      }
    },
    {
      id: 'WO-2024-003',
      workOrderNumber: 'KFW-WO-003',
      title: 'Modern Office Workstation Units',
      description: 'Modular office workstations with integrated storage and cable management',
      customerInfo: {
        name: 'Infosys Trivandrum Campus',
        contact: 'Arjun Krishnan',
        phone: '+91 471 664 4000',
        email: 'facilities@infosys.com',
        address: 'Technopark, Trivandrum, Kerala - 695581'
      },
      productDetails: {
        category: 'Office Furniture',
        type: 'Workstation',
        specifications: {
          'Unit Count': '50 workstations',
          'Dimensions': '1200mm x 800mm x 750mm',
          'Material': 'Engineered wood with teak veneer',
          'Features': 'Cable management, CPU holder, drawer unit',
          'Finish': 'Matte laminate with teak edges'
        },
        customizations: ['Company branding', 'Ergonomic accessories', 'Power outlets']
      },
      orderDetails: {
        quantity: 50,
        unitPrice: 18500,
        totalValue: 925000,
        currency: 'INR',
        deliveryMode: 'Phased delivery and installation',
        paymentTerms: '30% advance, 50% on delivery, 20% after installation'
      },
      timeline: {
        orderDate: '2024-01-08',
        startDate: '2024-01-25',
        dueDate: '2024-03-15',
        estimatedDays: 50,
        actualDays: 0,
        milestones: [
          { stage: 'Prototype Approval', date: '2024-01-30', status: 'pending' },
          { stage: 'Bulk Production', date: '2024-02-15', status: 'pending' },
          { stage: 'Quality Testing', date: '2024-03-05', status: 'pending' },
          { stage: 'Phase 1 Delivery', date: '2024-03-10', status: 'pending' },
          { stage: 'Phase 2 Delivery', date: '2024-03-15', status: 'pending' }
        ]
      },
      resources: {
        assignedTeam: {
          leadCraftsman: 'Mahesh Varma',
          assistants: ['Team of 8 craftsmen'],
          supervisor: 'Rajesh Nair',
          qualityInspector: 'Deepa Menon'
        },
        workstation: 'Mass Production Unit',
        tools: ['CNC Machines', 'Edge Banding Machine', 'Assembly Line'],
        estimatedHours: 400,
        actualHours: 0
      },
      materials: {
        primary: [
          { item: 'Engineered Wood Panels', quantity: '200 panels', cost: 320000, supplier: 'Plywood Industries' },
          { item: 'Teak Veneer Sheets', quantity: '150 sq meters', cost: 135000, supplier: 'Veneer Suppliers' },
          { item: 'Hardware & Fittings', quantity: '50 sets', cost: 125000, supplier: 'Office Hardware Co' }
        ],
        consumables: [
          { item: 'Edge Banding Tape', quantity: '500 meters', cost: 8500 },
          { item: 'Assembly Hardware', quantity: '50 sets', cost: 15000 }
        ],
        totalMaterialCost: 603500
      },
      status: 'pending',
      priority: 'urgent',
      progress: 0,
      qualityMetrics: {
        designAccuracy: 0,
        craftmanship: 0,
        finishQuality: 0,
        overallScore: 0
      },
      compliance: {
        isExport: false,
        certifications: ['ISO 9001', 'Greenguard Certified'],
        environmentalRating: 'B+',
        safetyCompliance: true
      },
      financials: {
        budgetedCost: 650000,
        actualCost: 603500,
        profitMargin: 34.7,
        costBreakdown: {
          materials: 603500,
          labor: 100000,
          overhead: 25000,
          total: 728500
        }
      },
      notes: [
        'Prototype to be completed first for client approval',
        'Ergonomic testing required before bulk production'
      ],
      attachments: [
        'Workstation Design.pdf',
        'Ergonomic Guidelines.doc',
        'Infosys Brand Guidelines.pdf'
      ],
      workflow: {
        approvals: [
          { stage: 'Design', approver: 'Design Manager', date: '2024-01-22', status: 'pending' },
          { stage: 'Prototype', approver: 'Client', date: 'TBD', status: 'pending' }
        ],
        currentStage: 'Design Finalization',
        nextAction: 'Complete prototype for client approval',
        blockers: ['Waiting for final ergonomic specifications']
      }
    },
    {
      id: 'WO-2024-004',
      workOrderNumber: 'KFW-WO-004',
      title: 'Luxury Bedroom Suite',
      description: 'Premium bedroom set with king-size bed, wardrobes, and dresser',
      customerInfo: {
        name: 'Private Villa Project',
        contact: 'Architect Vasudeva Menon',
        phone: '+91 484 400 5000',
        email: 'vm.architect@gmail.com',
        address: 'Marine Drive, Kochi, Kerala - 682031'
      },
      productDetails: {
        category: 'Residential Furniture',
        type: 'Bedroom Suite',
        specifications: {
          'Bed Size': 'King Size (6x7 feet)',
          'Wardrobe': '3-door sliding wardrobe',
          'Dresser': 'With mirror and drawers',
          'Wood Type': 'Mahogany with brass accents',
          'Style': 'Contemporary luxury'
        },
        customizations: ['Hidden LED lighting', 'Soft-close mechanisms', 'Mirror TV panel']
      },
      orderDetails: {
        quantity: 1,
        unitPrice: 650000,
        totalValue: 650000,
        currency: 'INR',
        deliveryMode: 'White glove delivery and setup',
        paymentTerms: '50% advance, 30% on completion, 20% after installation'
      },
      timeline: {
        orderDate: '2024-01-14',
        startDate: '2024-01-28',
        dueDate: '2024-03-20',
        estimatedDays: 52,
        actualDays: 0,
        milestones: [
          { stage: 'Design Finalization', date: '2024-02-05', status: 'pending' },
          { stage: 'Material Procurement', date: '2024-02-12', status: 'pending' },
          { stage: 'Fabrication', date: '2024-03-05', status: 'pending' },
          { stage: 'Finishing & Assembly', date: '2024-03-15', status: 'pending' },
          { stage: 'Installation', date: '2024-03-20', status: 'pending' }
        ]
      },
      resources: {
        assignedTeam: {
          leadCraftsman: 'Premium Craft Team',
          assistants: ['Luxury Finish Specialists'],
          supervisor: 'Senior Master Craftsman',
          qualityInspector: 'Luxury Quality Inspector'
        },
        workstation: 'Premium Luxury Section',
        tools: ['Precision Machinery', 'Hand Finishing Tools', 'LED Installation Kit'],
        estimatedHours: 320,
        actualHours: 0
      },
      materials: {
        primary: [
          { item: 'Premium Mahogany Wood', quantity: '3.2 cubic meters', cost: 384000, supplier: 'Premium Timber Co' },
          { item: 'Brass Hardware Luxury', quantity: '1 set', cost: 85000, supplier: 'Luxury Fittings' },
          { item: 'LED Lighting System', quantity: '1 set', cost: 45000, supplier: 'Smart Home Systems' }
        ],
        consumables: [
          { item: 'Premium Wood Finish', quantity: '8 liters', cost: 12000 },
          { item: 'Soft-close Mechanisms', quantity: '12 pieces', cost: 18000 }
        ],
        totalMaterialCost: 544000
      },
      status: 'pending',
      priority: 'medium',
      progress: 0,
      qualityMetrics: {
        designAccuracy: 0,
        craftmanship: 0,
        finishQuality: 0,
        overallScore: 0
      },
      compliance: {
        isExport: false,
        certifications: ['Luxury Furniture Standards'],
        environmentalRating: 'A',
        safetyCompliance: true
      },
      financials: {
        budgetedCost: 580000,
        actualCost: 544000,
        profitMargin: 16.3,
        costBreakdown: {
          materials: 544000,
          labor: 96000,
          overhead: 24000,
          total: 664000
        }
      },
      notes: [
        'Client prefers dark mahogany finish',
        'Smart home integration required for LED controls'
      ],
      attachments: [
        'Luxury Design Concept.pdf',
        'Smart Home Integration Guide.pdf'
      ],
      workflow: {
        approvals: [
          { stage: 'Concept Design', approver: 'Architect', date: 'TBD', status: 'pending' }
        ],
        currentStage: 'Design Development',
        nextAction: 'Finalize design with architect',
        blockers: ['Waiting for smart home specifications']
      }
    },
    {
      id: 'WO-2024-005',
      workOrderNumber: 'KFW-WO-005',
      title: 'Restaurant Seating Solution',
      description: 'Custom restaurant chairs and tables for new chain outlet',
      customerInfo: {
        name: 'Saravana Bhavan Restaurants',
        contact: 'Operations Manager',
        phone: '+91 44 2434 4555',
        email: 'procurement@saravanabhavan.com',
        address: 'T. Nagar, Chennai, Tamil Nadu - 600017'
      },
      productDetails: {
        category: 'Commercial Furniture',
        type: 'Restaurant Furniture',
        specifications: {
          'Tables': '30 four-seater tables',
          'Chairs': '120 stackable chairs',
          'Material': 'Solid wood with commercial grade finish',
          'Design': 'South Indian traditional style',
          'Durability': 'Heavy commercial use rated'
        },
        customizations: ['Brand logo embedding', 'Easy maintenance finish', 'Stackable design']
      },
      orderDetails: {
        quantity: 150,
        unitPrice: 4500,
        totalValue: 675000,
        currency: 'INR',
        deliveryMode: 'Bulk delivery to restaurant',
        paymentTerms: '40% advance, 60% on delivery'
      },
      timeline: {
        orderDate: '2024-01-16',
        startDate: '2024-02-01',
        dueDate: '2024-03-25',
        estimatedDays: 53,
        actualDays: 0,
        milestones: [
          { stage: 'Sample Approval', date: '2024-02-08', status: 'pending' },
          { stage: 'Bulk Production Start', date: '2024-02-15', status: 'pending' },
          { stage: 'Mid-production Review', date: '2024-03-01', status: 'pending' },
          { stage: 'Final Quality Check', date: '2024-03-20', status: 'pending' },
          { stage: 'Delivery', date: '2024-03-25', status: 'pending' }
        ]
      },
      resources: {
        assignedTeam: {
          leadCraftsman: 'Production Team Lead',
          assistants: ['Bulk Production Team of 12'],
          supervisor: 'Commercial Furniture Supervisor',
          qualityInspector: 'Commercial Quality Team'
        },
        workstation: 'Commercial Production Line',
        tools: ['Production Line Machinery', 'Stackability Testing Rig'],
        estimatedHours: 480,
        actualHours: 0
      },
      materials: {
        primary: [
          { item: 'Commercial Grade Wood', quantity: '8 cubic meters', cost: 240000, supplier: 'Commercial Timber' },
          { item: 'Heavy Duty Hardware', quantity: '150 sets', cost: 67500, supplier: 'Commercial Hardware' },
          { item: 'Commercial Finish', quantity: '50 liters', cost: 37500, supplier: 'Industrial Coatings' }
        ],
        consumables: [
          { item: 'Production Consumables', quantity: '1 lot', cost: 25000 }
        ],
        totalMaterialCost: 370000
      },
      status: 'pending',
      priority: 'high',
      progress: 0,
      qualityMetrics: {
        designAccuracy: 0,
        craftmanship: 0,
        finishQuality: 0,
        overallScore: 0
      },
      compliance: {
        isExport: false,
        certifications: ['Commercial Furniture Standards', 'Fire Safety Certified'],
        environmentalRating: 'B',
        safetyCompliance: true
      },
      financials: {
        budgetedCost: 420000,
        actualCost: 370000,
        profitMargin: 45.2,
        costBreakdown: {
          materials: 370000,
          labor: 144000,
          overhead: 36000,
          total: 550000
        }
      },
      notes: [
        'Sample pieces required for client approval',
        'Stackability testing mandatory for space efficiency'
      ],
      attachments: [
        'Restaurant Layout Plan.pdf',
        'Brand Guidelines.pdf',
        'Commercial Standards.doc'
      ],
      workflow: {
        approvals: [
          { stage: 'Design', approver: 'Restaurant Manager', date: 'TBD', status: 'pending' }
        ],
        currentStage: 'Sample Preparation',
        nextAction: 'Complete sample pieces for approval',
        blockers: []
      }
    }
  ]

  const sampleCraftsmen = [
    {
      id: 'C001',
      name: 'Master Raman Nair',
      specialization: ['Premium Furniture', 'Traditional Carving', 'Teak Work'],
      experience: 25,
      efficiency: 96,
      currentWorkload: 2,
      maxCapacity: 3,
      location: 'Premium Section A',
      phone: '+91 94474 11111',
      status: 'busy',
      certifications: ['Master Craftsman', 'Traditional Arts'],
      hourlyRate: 450,
      qualityRating: 4.9
    },
    {
      id: 'C002',
      name: 'Gopalan Master',
      specialization: ['Traditional Furniture', 'Hand Carving', 'Rosewood'],
      experience: 22,
      efficiency: 94,
      currentWorkload: 1,
      maxCapacity: 2,
      location: 'Traditional Section',
      phone: '+91 94474 22222',
      status: 'busy',
      certifications: ['Traditional Craft Master'],
      hourlyRate: 420,
      qualityRating: 4.8
    },
    {
      id: 'C003',
      name: 'Mahesh Varma',
      specialization: ['Modern Furniture', 'CNC Operations', 'Mass Production'],
      experience: 15,
      efficiency: 92,
      currentWorkload: 0,
      maxCapacity: 4,
      location: 'Modern Production',
      phone: '+91 94474 33333',
      status: 'available',
      certifications: ['CNC Specialist', 'Production Management'],
      hourlyRate: 380,
      qualityRating: 4.7
    },
    {
      id: 'C004',
      name: 'Suresh Kumar',
      specialization: ['Finishing', 'Polishing', 'Quality Control'],
      experience: 18,
      efficiency: 88,
      currentWorkload: 3,
      maxCapacity: 4,
      location: 'Finishing Section',
      phone: '+91 94474 44444',
      status: 'busy',
      certifications: ['Finishing Specialist'],
      hourlyRate: 320,
      qualityRating: 4.6
    }
  ]

  const sampleMaterials = [
    {
      id: 'M001',
      name: 'Premium Teak Wood',
      category: 'Primary Material',
      currentStock: 15.5,
      unit: 'cubic meters',
      costPerUnit: 170000,
      supplier: 'Kerala Forest Corporation',
      quality: 'Export Grade',
      leadTime: 14
    },
    {
      id: 'M002',
      name: 'Rosewood Planks',
      category: 'Primary Material',
      currentStock: 8.2,
      unit: 'cubic meters',
      costPerUnit: 120000,
      supplier: 'Wayanad Timber',
      quality: 'Premium',
      leadTime: 21
    },
    {
      id: 'M003',
      name: 'Mahogany Wood',
      category: 'Primary Material',
      currentStock: 12.8,
      unit: 'cubic meters',
      costPerUnit: 95000,
      supplier: 'Premium Timber Co',
      quality: 'Luxury Grade',
      leadTime: 18
    }
  ]

  useEffect(() => {
    setWorkOrders(sampleWorkOrders)
    setCraftsmen(sampleCraftsmen)
    setMaterials(sampleMaterials)
  }, [])

  const filteredWorkOrders = workOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.workOrderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         order.customerInfo.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority
    return matchesSearch && matchesStatus && matchesPriority
  })

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-amber-500/10 text-amber-700 border-amber-500/30',
      'in_progress': 'bg-blue-500/10 text-blue-700 border-blue-500/30',
      'quality_check': 'bg-purple-500/10 text-purple-700 border-purple-500/30',
      'finishing': 'bg-orange-500/10 text-orange-700 border-orange-500/30',
      'completed': 'bg-green-500/10 text-green-700 border-green-500/30',
      'delayed': 'bg-red-500/10 text-red-700 border-red-500/30',
      'on_hold': 'bg-gray-500/10 text-gray-700 border-gray-500/30'
    }
    return colors[status] || colors.pending
  }

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-gray-500/10 text-gray-700 border-gray-500/30',
      'medium': 'bg-yellow-500/10 text-yellow-700 border-yellow-500/30',
      'high': 'bg-orange-500/10 text-orange-700 border-orange-500/30',
      'urgent': 'bg-red-500/10 text-red-700 border-red-500/30'
    }
    return colors[priority] || colors.medium
  }

  const getStatusIcon = (status) => {
    const icons = {
      'pending': Clock,
      'in_progress': Activity,
      'quality_check': CheckSquare,
      'finishing': Palette,
      'completed': CheckCircle,
      'delayed': AlertTriangle,
      'on_hold': Pause
    }
    return icons[status] || Clock
  }

  const getPriorityIcon = (priority) => {
    const icons = {
      'low': Target,
      'medium': Clock,
      'high': AlertCircle,
      'urgent': AlertTriangle
    }
    return icons[priority] || Target
  }

  const getTotalWorkOrderValue = () => {
    return workOrders.reduce((sum, order) => sum + order.orderDetails.totalValue, 0)
  }

  const getActiveWorkOrders = () => {
    return workOrders.filter(order => order.status === 'in_progress').length
  }

  const getPendingWorkOrders = () => {
    return workOrders.filter(order => order.status === 'pending').length
  }

  const getCompletedWorkOrders = () => {
    return workOrders.filter(order => order.status === 'completed').length
  }

  const getOverallProgress = () => {
    const totalProgress = workOrders.reduce((sum, order) => sum + order.progress, 0)
    return Math.round(totalProgress / workOrders.length)
  }

  return (
    <div className="min-h-screen">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Header */}
          <div className="jewelry-glass-card p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="jewelry-crown-glow p-3 rounded-xl">
                  <ClipboardList className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Work Orders Management</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Workshop Production System</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                  <Factory className="h-3 w-3 mr-1" />
                  Production Active
                </Badge>
                <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <Plus className="h-4 w-4" />
                  New Work Order
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Order Value</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(getTotalWorkOrderValue() / 100000).toFixed(1)}L</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Active pipeline value</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Active Orders</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getActiveWorkOrders()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Currently in production</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Pending Orders</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getPendingWorkOrders()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Awaiting production start</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Completed</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getCompletedWorkOrders()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">This month</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
                  <BarChart3 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Overall Progress</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getOverallProgress()}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Average completion</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="jewelry-glass-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    placeholder="Search work orders, customers, or products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 jewelry-glass-input"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterStatus === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('all')}
                  className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                >
                  All Status
                </Button>
                <Button
                  variant={filterStatus === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('pending')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <Clock className="h-4 w-4" />
                  Pending
                </Button>
                <Button
                  variant={filterStatus === 'in_progress' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus('in_progress')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <Activity className="h-4 w-4" />
                  In Progress
                </Button>
                <Button
                  variant={filterPriority === 'urgent' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterPriority(filterPriority === 'urgent' ? 'all' : 'urgent')}
                  className="jewelry-glass-btn gap-1 text-red-700 hover:text-red-600"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Urgent
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="orders" className="jewelry-glass-btn jewelry-text-luxury">Work Orders</TabsTrigger>
              <TabsTrigger value="production" className="jewelry-glass-btn jewelry-text-luxury">Production</TabsTrigger>
              <TabsTrigger value="resources" className="jewelry-glass-btn jewelry-text-luxury">Resources</TabsTrigger>
              <TabsTrigger value="analytics" className="jewelry-glass-btn jewelry-text-luxury">Analytics</TabsTrigger>
            </TabsList>

            {/* Work Orders */}
            <TabsContent value="orders" className="space-y-4">
              <div className="space-y-4">
                {filteredWorkOrders.map((order) => {
                  const StatusIcon = getStatusIcon(order.status)
                  const PriorityIcon = getPriorityIcon(order.priority)
                  
                  return (
                    <div key={order.id} className="jewelry-glass-card p-6">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <ClipboardList className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold jewelry-text-luxury">{order.title}</h3>
                              <Badge className={getStatusColor(order.status)}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {order.status.replace('_', ' ').charAt(0).toUpperCase() + order.status.replace('_', ' ').slice(1)}
                              </Badge>
                              <Badge className={getPriorityColor(order.priority)}>
                                <PriorityIcon className="h-3 w-3 mr-1" />
                                {order.priority.charAt(0).toUpperCase() + order.priority.slice(1)}
                              </Badge>
                              {order.compliance.isExport && (
                                <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/30">
                                  <Globe className="h-3 w-3 mr-1" />
                                  Export
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-300 mb-4">{order.description}</p>
                            
                            {/* Customer & Order Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium text-gray-200">Customer:</span> {order.customerInfo.name}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Order No:</span> {order.workOrderNumber}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Due Date:</span> {order.timeline.dueDate}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Order Value:</span> ₹{order.orderDetails.totalValue.toLocaleString()}
                              </div>
                            </div>

                            {/* Progress Bar */}
                            <div className="space-y-2 mb-4">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-200">Progress</span>
                                <span className="text-sm font-bold jewelry-text-luxury">{order.progress}%</span>
                              </div>
                              <Progress value={order.progress} className="h-2" />
                              <div className="flex justify-between text-xs text-gray-300">
                                <span>Started: {order.timeline.startDate}</span>
                                <span>Est. Days: {order.timeline.estimatedDays}</span>
                                <span>Due: {order.timeline.dueDate}</span>
                              </div>
                            </div>

                            {/* Production Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium text-gray-200">Lead Craftsman:</span> {order.resources.assignedTeam.leadCraftsman}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Workstation:</span> {order.resources.workstation}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Est. Hours:</span> {order.resources.estimatedHours}h
                              </div>
                            </div>

                            {/* Financial Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium text-gray-200">Material Cost:</span> ₹{order.materials.totalMaterialCost.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Total Cost:</span> ₹{order.financials.costBreakdown.total.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Profit Margin:</span> {order.financials.profitMargin}%
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Payment Terms:</span> {order.orderDetails.paymentTerms}
                              </div>
                            </div>

                            {/* Current Milestone */}
                            <div className="mb-4">
                              <p className="text-sm font-medium jewelry-text-luxury mb-2">Current Stage: {order.workflow.currentStage}</p>
                              <p className="text-sm text-gray-300">Next Action: {order.workflow.nextAction}</p>
                              {order.workflow.blockers.length > 0 && (
                                <div className="mt-2">
                                  <p className="text-sm font-medium text-red-400">Blockers:</p>
                                  {order.workflow.blockers.map((blocker, index) => (
                                    <p key={index} className="text-sm text-red-300">• {blocker}</p>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Key Specifications */}
                            <div className="mb-4">
                              <p className="text-sm font-medium jewelry-text-luxury mb-2">Key Specifications:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {Object.entries(order.productDetails.specifications).slice(0, 3).map(([key, value]) => (
                                  <div key={key} className="text-xs text-gray-300">
                                    <span className="font-medium text-gray-200">{key}:</span> {value}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Notes */}
                            {order.notes && order.notes.length > 0 && (
                              <div>
                                <p className="text-sm font-medium jewelry-text-luxury mb-2">Recent Notes:</p>
                                <div className="space-y-1">
                                  {order.notes.slice(0, 2).map((note, index) => (
                                    <div key={index} className="text-sm text-gray-300 flex items-start gap-2">
                                      <div className="w-1 h-1 bg-gray-400 rounded-full mt-2"></div>
                                      {note}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button size="sm" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Eye className="h-3 w-3" />
                            View Details
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          {order.status === 'pending' && (
                            <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 text-green-700">
                              <Play className="h-3 w-3" />
                              Start
                            </Button>
                          )}
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <MoreHorizontal className="h-3 w-3" />
                            More
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* Production Planning */}
            <TabsContent value="production" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Active Production */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Active Production Orders</h3>
                  <div className="space-y-4">
                    {workOrders.filter(order => order.status === 'in_progress').map((order) => (
                      <div key={order.id} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium jewelry-text-luxury">{order.title}</h4>
                          <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                            {order.progress}%
                          </Badge>
                        </div>
                        <Progress value={order.progress} className="h-2 mb-2" />
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>Lead: {order.resources.assignedTeam.leadCraftsman}</div>
                          <div>Due: {order.timeline.dueDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resource Allocation */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Craftsman Allocation</h3>
                  <div className="space-y-4">
                    {craftsmen.map((craftsman) => (
                      <div key={craftsman.id} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                            <div>
                              <h4 className="font-medium jewelry-text-luxury">{craftsman.name}</h4>
                              <p className="text-xs text-gray-300">{craftsman.specialization.join(', ')}</p>
                            </div>
                          </div>
                          <Badge className={
                            craftsman.status === 'available' ? 'bg-green-500/10 text-green-700 border-green-500/30' :
                            craftsman.status === 'busy' ? 'bg-red-500/10 text-red-700 border-red-500/30' :
                            'bg-gray-500/10 text-gray-700 border-gray-500/30'
                          }>
                            {craftsman.status.charAt(0).toUpperCase() + craftsman.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm text-gray-300">
                          <span>Workload: {craftsman.currentWorkload}/{craftsman.maxCapacity}</span>
                          <span>Efficiency: {craftsman.efficiency}%</span>
                        </div>
                        <Progress value={(craftsman.currentWorkload / craftsman.maxCapacity) * 100} className="h-2 mt-2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Resources */}
            <TabsContent value="resources" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Material Inventory */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Material Inventory Status</h3>
                  <div className="space-y-4">
                    {materials.map((material) => (
                      <div key={material.id} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium jewelry-text-luxury">{material.name}</h4>
                          <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                            {material.quality}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>Stock: {material.currentStock} {material.unit}</div>
                          <div>Cost: ₹{material.costPerUnit.toLocaleString()}/{material.unit}</div>
                          <div>Supplier: {material.supplier}</div>
                          <div>Lead Time: {material.leadTime} days</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Craftsman Performance */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Craftsman Performance</h3>
                  <div className="space-y-4">
                    {craftsmen.map((craftsman) => (
                      <div key={craftsman.id} className="p-4 bg-white/5 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-medium jewelry-text-luxury">{craftsman.name}</h4>
                            <p className="text-xs text-gray-300">{craftsman.experience} years experience</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-amber-500" />
                            <span className="font-medium jewelry-text-luxury">{craftsman.qualityRating}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
                          <div>Efficiency: {craftsman.efficiency}%</div>
                          <div>Rate: ₹{craftsman.hourlyRate}/hour</div>
                        </div>
                        <div className="mt-2">
                          <div className="flex flex-wrap gap-1">
                            {craftsman.specialization.map((skill, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Performance Metrics */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Production Performance</h3>
                  <div className="space-y-4">
                    {[
                      { metric: 'On-Time Delivery Rate', value: '92%', trend: '+3%', status: 'good' },
                      { metric: 'Average Order Value', value: '₹5.8L', trend: '+12%', status: 'good' },
                      { metric: 'Resource Utilization', value: '87%', trend: '+5%', status: 'good' },
                      { metric: 'Quality Score', value: '94.2%', trend: '+1.8%', status: 'excellent' }
                    ].map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="font-medium jewelry-text-luxury">{item.metric}</div>
                          <div className="text-sm text-gray-300">Performance indicator</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold jewelry-text-luxury">{item.value}</div>
                          <div className={`text-sm ${item.trend.includes('+') ? 'text-green-600' : 'text-red-600'}`}>
                            {item.trend}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Business Insights */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Business Insights</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <TrendingUp className="h-4 w-4" />
                        Premium Segment Growth
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Premium teak furniture orders increased 28% this quarter, driving higher margins.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <div className="flex items-center gap-2 text-blue-700 font-medium">
                        <Target className="h-4 w-4" />
                        Export Opportunities
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        3 new export inquiries from Middle East markets for traditional Kerala furniture.
                      </p>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <div className="flex items-center gap-2 text-amber-700 font-medium">
                        <Clock className="h-4 w-4" />
                        Production Optimization
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        CNC machine utilization can be improved by 15% with better scheduling.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">36.2 days</div>
                  <div className="text-sm text-gray-300">Avg Production Time</div>
                  <div className="text-xs text-gray-300 mt-1">Target: &lt;40 days</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">94.2%</div>
                  <div className="text-sm text-gray-300">Quality Score</div>
                  <div className="text-xs text-gray-300 mt-1">Target: &gt;90%</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">₹31.2L</div>
                  <div className="text-sm text-gray-300">Revenue This Month</div>
                  <div className="text-xs text-gray-300 mt-1">+18% vs last month</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">87%</div>
                  <div className="text-sm text-gray-300">Resource Utilization</div>
                  <div className="text-xs text-gray-300 mt-1">Target: 85-90%</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}