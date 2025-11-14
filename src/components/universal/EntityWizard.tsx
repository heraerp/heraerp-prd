'use client'

/**
 * Universal Entity Wizard Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.ENTITY_WIZARD.v1
 * 
 * Generic creation wizard for any entity type
 * Dynamically configures forms based on entity type and parameters
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, Sparkles, FileText, HelpCircle } from 'lucide-react'
import type { DynamicComponentProps } from '@/lib/hera/component-loader'
import { CashewEntitiesAPI, CashewEntityTypes, CashewSmartCodes } from '@/lib/cashew/api-client'
import { useSafeHERAAuth } from '@/components/auth/SafeHERAAuth'
import { UniversalEntityShell, useEntityShell } from './UniversalEntityShell'

interface EntityWizardProps extends DynamicComponentProps {
  entityType: string
}

export function EntityWizard({ 
  resolvedOperation, 
  orgId, 
  actorId, 
  entityType,
  searchParams 
}: EntityWizardProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const { organization } = useSafeHERAAuth()
  
  // Use the UniversalEntityShell state management
  const { 
    showAIPanel, 
    setShowAIPanel, 
    lastSaved, 
    updateLastSaved, 
    showToast 
  } = useEntityShell()

  const getEntityConfig = (type: string) => {
    const configs: Record<string, any> = {
      CUSTOMER: {
        title: 'Create Customer',
        description: 'Add a new customer to your database',
        icon: '👥',
        listPath: resolvedOperation.canonical_path.replace('/create', '/list'),
        steps: [
          {
            title: 'Basic Information',
            fields: [
              { name: 'name', label: 'Customer Name', type: 'text', required: true },
              { name: 'email', label: 'Email Address', type: 'email', required: true },
              { name: 'phone', label: 'Phone Number', type: 'tel', required: false },
              { name: 'company', label: 'Company', type: 'text', required: false }
            ]
          },
          {
            title: 'Address Details',
            fields: [
              { name: 'address', label: 'Street Address', type: 'textarea', required: false },
              { name: 'city', label: 'City', type: 'text', required: false },
              { name: 'state', label: 'State/Province', type: 'text', required: false },
              { name: 'zipCode', label: 'ZIP/Postal Code', type: 'text', required: false }
            ]
          },
          {
            title: 'Preferences',
            fields: [
              { name: 'category', label: 'Customer Category', type: 'select', options: ['Regular', 'VIP', 'Corporate'], required: true },
              { name: 'notes', label: 'Notes', type: 'textarea', required: false }
            ]
          }
        ]
      },
      VENDOR: {
        title: 'Create Vendor',
        description: 'Add a new vendor to your supplier network',
        icon: '🏢',
        listPath: resolvedOperation.canonical_path.replace('/create', '/list'),
        steps: [
          {
            title: 'Vendor Information',
            fields: [
              { name: 'name', label: 'Vendor Name', type: 'text', required: true },
              { name: 'contactName', label: 'Contact Person', type: 'text', required: true },
              { name: 'email', label: 'Email Address', type: 'email', required: true },
              { name: 'phone', label: 'Phone Number', type: 'tel', required: true }
            ]
          },
          {
            title: 'Business Details',
            fields: [
              { name: 'category', label: 'Vendor Category', type: 'select', options: ['Materials', 'Services', 'Equipment', 'Shipping'], required: true },
              { name: 'taxId', label: 'Tax ID', type: 'text', required: false },
              { name: 'paymentTerms', label: 'Payment Terms', type: 'select', options: ['Net 15', 'Net 30', 'Net 60', 'COD'], required: true }
            ]
          }
        ]
      },
      JEWELRY_APPRAISAL: {
        title: 'Create Jewelry Appraisal',
        description: 'Start a new jewelry appraisal process',
        icon: '💎',
        listPath: resolvedOperation.canonical_path.replace('/create', '/list'),
        steps: [
          {
            title: 'Item Details',
            fields: [
              { name: 'itemType', label: 'Item Type', type: 'select', options: ['Ring', 'Necklace', 'Bracelet', 'Earrings', 'Watch', 'Other'], required: true },
              { name: 'description', label: 'Item Description', type: 'textarea', required: true },
              { name: 'metalType', label: 'Metal Type', type: 'select', options: ['Gold', 'Silver', 'Platinum', 'Palladium', 'Other'], required: false },
              { name: 'gemstones', label: 'Gemstones', type: 'textarea', required: false }
            ]
          },
          {
            title: 'Customer & Service',
            fields: [
              { name: 'customerName', label: 'Customer Name', type: 'text', required: true },
              { name: 'appraisalType', label: 'Appraisal Type', type: 'select', options: ['Insurance', 'Estate', 'Resale', 'Donation'], required: true },
              { name: 'urgency', label: 'Urgency', type: 'select', options: ['Standard', 'Rush', 'Emergency'], required: true }
            ]
          }
        ]
      },
      
      // WMS Entity Configurations
      WMS_VEHICLE: {
        title: 'Create Vehicle',
        description: 'Add a new waste collection vehicle to the fleet',
        icon: '🚛',
        listPath: resolvedOperation.canonical_path.replace('/new', '/list'),
        steps: [
          {
            title: 'Vehicle Information',
            fields: [
              { name: 'vehicle_name', label: 'Vehicle Name', type: 'text', required: true, placeholder: 'WM-001 Collection Truck' },
              { name: 'license_plate', label: 'License Plate', type: 'text', required: true, placeholder: 'ABC-1234' },
              { name: 'vehicle_type', label: 'Vehicle Type', type: 'select', 
                options: ['COMPACTOR_TRUCK', 'REAR_LOADER', 'SIDE_LOADER', 'FRONT_LOADER', 'ROLL_OFF', 'RECYCLING_TRUCK'], 
                required: true }
            ]
          },
          {
            title: 'Specifications',
            fields: [
              { name: 'capacity_tons', label: 'Capacity (Tons)', type: 'number', required: true, min: 1, max: 50, placeholder: '25' },
              { name: 'year', label: 'Year', type: 'number', required: true, min: 2000, max: 2030, placeholder: '2023' },
              { name: 'fuel_efficiency', label: 'Fuel Efficiency (mpg)', type: 'number', required: false, min: 1, max: 25, placeholder: '8.2' }
            ]
          }
        ]
      },
      
      WMS_CUSTOMER: {
        title: 'Create Customer',
        description: 'Add a new waste management service customer',
        icon: '🏢',
        listPath: resolvedOperation.canonical_path.replace('/new', '/list'),
        steps: [
          {
            title: 'Basic Information',
            fields: [
              { name: 'customer_name', label: 'Customer Name', type: 'text', required: true, placeholder: 'ACME Corporation' },
              { name: 'customer_type', label: 'Customer Type', type: 'select', 
                options: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MUNICIPAL', 'CONSTRUCTION'], 
                required: true },
              { name: 'contact_person', label: 'Contact Person', type: 'text', required: true },
              { name: 'email', label: 'Email Address', type: 'email', required: true }
            ]
          },
          {
            title: 'Service Details',
            fields: [
              { name: 'service_frequency', label: 'Service Frequency', type: 'select', 
                options: ['DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'ON_DEMAND'], 
                required: true },
              { name: 'monthly_revenue', label: 'Monthly Revenue', type: 'number', required: false, min: 0, placeholder: '2500' },
              { name: 'special_requirements', label: 'Special Requirements', type: 'textarea', required: false }
            ]
          }
        ]
      },
      
      WMS_ROUTE: {
        title: 'Create Route',
        description: 'Plan a new waste collection route',
        icon: '🗺️',
        listPath: resolvedOperation.canonical_path.replace('/new', '/list'),
        steps: [
          {
            title: 'Route Information',
            fields: [
              { name: 'route_name', label: 'Route Name', type: 'text', required: true, placeholder: 'Downtown Commercial Route' },
              { name: 'route_code', label: 'Route Code', type: 'text', required: true, placeholder: 'RT-001' },
              { name: 'route_type', label: 'Route Type', type: 'select', 
                options: ['RESIDENTIAL', 'COMMERCIAL', 'INDUSTRIAL', 'MIXED', 'RECYCLING', 'HAZARDOUS'], 
                required: true }
            ]
          },
          {
            title: 'Planning Details',
            fields: [
              { name: 'total_stops', label: 'Total Stops', type: 'number', required: false, min: 1, placeholder: '25' },
              { name: 'estimated_duration', label: 'Estimated Duration (hours)', type: 'number', required: false, min: 0.5, placeholder: '6' },
              { name: 'optimization_notes', label: 'Optimization Notes', type: 'textarea', required: false }
            ]
          }
        ]
      },
      
      WMS_FACILITY: {
        title: 'Create Facility',
        description: 'Add a new waste processing facility',
        icon: '🏭',
        listPath: resolvedOperation.canonical_path.replace('/new', '/list'),
        steps: [
          {
            title: 'Facility Information',
            fields: [
              { name: 'facility_name', label: 'Facility Name', type: 'text', required: true, placeholder: 'Central Transfer Station' },
              { name: 'facility_code', label: 'Facility Code', type: 'text', required: true, placeholder: 'FAC-001' },
              { name: 'facility_type', label: 'Facility Type', type: 'select', 
                options: ['TRANSFER_STATION', 'PROCESSING_PLANT', 'RECYCLING_CENTER', 'LANDFILL', 'COMPOSTING_FACILITY', 'HAZMAT_FACILITY'], 
                required: true },
              { name: 'address', label: 'Address', type: 'textarea', required: false }
            ]
          },
          {
            title: 'Operations',
            fields: [
              { name: 'total_capacity', label: 'Total Capacity (tons/day)', type: 'number', required: false, min: 1, placeholder: '500' },
              { name: 'current_utilization', label: 'Current Utilization (%)', type: 'number', required: false, min: 0, max: 100, placeholder: '75' },
              { name: 'compliance_score', label: 'Compliance Score (%)', type: 'number', required: false, min: 0, max: 100, placeholder: '95' }
            ]
          }
        ]
      },
      
      WMS_CONTRACTOR: {
        title: 'Create Contractor',
        description: 'Add a new third-party service contractor',
        icon: '🤝',
        listPath: resolvedOperation.canonical_path.replace('/new', '/list'),
        steps: [
          {
            title: 'Contractor Information',
            fields: [
              { name: 'contractor_name', label: 'Contractor Name', type: 'text', required: true, placeholder: 'GreenWaste Services Inc.' },
              { name: 'contractor_code', label: 'Contractor Code', type: 'text', required: true, placeholder: 'CONT-001' },
              { name: 'contact_person', label: 'Contact Person', type: 'text', required: true },
              { name: 'email', label: 'Email Address', type: 'email', required: true }
            ]
          },
          {
            title: 'Contract Details',
            fields: [
              { name: 'service_type', label: 'Service Type', type: 'select', 
                options: ['COLLECTION', 'TRANSPORT', 'PROCESSING', 'MAINTENANCE', 'DISPOSAL', 'CONSULTING'], 
                required: true },
              { name: 'contract_value', label: 'Contract Value', type: 'number', required: false, min: 0, placeholder: '250000' },
              { name: 'performance_rating', label: 'Performance Rating', type: 'number', required: false, min: 1, max: 5, step: 0.1, placeholder: '4.5' }
            ]
          }
        ]
      },
      
      WM_ROUTE: {
        title: 'Create Waste Route',
        description: 'Plan a new waste collection route',
        icon: '🚛',
        listPath: resolvedOperation.canonical_path.replace('/create', '/list'),
        steps: [
          {
            title: 'Route Information',
            fields: [
              { name: 'routeName', label: 'Route Name', type: 'text', required: true },
              { name: 'zone', label: 'Collection Zone', type: 'select', options: ['Zone A', 'Zone B', 'Zone C', 'Zone D'], required: true },
              { name: 'frequency', label: 'Collection Frequency', type: 'select', options: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly'], required: true }
            ]
          },
          {
            title: 'Assignment',
            fields: [
              { name: 'driverName', label: 'Assigned Driver', type: 'text', required: true },
              { name: 'vehicleId', label: 'Vehicle ID', type: 'text', required: true },
              { name: 'estimatedTime', label: 'Estimated Duration (hours)', type: 'number', required: false }
            ]
          }
        ]
      },
      
      // Cashew Manufacturing Entity Types
      MATERIAL: {
        title: 'Create Material',
        description: 'Add a new material (raw nuts, packaging, consumables)',
        icon: '📦',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/cashew/materials/list',
        steps: [
          {
            title: 'Material Information',
            fields: [
              { name: 'materialName', label: 'Material Name', type: 'text', required: true, placeholder: 'e.g., Raw Cashew Nuts (Kerala Premium)' },
              { name: 'materialType', label: 'Material Type', type: 'select', options: ['RAW_NUT', 'KERNEL', 'PACKAGING', 'CONSUMABLE'], required: true },
              { name: 'uom', label: 'Unit of Measure', type: 'select', options: ['KG', 'BAG', 'CARTON', 'LITRE', 'PIECE'], required: true },
              { name: 'stdCostPerUom', label: 'Standard Cost per UOM (INR)', type: 'number', required: true, min: 0, step: 0.01, placeholder: '180.00' }
            ]
          },
          {
            title: 'Properties & Quality',
            fields: [
              { name: 'moisturePct', label: 'Moisture Percentage', type: 'number', required: false, min: 0, max: 100, step: 0.1, placeholder: '12.5' },
              { name: 'supplierCode', label: 'Supplier Code', type: 'text', required: false, placeholder: 'VND001' },
              { name: 'origin', label: 'Origin/Source', type: 'text', required: false, placeholder: 'Kerala, Kollam District' },
              { name: 'shelfLifeDays', label: 'Shelf Life (Days)', type: 'number', required: false, min: 1, placeholder: '365' }
            ]
          }
        ]
      },
      
      PRODUCT: {
        title: 'Create Product',
        description: 'Create a new cashew kernel grade',
        icon: '🥜',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/cashew/products/list',
        steps: [
          {
            title: 'Product Details',
            fields: [
              { name: 'grade', label: 'Cashew Grade', type: 'select', options: ['W180', 'W210', 'W240', 'W320', 'W450', 'LWP', 'SWP', 'DW', 'BB'], required: true },
              { name: 'packSizeKg', label: 'Pack Size (KG)', type: 'number', required: true, min: 1, max: 100, step: 0.1, placeholder: '50.0' },
              { name: 'stdYieldPct', label: 'Standard Yield %', type: 'number', required: true, min: 10, max: 50, step: 0.1, placeholder: '28.5' },
              { name: 'description', label: 'Product Description', type: 'text', required: false, placeholder: 'Premium whole white cashew kernels' }
            ]
          },
          {
            title: 'Costing & Export',
            fields: [
              { name: 'stdLabourPerKg', label: 'Standard Labour per KG (INR)', type: 'number', required: false, min: 0, step: 0.01, placeholder: '45.00' },
              { name: 'stdOverheadPerKg', label: 'Standard Overhead per KG (INR)', type: 'number', required: false, min: 0, step: 0.01, placeholder: '15.00' },
              { name: 'exportHsCode', label: 'Export HS Code', type: 'text', required: false, placeholder: '08013200' },
              { name: 'qualityGrade', label: 'Quality Grade', type: 'select', options: ['Premium', 'Standard', 'Commercial'], required: false },
              { name: 'targetMarkets', label: 'Target Markets', type: 'text', required: false, placeholder: 'USA, Europe, Middle East' }
            ]
          }
        ]
      },
      
      BATCH: {
        title: 'Create Production Batch',
        description: 'Plan a new cashew processing batch',
        icon: '🏭',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/cashew/batches/list',
        steps: [
          {
            title: 'Batch Information',
            fields: [
              { name: 'batchNo', label: 'Batch Number', type: 'text', required: true, placeholder: 'B-2024-001' },
              { name: 'productId', label: 'Target Product', type: 'select', options: ['W320', 'W240', 'W180', 'LWP', 'SWP'], required: true },
              { name: 'locationId', label: 'Production Location', type: 'select', options: ['Kollam Plant', 'Kochi Facility', 'Trivandrum Unit'], required: true },
              { name: 'startDate', label: 'Start Date', type: 'date', required: true }
            ]
          },
          {
            title: 'Production Planning',
            fields: [
              { name: 'targetOutputKg', label: 'Target Output (KG)', type: 'number', required: true, min: 100, max: 10000, step: 1, placeholder: '5000' },
              { name: 'rawMaterialKg', label: 'Raw Material Required (KG)', type: 'number', required: false, min: 0, step: 1, placeholder: '18000' },
              { name: 'stdYieldPct', label: 'Standard Yield %', type: 'number', required: false, min: 10, max: 50, step: 0.1, placeholder: '28.5' },
              { name: 'status', label: 'Initial Status', type: 'select', options: ['PLANNED', 'READY_TO_START'], required: true },
              { name: 'priority', label: 'Priority', type: 'select', options: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], required: false }
            ]
          }
        ]
      },
      
      WORK_CENTER: {
        title: 'Create Work Center',
        description: 'Set up a new cashew processing work center',
        icon: '⚙️',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/cashew/work-centers/list',
        steps: [
          {
            title: 'Work Center Information',
            fields: [
              { name: 'wcName', label: 'Work Center Name', type: 'text', required: true, placeholder: 'Steaming Line A' },
              { name: 'wcType', label: 'Work Center Type', type: 'select', options: ['STEAMING', 'DRYING', 'SHELLING', 'PEELING', 'GRADING', 'ROASTING', 'PACKING'], required: true },
              { name: 'capacityKgPerShift', label: 'Capacity (KG per Shift)', type: 'number', required: false, min: 100, max: 10000, step: 1, placeholder: '5000' },
              { name: 'location', label: 'Physical Location', type: 'text', required: false, placeholder: 'Building A, Floor 1' }
            ]
          },
          {
            title: 'Costing & Operations',
            fields: [
              { name: 'stdLabourRatePerHr', label: 'Standard Labour Rate/Hr (INR)', type: 'number', required: false, min: 0, step: 0.01, placeholder: '150.00' },
              { name: 'stdPowerRatePerHr', label: 'Standard Power Rate/Hr (INR)', type: 'number', required: false, min: 0, step: 0.01, placeholder: '25.00' },
              { name: 'crewSize', label: 'Standard Crew Size', type: 'number', required: false, min: 1, max: 20, step: 1, placeholder: '8' },
              { name: 'operatingHours', label: 'Operating Hours/Day', type: 'number', required: false, min: 1, max: 24, step: 0.5, placeholder: '16' }
            ]
          }
        ]
      },
      
      LOCATION: {
        title: 'Create Location',
        description: 'Set up a new plant or warehouse location',
        icon: '🏢',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/cashew/locations/list',
        steps: [
          {
            title: 'Location Information',
            fields: [
              { name: 'locationName', label: 'Location Name', type: 'text', required: true, placeholder: 'Kollam Processing Plant' },
              { name: 'locationType', label: 'Location Type', type: 'select', options: ['PLANT', 'WAREHOUSE', 'QUALITY_LAB', 'EXPORT_FACILITY'], required: true },
              { name: 'address', label: 'Address', type: 'textarea', required: false, placeholder: 'Industrial Area, Kollam, Kerala, India' },
              { name: 'capacity', label: 'Storage/Processing Capacity', type: 'text', required: false, placeholder: '1000 MT' }
            ]
          },
          {
            title: 'Operational Details',
            fields: [
              { name: 'managerId', label: 'Location Manager', type: 'text', required: false, placeholder: 'John Doe' },
              { name: 'phone', label: 'Contact Phone', type: 'tel', required: false, placeholder: '+91-474-1234567' },
              { name: 'email', label: 'Contact Email', type: 'email', required: false, placeholder: 'kollam@keralacashew.com' },
              { name: 'isActive', label: 'Status', type: 'select', options: ['Active', 'Inactive', 'Under_Maintenance'], required: true }
            ]
          }
        ]
      },
      
      BOM: {
        title: 'Create Bill of Materials',
        description: 'Define material requirements for production',
        icon: '📋',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/cashew/boms/list',
        steps: [
          {
            title: 'BOM Header',
            fields: [
              { name: 'productCode', label: 'Product Code', type: 'select', options: ['W320', 'W240', 'W180', 'LWP', 'SWP'], required: true },
              { name: 'bomUom', label: 'BOM UOM', type: 'select', options: ['KG', 'BATCH'], required: true },
              { name: 'stdBatchSizeKg', label: 'Standard Batch Size (KG)', type: 'number', required: true, min: 100, max: 5000, step: 1, placeholder: '1000' },
              { name: 'version', label: 'BOM Version', type: 'text', required: false, placeholder: 'v1.0' }
            ]
          },
          {
            title: 'Production Parameters',
            fields: [
              { name: 'scrapPct', label: 'Scrap Percentage', type: 'number', required: false, min: 0, max: 20, step: 0.1, placeholder: '5.0' },
              { name: 'yieldPct', label: 'Expected Yield %', type: 'number', required: false, min: 10, max: 50, step: 0.1, placeholder: '28.5' },
              { name: 'processTime', label: 'Processing Time (Hours)', type: 'number', required: false, min: 1, max: 48, step: 0.5, placeholder: '8.0' },
              { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true }
            ]
          }
        ]
      },
      
      COST_CENTER: {
        title: 'Create Cost Center',
        description: 'Set up a new cost center for tracking expenses',
        icon: '💰',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/cashew/cost-centers/list',
        steps: [
          {
            title: 'Cost Center Information',
            fields: [
              { name: 'centerName', label: 'Cost Center Name', type: 'text', required: true, placeholder: 'Production - Steaming' },
              { name: 'centerType', label: 'Center Type', type: 'select', options: ['PRODUCTION', 'ADMIN', 'MAINTENANCE', 'QUALITY', 'LOGISTICS'], required: true },
              { name: 'centerCode', label: 'Cost Center Code', type: 'text', required: false, placeholder: 'CC-PROD-STEAM-001' },
              { name: 'department', label: 'Department', type: 'select', options: ['Manufacturing', 'Quality_Control', 'Maintenance', 'Administration', 'Logistics'], required: false }
            ]
          },
          {
            title: 'Budget & Responsibility',
            fields: [
              { name: 'annualBudget', label: 'Annual Budget (INR)', type: 'number', required: false, min: 0, step: 1000, placeholder: '5000000' },
              { name: 'responsibleManager', label: 'Responsible Manager', type: 'text', required: false, placeholder: 'Production Manager' },
              { name: 'isActive', label: 'Status', type: 'select', options: ['Active', 'Inactive'], required: true },
              { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true }
            ]
          }
        ]
      },
      
      PROFIT_CENTER: {
        title: 'Create Profit Center',
        description: 'Set up a new profit center for reporting',
        icon: '📊',
        listPath: resolvedOperation.canonical_path?.replace('/create', '/list') || '/cashew/profit-centers/list',
        steps: [
          {
            title: 'Profit Center Information',
            fields: [
              { name: 'centerName', label: 'Profit Center Name', type: 'text', required: true, placeholder: 'Export Division - W Grades' },
              { name: 'centerCode', label: 'Profit Center Code', type: 'text', required: false, placeholder: 'PC-EXP-W-001' },
              { name: 'isReportableSegment', label: 'Reportable Segment', type: 'select', options: ['Yes', 'No'], required: true },
              { name: 'businessUnit', label: 'Business Unit', type: 'select', options: ['Export_Division', 'Domestic_Sales', 'Private_Label', 'Retail'], required: false }
            ]
          },
          {
            title: 'Financial Setup',
            fields: [
              { name: 'targetRevenue', label: 'Annual Revenue Target (INR)', type: 'number', required: false, min: 0, step: 100000, placeholder: '50000000' },
              { name: 'targetMargin', label: 'Target Profit Margin %', type: 'number', required: false, min: 0, max: 100, step: 0.1, placeholder: '25.0' },
              { name: 'responsibleManager', label: 'P&L Manager', type: 'text', required: false, placeholder: 'Export Sales Manager' },
              { name: 'effectiveDate', label: 'Effective Date', type: 'date', required: true }
            ]
          }
        ]
      }
    }
    
    return configs[type] || {
      title: `Create ${type}`,
      description: `Create a new ${type.toLowerCase().replace('_', ' ')} record`,
      icon: '📋',
      listPath: '/list',
      steps: [
        {
          title: 'Basic Information',
          fields: [
            { name: 'name', label: 'Name', type: 'text', required: true },
            { name: 'description', label: 'Description', type: 'textarea', required: false }
          ]
        }
      ]
    }
  }

  const config = getEntityConfig(entityType)
  const currentStep = config.steps[step - 1]
  const isLastStep = step === config.steps.length

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleNext = () => {
    if (!isLastStep) {
      setStep(prev => prev + 1)
    }
  }

  const handlePrevious = () => {
    if (step > 1) {
      setStep(prev => prev - 1)
    }
  }

  const validateCashewBusinessLogic = (entityType: string, formData: Record<string, any>): { valid: boolean; errors: string[] } => {
    const errors: string[] = []
    
    switch (entityType) {
      case 'MATERIAL':
        if (formData.moisturePct && (parseFloat(formData.moisturePct) < 0 || parseFloat(formData.moisturePct) > 100)) {
          errors.push('Moisture percentage must be between 0-100%')
        }
        if (formData.stdCostPerUom && parseFloat(formData.stdCostPerUom) <= 0) {
          errors.push('Standard cost must be greater than 0')
        }
        break
        
      case 'PRODUCT':
        const validGrades = ['W180', 'W210', 'W240', 'W320', 'W450', 'LWP', 'SWP', 'DW', 'BB']
        if (formData.grade && !validGrades.includes(formData.grade)) {
          errors.push(`Invalid cashew grade. Must be one of: ${validGrades.join(', ')}`)
        }
        if (formData.stdYieldPct && (parseFloat(formData.stdYieldPct) < 10 || parseFloat(formData.stdYieldPct) > 50)) {
          errors.push('Standard yield must be between 10-50% for cashew kernels')
        }
        if (formData.packSizeKg && parseFloat(formData.packSizeKg) <= 0) {
          errors.push('Pack size must be greater than 0 kg')
        }
        break
        
      case 'BATCH':
        if (formData.targetOutputKg && parseFloat(formData.targetOutputKg) <= 0) {
          errors.push('Target output must be greater than 0 kg')
        }
        if (formData.startDate && new Date(formData.startDate) > new Date()) {
          errors.push('Start date cannot be in the future')
        }
        break
        
      case 'WORK_CENTER':
        if (formData.capacityKgPerShift && parseFloat(formData.capacityKgPerShift) <= 0) {
          errors.push('Capacity must be greater than 0 kg per shift')
        }
        if (formData.stdLabourRatePerHr && parseFloat(formData.stdLabourRatePerHr) <= 0) {
          errors.push('Labour rate must be greater than 0 INR per hour')
        }
        break
    }
    
    return { valid: errors.length === 0, errors }
  }

  const generateEnhancedSmartCode = (entityType: string, formData: Record<string, any>): string => {
    const baseCode = CashewSmartCodes.entity(entityType)
    
    // Add specific variations for different cashew entity subtypes
    switch (entityType) {
      case 'MATERIAL':
        if (formData.materialType === 'RAW_NUT') return 'HERA.CASHEW.MATERIAL.RAW_NUT.v1'
        if (formData.materialType === 'PACKAGING') return 'HERA.CASHEW.MATERIAL.PACKAGING.v1'
        if (formData.materialType === 'CONSUMABLE') return 'HERA.CASHEW.MATERIAL.CONSUMABLE.v1'
        break
        
      case 'PRODUCT':
        if (formData.grade?.startsWith('W')) return 'HERA.CASHEW.PRODUCT.KERNEL.WHOLE.v1'
        if (formData.grade?.includes('LWP') || formData.grade?.includes('SWP')) return 'HERA.CASHEW.PRODUCT.KERNEL.PIECES.v1'
        break
        
      case 'WORK_CENTER':
        if (formData.wcType) return `HERA.CASHEW.WORK_CENTER.${formData.wcType}.v1`
        break
    }
    
    return baseCode
  }

  const showSuccessNotification = (entityType: string, entityData: any) => {
    // Professional toast notification instead of alert
    const message = `✅ ${entityType.replace('_', ' ')} "${entityData.entity_name}" created successfully!`
    
    // Create a temporary notification element
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity duration-500'
    notification.textContent = message
    document.body.appendChild(notification)
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      notification.style.opacity = '0'
      setTimeout(() => document.body.removeChild(notification), 500)
    }, 3000)
  }

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      // Validate cashew-specific business logic
      if (Object.values(CashewEntityTypes).includes(entityType as any)) {
        const validation = validateCashewBusinessLogic(entityType, formData)
        if (!validation.valid) {
          alert(`Validation errors:\n\n${validation.errors.join('\n')}`)
          setLoading(false)
          return
        }
      }
      
      // Use real HERA API for cashew entities, fallback to mock for others
      if (Object.values(CashewEntityTypes).includes(entityType as any) && organization?.id) {
        console.log(`[EntityWizard] Creating real cashew entity: ${entityType}`)
        
        // Generate entity code with business logic
        const entityCode = formData.code || formData.batchNo || formData.materialName || 
                          formData.grade || formData.wcName || formData.locationName || 
                          formData.productCode || formData.centerName || 
                          `${entityType}-${Date.now()}`
        
        // Generate enhanced smart code
        const smartCode = generateEnhancedSmartCode(entityType, formData)
        
        // Prepare entity data
        const entityData = {
          entity_type: entityType,
          entity_name: formData.name || formData.materialName || formData.grade || formData.wcName || formData.locationName || entityCode,
          entity_code: entityCode,
          smart_code: smartCode,
          organization_id: organization.id
        }
        
        // Prepare dynamic fields with enhanced type handling
        const dynamicFields = Object.entries(formData)
          .filter(([key, value]) => key !== 'name' && value !== undefined && value !== '')
          .map(([fieldName, fieldValue]) => {
            let fieldType: 'text' | 'number' | 'boolean' | 'date' = 'text'
            let processedValue = fieldValue
            
            // Intelligent type detection
            if (typeof fieldValue === 'number' || !isNaN(parseFloat(fieldValue))) {
              fieldType = 'number'
              processedValue = parseFloat(fieldValue)
            } else if (fieldValue === 'true' || fieldValue === 'false') {
              fieldType = 'boolean'
              processedValue = fieldValue === 'true'
            } else if (fieldName.includes('Date') && fieldValue) {
              fieldType = 'date'
            }
            
            return {
              field_name: fieldName,
              field_type: fieldType,
              field_value_text: fieldType === 'text' ? String(processedValue) : undefined,
              field_value_number: fieldType === 'number' ? Number(processedValue) : undefined,
              field_value_boolean: fieldType === 'boolean' ? Boolean(processedValue) : undefined,
              field_value_date: fieldType === 'date' ? fieldValue : undefined,
              smart_code: CashewSmartCodes.field(entityType, fieldName)
            }
          })
        
        const { data, error } = await CashewEntitiesAPI.createEntity(entityData, dynamicFields)
        
        if (error) {
          console.error(`[EntityWizard] Failed to create ${entityType}:`, error)
          alert(`Failed to create ${entityType}: ${error.message || 'Unknown error'}`)
          return
        }
        
        console.log(`[EntityWizard] Successfully created ${entityType}:`, data)
        showSuccessNotification(entityType, entityData)
      } else {
        // Non-cashew entities - simulate creation
        console.log(`[EntityWizard] Simulating creation for: ${entityType}`)
        await new Promise(resolve => setTimeout(resolve, 1500))
        console.log('Creating entity:', { entityType, formData, orgId, actorId })
        showSuccessNotification(entityType, { entity_name: formData.name || entityType })
      }
      
      // Redirect to list page after short delay
      setTimeout(() => {
        window.location.href = config.listPath
      }, 1500)
    } catch (error) {
      console.error('Error creating entity:', error)
      alert(`Error creating ${entityType}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  const renderField = (field: any) => {
    const value = formData[field.name] || ''
    
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => handleInputChange(field.name, e.target.value)}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="min-h-[80px]"
          />
        )
      
      case 'select':
        return (
          <Select value={value} onValueChange={(val) => handleInputChange(field.name, val)}>
            <SelectTrigger className={field.required && !value ? 'border-red-300' : ''}>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )
      
      default:
        return (
          <Input
            type={field.type || 'text'}
            value={value}
            onChange={(e) => {
              const newValue = field.type === 'number' ? e.target.value : e.target.value
              handleInputChange(field.name, newValue)
            }}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className={field.required && !value ? 'border-red-300' : ''}
            min={field.type === 'number' ? field.min || 0 : undefined}
            max={field.type === 'number' ? field.max : undefined}
            step={field.type === 'number' ? field.step || 'any' : undefined}
          />
        )
    }
  }

  // Define the three panels for UniversalEntityShell
  const leftPanelContent = (
    <div className="space-y-6">
      {/* Entity Info */}
      <div>
        <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-3">
          <span className="text-xl">{config.icon}</span>
          Entity Details
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <span className="font-medium text-gray-600">Type:</span>
            <br />
            <span className="text-gray-900">{entityType.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="font-medium text-gray-600">Smart Code:</span>
            <br />
            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
              {resolvedOperation.smart_code}
            </code>
          </div>
          <div>
            <span className="font-medium text-gray-600">Component:</span>
            <br />
            <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-800">
              {resolvedOperation.component_id}
            </code>
          </div>
        </div>
      </div>

      {/* Step Progress */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Progress</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Step {step} of {config.steps.length}</span>
            <span className="text-gray-600">{Math.round((step / config.steps.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${(step / config.steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Current Step Info */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Current Step</h3>
        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
          <p className="font-medium text-blue-900">{currentStep.title}</p>
          <p className="text-sm text-blue-700 mt-1">
            Complete the required fields to continue
          </p>
        </div>
      </div>

      {/* Steps Overview */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Steps</h3>
        <div className="space-y-2">
          {config.steps.map((stepItem: any, index: number) => (
            <div 
              key={index}
              className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                index + 1 === step 
                  ? 'bg-blue-100 border border-blue-200' 
                  : index + 1 < step 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                index + 1 === step 
                  ? 'bg-blue-600 text-white' 
                  : index + 1 < step 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-400 text-white'
              }`}>
                {index + 1}
              </div>
              <span className={`text-sm ${
                index + 1 === step ? 'font-medium text-blue-900' : 'text-gray-700'
              }`}>
                {stepItem.title}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const centerPanelContent = (
    <div className="p-6">
      {/* Form Step */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-2">{currentStep.title}</h2>
        <p className="text-gray-600">Complete the required fields to continue</p>
      </div>

      <div className="space-y-4 mb-8">
        {currentStep.fields.map((field: any) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderField(field)}
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-6 border-t border-gray-200">
        <Button 
          variant="outline" 
          onClick={handlePrevious}
          disabled={step === 1}
        >
          Previous
        </Button>
        
        <div className="flex gap-2">
          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create {entityType.replace('_', ' ')}
                </>
              )}
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )

  const rightPanelContent = (
    <div className="space-y-6">
      {/* AI Assistant */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Smart Suggestions</h4>
        <div className="space-y-3">
          <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800 font-medium mb-1">💡 Tip</p>
            <p className="text-sm text-purple-700">
              Use descriptive names that clearly identify this {entityType.replace('_', ' ').toLowerCase()}.
            </p>
          </div>
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-sm text-amber-800 font-medium mb-1">⚡ Best Practice</p>
            <p className="text-sm text-amber-700">
              Fill in all required fields marked with * to ensure complete data.
            </p>
          </div>
        </div>
      </div>

      {/* Field Help */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Field Guide</h4>
        <div className="space-y-2">
          {currentStep.fields.slice(0, 3).map((field: any, index: number) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900 text-sm">{field.label}</p>
              <p className="text-xs text-gray-600 mt-1">
                {field.placeholder || `Enter the ${field.label.toLowerCase()} for this entity`}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Stats */}
      <div>
        <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Fields Completed:</span>
            <span className="font-medium">
              {Object.keys(formData).length}/{currentStep.fields.length}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Required Fields:</span>
            <span className="font-medium">
              {currentStep.fields.filter((f: any) => f.required).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const breadcrumbs = [
    { label: 'HERA' },
    { label: resolvedOperation.params?.module || 'Module' },
    { label: resolvedOperation.params?.area || 'Area' },
    { label: config.title }
  ]

  const handleSave = async () => {
    await handleSubmit()
    updateLastSaved()
  }

  return (
    <UniversalEntityShell
      title={config.title}
      subtitle={config.description}
      breadcrumbs={breadcrumbs}
      leftPanelContent={leftPanelContent}
      centerPanelContent={centerPanelContent}
      rightPanelContent={rightPanelContent}
      showAIPanel={showAIPanel}
      onToggleAIPanel={() => setShowAIPanel(!showAIPanel)}
      onSave={handleSave}
      onCancel={() => window.location.href = config.listPath}
      saveButtonText={isLastStep ? `Create ${entityType.replace('_', ' ')}` : 'Continue'}
      isLoading={loading}
      lastSaved={lastSaved}
      allowFullscreen={true}
      showAutoSave={false}
    />
  )
}