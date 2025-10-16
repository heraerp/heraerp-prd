'use client'

import React, { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import {
  ListTree,
  Package,
  TreePine,
  Hammer,
  Wrench,
  Ruler,
  Palette,
  AlertTriangle,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Plus,
  Edit,
  Eye,
  Copy,
  Download,
  Upload,
  FileText,
  Calculator,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Star,
  Award,
  Building2,
  MapPin,
  Phone,
  Mail,
  Globe,
  Layers,
  Box,
  Settings,
  Target,
  Zap,
  Activity,
  Calendar,
  DollarSign,
  Percent,
  Hash,
  ChevronRight,
  ChevronDown,
  Archive,
  Save,
  RefreshCw,
  AlertCircle,
  Info,
  Scissors,
  Droplets,
  Thermometer,
  Shield,
  Factory,
  Truck,
  Store,
  Users,
  HardHat
} from 'lucide-react'

export default function BOMPage() {
  const [bomItems, setBomItems] = useState([])
  const [products, setProducts] = useState([])
  const [materials, setMaterials] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [expandedItems, setExpandedItems] = useState({})
  const [selectedBOM, setSelectedBOM] = useState(null)

  // Enterprise-grade BOM data structures for furniture manufacturing
  const sampleBOMs = [
    {
      id: 'BOM-001',
      productCode: 'KFW-EXEC-TABLE-001',
      productName: 'Executive Boardroom Table',
      version: '2.1',
      status: 'active',
      category: 'Premium Furniture',
      description: 'Handcrafted teak boardroom table with brass fittings',
      specifications: {
        dimensions: '14ft x 6ft x 30in',
        weight: '180 kg',
        capacity: '16 persons',
        finishType: 'High Gloss Polyurethane',
        style: 'Contemporary Executive'
      },
      metadata: {
        createdBy: 'Design Team Lead',
        createdDate: '2024-01-10',
        lastModified: '2024-01-15',
        approvedBy: 'Production Manager',
        approvalDate: '2024-01-16',
        revision: 'R2.1 - Added cable management'
      },
      costing: {
        totalMaterialCost: 425000,
        laborCost: 89000,
        overheadCost: 34000,
        totalCost: 548000,
        sellingPrice: 850000,
        profitMargin: 55.1,
        costBreakdown: {
          wood: 375000,
          hardware: 35000,
          finish: 15000,
          assembly: 89000,
          overhead: 34000
        }
      },
      production: {
        standardTime: 36,
        setupTime: 4,
        cycleTime: 32,
        skillLevel: 'Master Craftsman',
        workstation: 'Premium Assembly Section',
        qualityControlPoints: 8,
        testingRequired: true
      },
      compliance: {
        environmentalRating: 'A+',
        certifications: ['FSC Certified', 'Fire Safety Standard'],
        exportApproved: true,
        safetyCompliance: true,
        qualityStandard: 'ISO 9001'
      },
      components: [
        {
          id: 'COMP-001',
          level: 1,
          type: 'assembly',
          itemCode: 'TABLE-TOP-ASSY',
          description: 'Table Top Assembly',
          quantity: 1,
          unit: 'piece',
          materialType: 'assembly',
          isParent: true,
          children: [
            {
              id: 'COMP-001-01',
              level: 2,
              type: 'material',
              itemCode: 'TEAK-PLANK-14FT',
              description: 'Premium Teak Plank 14ft x 6ft x 2in',
              quantity: 3,
              unit: 'pieces',
              materialType: 'primary',
              specifications: {
                woodType: 'Premium Teak',
                grade: 'Export Quality',
                moistureContent: '8-12%',
                grainPattern: 'Straight grain',
                treatment: 'Kiln dried'
              },
              supplier: 'Kerala Forest Corporation',
              unitCost: 95000,
              totalCost: 285000,
              leadTime: 14,
              availability: 'in_stock',
              qualityChecks: ['Moisture test', 'Grain inspection', 'Defect check'],
              alternativeMaterials: ['Mahogany Plank', 'Rosewood Plank'],
              wastagePercentage: 8,
              isParent: false
            },
            {
              id: 'COMP-001-02',
              level: 2,
              type: 'material',
              itemCode: 'WOOD-GLUE-PREMIUM',
              description: 'Premium Wood Adhesive',
              quantity: 0.5,
              unit: 'kg',
              materialType: 'consumable',
              specifications: {
                type: 'PVA Wood Glue',
                strength: 'High bond',
                dryTime: '30 minutes',
                fullCure: '24 hours'
              },
              supplier: 'Adhesive Solutions India',
              unitCost: 850,
              totalCost: 425,
              leadTime: 7,
              availability: 'in_stock',
              qualityChecks: ['Bond strength test'],
              wastagePercentage: 5,
              isParent: false
            },
            {
              id: 'COMP-001-03',
              level: 2,
              type: 'hardware',
              itemCode: 'TABLE-EDGE-BRASS',
              description: 'Brass Edge Trim 14ft',
              quantity: 2,
              unit: 'pieces',
              materialType: 'hardware',
              specifications: {
                material: 'Solid Brass',
                thickness: '3mm',
                finish: 'Polished',
                profile: 'Decorative edge'
              },
              supplier: 'Chennai Brass Works',
              unitCost: 4500,
              totalCost: 9000,
              leadTime: 10,
              availability: 'in_stock',
              qualityChecks: ['Thickness check', 'Finish quality'],
              wastagePercentage: 3,
              isParent: false
            }
          ]
        },
        {
          id: 'COMP-002',
          level: 1,
          type: 'assembly',
          itemCode: 'TABLE-BASE-ASSY',
          description: 'Table Base Assembly',
          quantity: 1,
          unit: 'piece',
          materialType: 'assembly',
          isParent: true,
          children: [
            {
              id: 'COMP-002-01',
              level: 2,
              type: 'material',
              itemCode: 'TEAK-LEG-SET',
              description: 'Turned Teak Legs Set of 4',
              quantity: 1,
              unit: 'set',
              materialType: 'primary',
              specifications: {
                woodType: 'Premium Teak',
                height: '29 inches',
                diameter: '4 inches',
                turningStyle: 'Traditional Kerala'
              },
              supplier: 'Traditional Crafts Kerala',
              unitCost: 48000,
              totalCost: 48000,
              leadTime: 18,
              availability: 'in_stock',
              qualityChecks: ['Dimensional check', 'Finish quality', 'Grain match'],
              alternativeMaterials: ['Mahogany Legs', 'Rosewood Legs'],
              wastagePercentage: 5,
              isParent: false
            },
            {
              id: 'COMP-002-02',
              level: 2,
              type: 'hardware',
              itemCode: 'BRASS-CORNER-BRACKET',
              description: 'Brass Corner Reinforcement Brackets',
              quantity: 8,
              unit: 'pieces',
              materialType: 'hardware',
              specifications: {
                material: 'Solid Brass',
                size: '4 inch x 4 inch',
                thickness: '5mm',
                finish: 'Antique brass'
              },
              supplier: 'Heritage Hardware Co',
              unitCost: 1200,
              totalCost: 9600,
              leadTime: 12,
              availability: 'in_stock',
              qualityChecks: ['Strength test', 'Finish consistency'],
              wastagePercentage: 2,
              isParent: false
            }
          ]
        },
        {
          id: 'COMP-003',
          level: 1,
          type: 'assembly',
          itemCode: 'CABLE-MGMT-ASSY',
          description: 'Cable Management System',
          quantity: 1,
          unit: 'set',
          materialType: 'assembly',
          isParent: true,
          children: [
            {
              id: 'COMP-003-01',
              level: 2,
              type: 'hardware',
              itemCode: 'CABLE-GROMMET-BRASS',
              description: 'Brass Cable Grommets',
              quantity: 6,
              unit: 'pieces',
              materialType: 'hardware',
              specifications: {
                material: 'Brass with rubber insert',
                diameter: '60mm',
                finish: 'Brushed brass',
                type: 'Flip-top design'
              },
              supplier: 'Modern Office Solutions',
              unitCost: 850,
              totalCost: 5100,
              leadTime: 8,
              availability: 'in_stock',
              qualityChecks: ['Fit test', 'Operation smoothness'],
              wastagePercentage: 0,
              isParent: false
            },
            {
              id: 'COMP-003-02',
              level: 2,
              type: 'hardware',
              itemCode: 'CABLE-TRAY-WOOD',
              description: 'Wooden Cable Management Tray',
              quantity: 1,
              unit: 'piece',
              materialType: 'hardware',
              specifications: {
                material: 'Matching teak wood',
                length: '12 feet',
                width: '4 inches',
                mounting: 'Under-table clips'
              },
              supplier: 'Internal Fabrication',
              unitCost: 3500,
              totalCost: 3500,
              leadTime: 5,
              availability: 'manufactured',
              qualityChecks: ['Dimension check', 'Finish match'],
              wastagePercentage: 10,
              isParent: false
            }
          ]
        },
        {
          id: 'COMP-004',
          level: 1,
          type: 'finishing',
          itemCode: 'FINISH-MATERIALS',
          description: 'Finishing Materials',
          quantity: 1,
          unit: 'set',
          materialType: 'finishing',
          isParent: true,
          children: [
            {
              id: 'COMP-004-01',
              level: 2,
              type: 'material',
              itemCode: 'POLYURETHANE-GLOSS',
              description: 'High Gloss Polyurethane Finish',
              quantity: 2,
              unit: 'liters',
              materialType: 'finishing',
              specifications: {
                type: 'Water-based polyurethane',
                gloss: 'High gloss 90%',
                durability: 'Commercial grade',
                dryTime: '4-6 hours'
              },
              supplier: 'Premium Finishes Ltd',
              unitCost: 1800,
              totalCost: 3600,
              leadTime: 5,
              availability: 'in_stock',
              qualityChecks: ['Viscosity test', 'Gloss level'],
              wastagePercentage: 15,
              isParent: false
            },
            {
              id: 'COMP-004-02',
              level: 2,
              type: 'material',
              itemCode: 'WOOD-STAIN-TEAK',
              description: 'Teak Wood Stain',
              quantity: 1,
              unit: 'liter',
              materialType: 'finishing',
              specifications: {
                color: 'Natural teak',
                type: 'Penetrating stain',
                base: 'Oil-based',
                coverage: '15 sq meters per liter'
              },
              supplier: 'Wood Care Products',
              unitCost: 650,
              totalCost: 650,
              leadTime: 3,
              availability: 'in_stock',
              qualityChecks: ['Color match', 'Penetration test'],
              wastagePercentage: 10,
              isParent: false
            },
            {
              id: 'COMP-004-03',
              level: 2,
              type: 'material',
              itemCode: 'SANDPAPER-ASSORTED',
              description: 'Sandpaper Assorted Grits',
              quantity: 1,
              unit: 'pack',
              materialType: 'consumable',
              specifications: {
                grits: '120, 220, 320, 400',
                type: 'Aluminum oxide',
                backing: 'Paper backed',
                size: '9 x 11 inches'
              },
              supplier: 'Abrasives India',
              unitCost: 450,
              totalCost: 450,
              leadTime: 2,
              availability: 'in_stock',
              qualityChecks: ['Grit consistency'],
              wastagePercentage: 20,
              isParent: false
            }
          ]
        }
      ],
      qualityStandards: {
        inspectionPoints: [
          'Wood grain matching',
          'Joint precision',
          'Finish smoothness',
          'Hardware alignment',
          'Cable management function',
          'Overall dimensional accuracy'
        ],
        testingProcedures: [
          'Load bearing test (250kg)',
          'Stability test',
          'Finish durability test',
          'Hardware operation test'
        ],
        acceptanceCriteria: {
          dimensionalTolerance: '±2mm',
          finishQuality: 'A Grade',
          hardwareAlignment: '±1mm',
          overallScore: '≥95%'
        }
      }
    },
    {
      id: 'BOM-002',
      productCode: 'KFW-CHAIR-EXEC-001',
      productName: 'Executive Chair Set (16 pieces)',
      version: '1.8',
      status: 'active',
      category: 'Seating',
      description: 'Matching executive chairs for boardroom table',
      specifications: {
        dimensions: '24in x 26in x 42in',
        weight: '18 kg each',
        seatHeight: 'Adjustable 17-21in',
        backrest: 'High back with lumbar support',
        style: 'Contemporary Executive'
      },
      metadata: {
        createdBy: 'Chair Design Specialist',
        createdDate: '2024-01-12',
        lastModified: '2024-01-18',
        approvedBy: 'Quality Manager',
        approvalDate: '2024-01-20',
        revision: 'R1.8 - Enhanced ergonomics'
      },
      costing: {
        totalMaterialCost: 384000,
        laborCost: 128000,
        overheadCost: 48000,
        totalCost: 560000,
        sellingPrice: 800000,
        profitMargin: 42.9,
        costBreakdown: {
          wood: 288000,
          upholstery: 64000,
          hardware: 32000,
          assembly: 128000,
          overhead: 48000
        }
      },
      production: {
        standardTime: 28,
        setupTime: 2,
        cycleTime: 26,
        skillLevel: 'Senior Craftsman',
        workstation: 'Chair Manufacturing Section',
        qualityControlPoints: 6,
        testingRequired: true
      },
      compliance: {
        environmentalRating: 'A',
        certifications: ['Ergonomic Standard', 'Fire Retardant'],
        exportApproved: true,
        safetyCompliance: true,
        qualityStandard: 'ISO 9001'
      },
      components: [
        {
          id: 'CHAIR-001',
          level: 1,
          type: 'assembly',
          itemCode: 'CHAIR-FRAME-ASSY',
          description: 'Chair Frame Assembly (per chair)',
          quantity: 16,
          unit: 'pieces',
          materialType: 'assembly',
          isParent: true,
          children: [
            {
              id: 'CHAIR-001-01',
              level: 2,
              type: 'material',
              itemCode: 'TEAK-CHAIR-FRAME',
              description: 'Teak Chair Frame Components',
              quantity: 16,
              unit: 'sets',
              materialType: 'primary',
              specifications: {
                woodType: 'Premium Teak',
                components: 'Back, seat, arms, legs',
                joinery: 'Mortise and tenon',
                finish: 'Sanded ready'
              },
              supplier: 'Frame Specialists Kerala',
              unitCost: 12500,
              totalCost: 200000,
              leadTime: 16,
              availability: 'in_stock',
              qualityChecks: ['Joint precision', 'Wood grade', 'Moisture content'],
              wastagePercentage: 8,
              isParent: false
            },
            {
              id: 'CHAIR-001-02',
              level: 2,
              type: 'material',
              itemCode: 'LEATHER-UPHOLSTERY',
              description: 'Premium Leather Upholstery',
              quantity: 32,
              unit: 'sq meters',
              materialType: 'upholstery',
              specifications: {
                type: 'Full grain leather',
                color: 'Executive black',
                thickness: '1.2-1.4mm',
                treatment: 'Scotchgard protected'
              },
              supplier: 'Premium Leather Crafts',
              unitCost: 2000,
              totalCost: 64000,
              leadTime: 12,
              availability: 'in_stock',
              qualityChecks: ['Thickness check', 'Color consistency', 'Flexibility test'],
              wastagePercentage: 12,
              isParent: false
            },
            {
              id: 'CHAIR-001-03',
              level: 2,
              type: 'hardware',
              itemCode: 'CHAIR-HARDWARE-SET',
              description: 'Chair Hardware Complete Set',
              quantity: 16,
              unit: 'sets',
              materialType: 'hardware',
              specifications: {
                swivel: 'Heavy duty ball bearing',
                gasLift: 'Pneumatic height adjustment',
                wheels: '5-star base with casters',
                screws: 'Stainless steel'
              },
              supplier: 'Office Furniture Hardware',
              unitCost: 2000,
              totalCost: 32000,
              leadTime: 8,
              availability: 'in_stock',
              qualityChecks: ['Operation smoothness', 'Load capacity'],
              wastagePercentage: 2,
              isParent: false
            }
          ]
        }
      ],
      qualityStandards: {
        inspectionPoints: [
          'Frame joint strength',
          'Upholstery alignment',
          'Hardware operation',
          'Ergonomic positioning',
          'Finish consistency',
          'Overall comfort'
        ],
        testingProcedures: [
          'Weight capacity test (150kg)',
          'Swivel smoothness test',
          'Height adjustment test',
          'Durability cycling test'
        ],
        acceptanceCriteria: {
          dimensionalTolerance: '±3mm',
          upholsteryTension: 'Uniform',
          hardwareSmooth: '100% operational',
          overallScore: '≥92%'
        }
      }
    },
    {
      id: 'BOM-003',
      productCode: 'KFW-DINING-TRAD-001',
      productName: 'Traditional Kerala Dining Set',
      version: '3.2',
      status: 'active',
      category: 'Traditional Furniture',
      description: 'Handcrafted traditional Kerala dining set with carved details',
      specifications: {
        tableDimensions: '8ft x 4ft x 30in',
        chairCount: '8 chairs',
        weight: '220 kg total',
        carvingStyle: 'Traditional Kerala motifs',
        style: 'Heritage Collection'
      },
      metadata: {
        createdBy: 'Traditional Craft Master',
        createdDate: '2024-01-05',
        lastModified: '2024-01-22',
        approvedBy: 'Heritage Design Head',
        approvalDate: '2024-01-23',
        revision: 'R3.2 - Enhanced weather resistance'
      },
      costing: {
        totalMaterialCost: 285000,
        laborCost: 156000,
        overheadCost: 42000,
        totalCost: 483000,
        sellingPrice: 720000,
        profitMargin: 49.1,
        costBreakdown: {
          wood: 240000,
          hardware: 18000,
          finish: 27000,
          carving: 156000,
          overhead: 42000
        }
      },
      production: {
        standardTime: 45,
        setupTime: 3,
        cycleTime: 42,
        skillLevel: 'Master Traditional Craftsman',
        workstation: 'Traditional Craft Section',
        qualityControlPoints: 10,
        testingRequired: true
      },
      compliance: {
        environmentalRating: 'A+',
        certifications: ['Traditional Craft Certified', 'Weather Resistant'],
        exportApproved: true,
        safetyCompliance: true,
        qualityStandard: 'Heritage Standard'
      },
      components: [
        {
          id: 'TRAD-001',
          level: 1,
          type: 'assembly',
          itemCode: 'DINING-TABLE-TRAD',
          description: 'Traditional Dining Table',
          quantity: 1,
          unit: 'piece',
          materialType: 'assembly',
          isParent: true,
          children: [
            {
              id: 'TRAD-001-01',
              level: 2,
              type: 'material',
              itemCode: 'ROSEWOOD-TABLE-TOP',
              description: 'Carved Rosewood Table Top',
              quantity: 1,
              unit: 'piece',
              materialType: 'primary',
              specifications: {
                woodType: 'Malabar Rosewood',
                thickness: '2.5 inches',
                carving: 'Traditional lotus and peacock motifs',
                finish: 'Natural oil finish'
              },
              supplier: 'Heritage Wood Crafters',
              unitCost: 145000,
              totalCost: 145000,
              leadTime: 25,
              availability: 'in_stock',
              qualityChecks: ['Carving detail', 'Wood grade', 'Finish quality'],
              wastagePercentage: 15,
              isParent: false
            },
            {
              id: 'TRAD-001-02',
              level: 2,
              type: 'material',
              itemCode: 'JACKFRUIT-BASE',
              description: 'Jackfruit Wood Base Structure',
              quantity: 1,
              unit: 'set',
              materialType: 'primary',
              specifications: {
                woodType: 'Seasoned Jackfruit',
                style: 'Traditional Kerala base',
                joinery: 'Traditional wooden joints',
                treatment: 'Natural termite resistance'
              },
              supplier: 'Local Traditional Crafters',
              unitCost: 58000,
              totalCost: 58000,
              leadTime: 20,
              availability: 'in_stock',
              qualityChecks: ['Joint strength', 'Stability', 'Traditional authenticity'],
              wastagePercentage: 10,
              isParent: false
            }
          ]
        },
        {
          id: 'TRAD-002',
          level: 1,
          type: 'assembly',
          itemCode: 'DINING-CHAIRS-TRAD',
          description: 'Traditional Dining Chairs Set',
          quantity: 8,
          unit: 'pieces',
          materialType: 'assembly',
          isParent: true,
          children: [
            {
              id: 'TRAD-002-01',
              level: 2,
              type: 'material',
              itemCode: 'ROSEWOOD-CHAIR-FRAME',
              description: 'Hand-carved Chair Frames',
              quantity: 8,
              unit: 'pieces',
              materialType: 'primary',
              specifications: {
                woodType: 'Rosewood',
                backrest: 'Carved traditional patterns',
                seat: 'Woven cane insert',
                legs: 'Turned traditional style'
              },
              supplier: 'Master Carvers Collective',
              unitCost: 8500,
              totalCost: 68000,
              leadTime: 30,
              availability: 'in_stock',
              qualityChecks: ['Carving precision', 'Cane weaving', 'Structural integrity'],
              wastagePercentage: 12,
              isParent: false
            },
            {
              id: 'TRAD-002-02',
              level: 2,
              type: 'material',
              itemCode: 'CANE-WEAVING',
              description: 'Traditional Cane Seat Weaving',
              quantity: 8,
              unit: 'pieces',
              materialType: 'natural',
              specifications: {
                material: 'Natural rattan cane',
                pattern: 'Traditional Kerala weaving',
                treatment: 'Natural water resistance',
                durability: 'Heavy use rated'
              },
              supplier: 'Cane Craft Specialists',
              unitCost: 1200,
              totalCost: 9600,
              leadTime: 15,
              availability: 'in_stock',
              qualityChecks: ['Weave tightness', 'Pattern consistency', 'Edge finishing'],
              wastagePercentage: 8,
              isParent: false
            }
          ]
        }
      ],
      qualityStandards: {
        inspectionPoints: [
          'Traditional carving authenticity',
          'Wood joint precision',
          'Cane weaving quality',
          'Finish consistency',
          'Structural stability',
          'Cultural accuracy'
        ],
        testingProcedures: [
          'Load bearing test',
          'Weather resistance test',
          'Traditional craft verification',
          'Finish durability test'
        ],
        acceptanceCriteria: {
          carvingDetail: 'Master level',
          structuralIntegrity: '100%',
          finishQuality: 'A+ Grade',
          overallScore: '≥96%'
        }
      }
    }
  ]

  const sampleMaterials = [
    {
      id: 'MAT-001',
      code: 'TEAK-PREMIUM-001',
      name: 'Premium Teak Wood',
      category: 'primary_material',
      type: 'wood',
      specifications: {
        species: 'Tectona grandis',
        grade: 'Export Quality',
        moistureContent: '8-12%',
        density: '0.65 g/cm³',
        origin: 'Kerala Forests'
      },
      currentStock: 15.5,
      unit: 'cubic meters',
      costPerUnit: 170000,
      supplier: 'Kerala Forest Corporation',
      leadTime: 14,
      qualityGrade: 'A+',
      certifications: ['FSC Certified', 'CITES Compliant']
    },
    {
      id: 'MAT-002',
      code: 'BRASS-HARDWARE-001',
      name: 'Solid Brass Hardware',
      category: 'hardware',
      type: 'metal',
      specifications: {
        material: 'Solid Brass',
        finish: 'Polished',
        corrosionResistance: 'Marine Grade',
        strength: 'Heavy Duty'
      },
      currentStock: 250,
      unit: 'pieces',
      costPerUnit: 450,
      supplier: 'Chennai Brass Works',
      leadTime: 10,
      qualityGrade: 'A',
      certifications: ['ISO 9001']
    },
    {
      id: 'MAT-003',
      code: 'LEATHER-PREMIUM-001',
      name: 'Premium Leather',
      category: 'upholstery',
      type: 'leather',
      specifications: {
        type: 'Full grain leather',
        thickness: '1.2-1.4mm',
        treatment: 'Scotchgard protected',
        color: 'Executive black'
      },
      currentStock: 85,
      unit: 'sq meters',
      costPerUnit: 2000,
      supplier: 'Premium Leather Crafts',
      leadTime: 12,
      qualityGrade: 'A+',
      certifications: ['Eco-friendly tanning']
    }
  ]

  const sampleProducts = [
    {
      id: 'PROD-001',
      code: 'KFW-EXEC-TABLE-001',
      name: 'Executive Boardroom Table',
      category: 'Premium Furniture',
      bomId: 'BOM-001',
      bomVersion: '2.1',
      status: 'active',
      totalCost: 548000,
      sellingPrice: 850000,
      profitMargin: 55.1,
      productionTime: 36,
      complexityLevel: 'high'
    },
    {
      id: 'PROD-002',
      code: 'KFW-CHAIR-EXEC-001',
      name: 'Executive Chair Set',
      category: 'Seating',
      bomId: 'BOM-002',
      bomVersion: '1.8',
      status: 'active',
      totalCost: 560000,
      sellingPrice: 800000,
      profitMargin: 42.9,
      productionTime: 28,
      complexityLevel: 'medium'
    },
    {
      id: 'PROD-003',
      code: 'KFW-DINING-TRAD-001',
      name: 'Traditional Kerala Dining Set',
      category: 'Traditional Furniture',
      bomId: 'BOM-003',
      bomVersion: '3.2',
      status: 'active',
      totalCost: 483000,
      sellingPrice: 720000,
      profitMargin: 49.1,
      productionTime: 45,
      complexityLevel: 'high'
    }
  ]

  useEffect(() => {
    setBomItems(sampleBOMs)
    setMaterials(sampleMaterials)
    setProducts(sampleProducts)
    
    // Initialize expanded state for first BOM
    const initialExpanded = {}
    sampleBOMs[0]?.components?.forEach(comp => {
      initialExpanded[comp.id] = true
    })
    setExpandedItems(initialExpanded)
    setSelectedBOM(sampleBOMs[0])
  }, [])

  const filteredBOMs = bomItems.filter(bom => {
    const matchesSearch = bom.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bom.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         bom.category.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = filterCategory === 'all' || bom.category.toLowerCase().includes(filterCategory.toLowerCase())
    return matchesSearch && matchesCategory
  })

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  const expandAll = () => {
    const allExpanded = {}
    selectedBOM?.components?.forEach(comp => {
      allExpanded[comp.id] = true
      if (comp.children) {
        comp.children.forEach(child => {
          allExpanded[child.id] = true
        })
      }
    })
    setExpandedItems(allExpanded)
  }

  const collapseAll = () => {
    setExpandedItems({})
  }

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-500/10 text-green-700 border-green-500/30',
      'draft': 'bg-amber-500/10 text-amber-700 border-amber-500/30',
      'obsolete': 'bg-red-500/10 text-red-700 border-red-500/30',
      'pending': 'bg-blue-500/10 text-blue-700 border-blue-500/30'
    }
    return colors[status] || colors.active
  }

  const getCategoryIcon = (category) => {
    const icons = {
      'Premium Furniture': Award,
      'Seating': Users,
      'Traditional Furniture': TreePine,
      'Office Furniture': Building2,
      'Residential Furniture': Factory
    }
    return icons[category] || Package
  }

  const getMaterialTypeIcon = (type) => {
    const icons = {
      'assembly': Box,
      'material': Package,
      'hardware': Settings,
      'finishing': Palette,
      'upholstery': Layers,
      'consumable': Droplets
    }
    return icons[type] || Package
  }

  const getAvailabilityColor = (availability) => {
    const colors = {
      'in_stock': 'bg-green-500/10 text-green-700 border-green-500/30',
      'low_stock': 'bg-amber-500/10 text-amber-700 border-amber-500/30',
      'out_of_stock': 'bg-red-500/10 text-red-700 border-red-500/30',
      'manufactured': 'bg-blue-500/10 text-blue-700 border-blue-500/30'
    }
    return colors[availability] || colors.in_stock
  }

  const calculateTotalBOMCost = (bom) => {
    let totalCost = 0
    bom.components?.forEach(comp => {
      if (comp.children) {
        comp.children.forEach(child => {
          totalCost += child.totalCost || 0
        })
      } else {
        totalCost += comp.totalCost || 0
      }
    })
    return totalCost
  }

  const getTotalBOMItems = () => {
    return bomItems.length
  }

  const getActiveBOMs = () => {
    return bomItems.filter(bom => bom.status === 'active').length
  }

  const getTotalMaterialCost = () => {
    return bomItems.reduce((sum, bom) => sum + (bom.costing?.totalMaterialCost || 0), 0)
  }

  const getAverageMargin = () => {
    const margins = bomItems.map(bom => bom.costing?.profitMargin || 0)
    return margins.length > 0 ? (margins.reduce((a, b) => a + b, 0) / margins.length).toFixed(1) : 0
  }

  const renderBOMHierarchy = (components, level = 1) => {
    return components?.map((component) => {
      const isExpanded = expandedItems[component.id]
      const hasChildren = component.children && component.children.length > 0
      const TypeIcon = getMaterialTypeIcon(component.type)
      
      return (
        <div key={component.id} className="mb-2">
          <div 
            className={`flex items-center gap-3 p-3 bg-white/5 rounded-lg cursor-pointer hover:bg-white/10 transition-colors ${
              level === 1 ? 'border border-blue-500/20' : level === 2 ? 'ml-6 border border-gray-500/20' : 'ml-12'
            }`}
            onClick={() => hasChildren && toggleExpanded(component.id)}
          >
            <div className="flex items-center gap-2 flex-1">
              {hasChildren && (
                <div className="w-4 h-4 flex items-center justify-center">
                  {isExpanded ? <ChevronDown className="h-3 w-3 text-gray-400" /> : <ChevronRight className="h-3 w-3 text-gray-400" />}
                </div>
              )}
              {!hasChildren && <div className="w-4 h-4"></div>}
              
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${
                level === 1 ? 'from-blue-500 to-cyan-500' : 
                level === 2 ? 'from-green-500 to-emerald-500' : 'from-purple-500 to-violet-500'
              } flex items-center justify-center`}>
                <TypeIcon className="h-4 w-4 text-white" />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-medium jewelry-text-luxury">{component.description}</h4>
                  <Badge variant="outline" className="text-xs">
                    {component.itemCode}
                  </Badge>
                  {component.availability && (
                    <Badge className={getAvailabilityColor(component.availability)}>
                      {component.availability.replace('_', ' ').charAt(0).toUpperCase() + component.availability.replace('_', ' ').slice(1)}
                    </Badge>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300">
                  <div>
                    <span className="font-medium text-gray-200">Qty:</span> {component.quantity} {component.unit}
                  </div>
                  {component.unitCost && (
                    <div>
                      <span className="font-medium text-gray-200">Unit Cost:</span> ₹{component.unitCost.toLocaleString()}
                    </div>
                  )}
                  {component.totalCost && (
                    <div>
                      <span className="font-medium text-gray-200">Total:</span> ₹{component.totalCost.toLocaleString()}
                    </div>
                  )}
                  {component.supplier && (
                    <div>
                      <span className="font-medium text-gray-200">Supplier:</span> {component.supplier}
                    </div>
                  )}
                </div>
                
                {component.specifications && (
                  <div className="mt-2">
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(component.specifications).slice(0, 3).map(([key, value]) => (
                        <Badge key={key} variant="outline" className="text-xs jewelry-badge-text">
                          {key}: {value}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
          
          {hasChildren && isExpanded && (
            <div className="mt-2">
              {renderBOMHierarchy(component.children, level + 1)}
            </div>
          )}
        </div>
      )
    })
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
                  <ListTree className="h-8 w-8 jewelry-text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold jewelry-text-luxury">Bill of Materials (BOM)</h1>
                  <p className="text-lg text-gray-300">Kerala Furniture Manufacturing BOM Management</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-500/10 text-green-700 border-green-500/30">
                  <Factory className="h-3 w-3 mr-1" />
                  Production Ready
                </Badge>
                <Button className="jewelry-glass-btn gap-2 jewelry-text-luxury hover:jewelry-text-gold">
                  <Plus className="h-4 w-4" />
                  Create BOM
                </Button>
              </div>
            </div>
          </div>

          {/* KPI Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <ListTree className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total BOMs</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getTotalBOMItems()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Active product BOMs</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Active BOMs</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getActiveBOMs()}</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Production ready</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-purple-500 to-violet-500 flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Total Material Cost</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">₹{(getTotalMaterialCost() / 100000).toFixed(1)}L</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">All active BOMs</p>
            </div>

            <div className="jewelry-glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 flex items-center justify-center">
                  <Percent className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-300">Avg Profit Margin</p>
                  <p className="text-2xl font-bold jewelry-text-luxury">{getAverageMargin()}%</p>
                </div>
              </div>
              <p className="text-xs text-gray-300">Across all products</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="jewelry-glass-card p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-300" />
                  <Input
                    placeholder="Search BOMs, products, or materials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 jewelry-glass-input"
                  />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterCategory === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('all')}
                  className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                >
                  All Categories
                </Button>
                <Button
                  variant={filterCategory === 'premium' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('premium')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <Award className="h-4 w-4" />
                  Premium
                </Button>
                <Button
                  variant={filterCategory === 'traditional' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('traditional')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <TreePine className="h-4 w-4" />
                  Traditional
                </Button>
                <Button
                  variant={filterCategory === 'seating' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterCategory('seating')}
                  className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                >
                  <Users className="h-4 w-4" />
                  Seating
                </Button>
              </div>
            </div>
          </div>

          <Tabs defaultValue="bom-list" className="space-y-4">
            <TabsList className="jewelry-glass-panel">
              <TabsTrigger value="bom-list" className="jewelry-glass-btn jewelry-text-luxury">BOM List</TabsTrigger>
              <TabsTrigger value="hierarchy" className="jewelry-glass-btn jewelry-text-luxury">BOM Hierarchy</TabsTrigger>
              <TabsTrigger value="materials" className="jewelry-glass-btn jewelry-text-luxury">Materials</TabsTrigger>
              <TabsTrigger value="analytics" className="jewelry-glass-btn jewelry-text-luxury">Analytics</TabsTrigger>
            </TabsList>

            {/* BOM List */}
            <TabsContent value="bom-list" className="space-y-4">
              <div className="space-y-4">
                {filteredBOMs.map((bom) => {
                  const CategoryIcon = getCategoryIcon(bom.category)
                  
                  return (
                    <div key={bom.id} className="jewelry-glass-card p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                            <CategoryIcon className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold jewelry-text-luxury">{bom.productName}</h3>
                              <Badge className={getStatusColor(bom.status)}>
                                {bom.status.charAt(0).toUpperCase() + bom.status.slice(1)}
                              </Badge>
                              <Badge variant="outline" className="text-xs jewelry-badge-text">
                                v{bom.version}
                              </Badge>
                              {bom.compliance?.exportApproved && (
                                <Badge className="bg-purple-500/10 text-purple-700 border-purple-500/30">
                                  <Globe className="h-3 w-3 mr-1" />
                                  Export Ready
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-300 mb-4">{bom.description}</p>
                            
                            {/* BOM Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium text-gray-200">Product Code:</span> {bom.productCode}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Category:</span> {bom.category}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Components:</span> {bom.components?.length || 0} main
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Skill Level:</span> {bom.production?.skillLevel}
                              </div>
                            </div>

                            {/* Cost Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium text-gray-200">Material Cost:</span> ₹{bom.costing?.totalMaterialCost?.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Total Cost:</span> ₹{bom.costing?.totalCost?.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Selling Price:</span> ₹{bom.costing?.sellingPrice?.toLocaleString()}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Profit Margin:</span> {bom.costing?.profitMargin}%
                              </div>
                            </div>

                            {/* Production Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-300 mb-4">
                              <div>
                                <span className="font-medium text-gray-200">Production Time:</span> {bom.production?.standardTime}h
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Workstation:</span> {bom.production?.workstation}
                              </div>
                              <div>
                                <span className="font-medium text-gray-200">Quality Points:</span> {bom.production?.qualityControlPoints}
                              </div>
                            </div>

                            {/* Key Specifications */}
                            <div className="mb-4">
                              <p className="text-sm font-medium jewelry-text-luxury mb-2">Key Specifications:</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {Object.entries(bom.specifications).slice(0, 3).map(([key, value]) => (
                                  <div key={key} className="text-xs text-gray-300">
                                    <span className="font-medium text-gray-200">{key}:</span> {value}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Certifications */}
                            {bom.compliance?.certifications && (
                              <div>
                                <p className="text-sm font-medium jewelry-text-luxury mb-2">Certifications:</p>
                                <div className="flex flex-wrap gap-2">
                                  {bom.compliance.certifications.map((cert, index) => (
                                    <Badge key={index} variant="outline" className="text-xs jewelry-badge-text">
                                      <Shield className="h-3 w-3 mr-1" />
                                      {cert}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 ml-4">
                          <Button 
                            size="sm" 
                            className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold"
                            onClick={() => setSelectedBOM(bom)}
                          >
                            <Eye className="h-3 w-3" />
                            View BOM
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Edit className="h-3 w-3" />
                            Edit
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Copy className="h-3 w-3" />
                            Clone
                          </Button>
                          <Button size="sm" variant="outline" className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                            <Download className="h-3 w-3" />
                            Export
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {/* BOM Hierarchy */}
            <TabsContent value="hierarchy" className="space-y-4">
              {selectedBOM && (
                <div className="space-y-4">
                  {/* BOM Header */}
                  <div className="jewelry-glass-card p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold jewelry-text-luxury">{selectedBOM.productName}</h2>
                        <p className="text-gray-300">{selectedBOM.productCode} - Version {selectedBOM.version}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={expandAll} className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                          <ChevronDown className="h-4 w-4" />
                          Expand All
                        </Button>
                        <Button size="sm" onClick={collapseAll} className="jewelry-glass-btn gap-1 jewelry-text-luxury hover:jewelry-text-gold">
                          <ChevronRight className="h-4 w-4" />
                          Collapse All
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-300">
                      <div>
                        <span className="font-medium text-gray-200">Total Cost:</span> ₹{selectedBOM.costing?.totalCost?.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium text-gray-200">Material Cost:</span> ₹{selectedBOM.costing?.totalMaterialCost?.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium text-gray-200">Production Time:</span> {selectedBOM.production?.standardTime}h
                      </div>
                      <div>
                        <span className="font-medium text-gray-200">Components:</span> {selectedBOM.components?.length || 0} main assemblies
                      </div>
                    </div>
                  </div>

                  {/* BOM Tree Structure */}
                  <div className="jewelry-glass-card p-6">
                    <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Component Hierarchy</h3>
                    <div className="space-y-2">
                      {renderBOMHierarchy(selectedBOM.components)}
                    </div>
                  </div>
                </div>
              )}
              
              {!selectedBOM && (
                <div className="jewelry-glass-card p-12 text-center">
                  <ListTree className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium jewelry-text-luxury mb-2">No BOM Selected</h3>
                  <p className="text-gray-300 mb-4">Select a BOM from the list to view its hierarchy</p>
                  <Button 
                    onClick={() => setSelectedBOM(bomItems[0])}
                    className="jewelry-glass-btn jewelry-text-luxury hover:jewelry-text-gold"
                  >
                    View First BOM
                  </Button>
                </div>
              )}
            </TabsContent>

            {/* Materials */}
            <TabsContent value="materials" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {materials.map((material) => (
                  <div key={material.id} className="jewelry-glass-card p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                          <Package className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold jewelry-text-luxury">{material.name}</h3>
                          <p className="text-sm text-gray-300">{material.code}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-500/10 text-blue-700 border-blue-500/30">
                        Grade {material.qualityGrade}
                      </Badge>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                        <div>
                          <span className="font-medium text-gray-200">Category:</span> {material.category.replace('_', ' ').charAt(0).toUpperCase() + material.category.replace('_', ' ').slice(1)}
                        </div>
                        <div>
                          <span className="font-medium text-gray-200">Type:</span> {material.type}
                        </div>
                        <div>
                          <span className="font-medium text-gray-200">Stock:</span> {material.currentStock} {material.unit}
                        </div>
                        <div>
                          <span className="font-medium text-gray-200">Cost:</span> ₹{material.costPerUnit.toLocaleString()}/{material.unit}
                        </div>
                        <div>
                          <span className="font-medium text-gray-200">Supplier:</span> {material.supplier}
                        </div>
                        <div>
                          <span className="font-medium text-gray-200">Lead Time:</span> {material.leadTime} days
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium jewelry-text-luxury mb-2">Specifications:</p>
                        <div className="grid grid-cols-1 gap-1">
                          {Object.entries(material.specifications).map(([key, value]) => (
                            <div key={key} className="text-xs text-gray-300">
                              <span className="font-medium text-gray-200">{key}:</span> {value}
                            </div>
                          ))}
                        </div>
                      </div>

                      {material.certifications && (
                        <div>
                          <p className="text-sm font-medium jewelry-text-luxury mb-2">Certifications:</p>
                          <div className="flex flex-wrap gap-2">
                            {material.certifications.map((cert, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Analytics */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Cost Analysis */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Cost Analysis</h3>
                  <div className="space-y-4">
                    {bomItems.map((bom, index) => (
                      <div key={bom.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                        <div>
                          <div className="font-medium jewelry-text-luxury">{bom.productName}</div>
                          <div className="text-sm text-gray-300">Material vs Total Cost</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold jewelry-text-luxury">₹{(bom.costing?.totalCost / 1000)?.toFixed(0)}K</div>
                          <div className="text-sm text-gray-300">
                            {((bom.costing?.totalMaterialCost / bom.costing?.totalCost) * 100)?.toFixed(0)}% material
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Margin Analysis */}
                <div className="jewelry-glass-card p-6">
                  <h3 className="text-lg font-semibold jewelry-text-luxury mb-4">Profitability Analysis</h3>
                  <div className="space-y-4">
                    <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                      <div className="flex items-center gap-2 text-green-700 font-medium">
                        <TrendingUp className="h-4 w-4" />
                        High Margin Products
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Executive table leads with 55.1% margin, ideal for premium positioning.
                      </p>
                    </div>
                    
                    <div className="p-3 bg-blue-500/10 rounded-lg border border-blue-500/30">
                      <div className="flex items-center gap-2 text-blue-700 font-medium">
                        <BarChart3 className="h-4 w-4" />
                        Material Cost Optimization
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Traditional furniture has potential for 8% cost reduction through bulk purchasing.
                      </p>
                    </div>

                    <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30">
                      <div className="flex items-center gap-2 text-amber-700 font-medium">
                        <AlertTriangle className="h-4 w-4" />
                        Production Complexity
                      </div>
                      <p className="text-sm text-gray-300 mt-1">
                        Traditional dining set requires 45h production time - consider process optimization.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Performance Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">₹10.9L</div>
                  <div className="text-sm text-gray-300">Total BOM Value</div>
                  <div className="text-xs text-gray-300 mt-1">Material cost across all BOMs</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">36.5h</div>
                  <div className="text-sm text-gray-300">Avg Production Time</div>
                  <div className="text-xs text-gray-300 mt-1">Per product average</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">49.0%</div>
                  <div className="text-sm text-gray-300">Average Margin</div>
                  <div className="text-xs text-gray-300 mt-1">Across all products</div>
                </div>
                <div className="jewelry-glass-card p-6 text-center">
                  <div className="text-3xl font-bold jewelry-text-gold">127</div>
                  <div className="text-sm text-gray-300">Total Components</div>
                  <div className="text-xs text-gray-300 mt-1">Unique materials tracked</div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}