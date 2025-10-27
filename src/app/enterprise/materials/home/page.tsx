'use client'

/**
 * Materials Management Module Home Page
 * Smart Code: HERA.MM.HOME.v1
 * 
 * SAP Fiori-inspired Materials Management module dashboard
 */

import React from 'react'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import { 
  Package,
  Truck,
  ShoppingCart,
  Users,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Target,
  FileText,
  BarChart3,
  PieChart,
  Factory,
  MapPin,
  Calendar,
  Settings,
  Zap,
  Archive
} from 'lucide-react'

export default function MaterialsManagementHomePage() {
  
  const mmData = {
    moduleTitle: "Materials Management",
    breadcrumb: "Materials Management (MM)",
    overview: {
      title: "My Materials Overview",
      subtitle: "Procurement & Inventory Analysis",
      kpis: [
        {
          title: "Total Inventory Value",
          value: "₹156.8M",
          subtitle: "Current Stock",
          trend: "up" as const,
          trendValue: "+2.4%",
          icon: Package
        },
        {
          title: "Purchase Orders",
          value: "342",
          subtitle: "Active POs",
          trend: "up" as const,
          trendValue: "+8.7%",
          icon: ShoppingCart
        },
        {
          title: "Stock Turnover",
          value: "6.8x",
          subtitle: "Annual Rotation",
          trend: "up" as const,
          trendValue: "+0.3",
          icon: TrendingUp
        },
        {
          title: "Pending Receipts",
          value: "89",
          subtitle: "Goods Receipt",
          trend: "down" as const,
          trendValue: "-12%",
          icon: Truck
        },
        {
          title: "Safety Stock",
          value: "94.2%",
          subtitle: "Availability",
          trend: "up" as const,
          trendValue: "+1.8%",
          icon: Target
        },
        {
          title: "Vendor Performance",
          value: "96.5%",
          subtitle: "On-time Delivery",
          trend: "up" as const,
          trendValue: "+2.1%",
          icon: Users
        }
      ]
    },
    sections: [
      {
        title: "Procurement",
        items: [
          {
            title: "Purchase Requisitions",
            subtitle: "Material Requests",
            icon: FileText,
            href: "/enterprise/materials/procurement/requisitions",
            badge: "67"
          },
          {
            title: "Purchase Orders",
            subtitle: "Order Management",
            icon: ShoppingCart,
            href: "/enterprise/materials/procurement/orders",
            badge: "342"
          },
          {
            title: "Vendor Management",
            subtitle: "Supplier Relations",
            icon: Users,
            href: "/enterprise/materials/procurement/vendors",
            badge: "156"
          },
          {
            title: "RFQ Management",
            subtitle: "Request for Quotations",
            icon: FileText,
            href: "/enterprise/materials/procurement/rfq",
            badge: "23"
          },
          {
            title: "Contract Management",
            subtitle: "Purchase Agreements",
            icon: FileText,
            href: "/enterprise/materials/procurement/contracts",
            badge: "45"
          },
          {
            title: "Source List",
            subtitle: "Approved Suppliers",
            icon: Target,
            href: "/enterprise/materials/procurement/source-list"
          }
        ]
      },
      {
        title: "Inventory Management",
        items: [
          {
            title: "Material Documents",
            subtitle: "Stock Movements",
            icon: Package,
            href: "/enterprise/materials/inventory/documents",
            badge: "892"
          },
          {
            title: "Stock Overview",
            subtitle: "Current Inventory",
            icon: Archive,
            href: "/enterprise/materials/inventory/stock"
          },
          {
            title: "Goods Receipt",
            subtitle: "Incoming Materials",
            icon: Truck,
            href: "/enterprise/materials/inventory/receipt",
            badge: "89"
          },
          {
            title: "Goods Issue",
            subtitle: "Material Consumption",
            icon: Package,
            href: "/enterprise/materials/inventory/issue"
          },
          {
            title: "Physical Inventory",
            subtitle: "Stock Counting",
            icon: CheckCircle,
            href: "/enterprise/materials/inventory/physical"
          },
          {
            title: "Transfer Postings",
            subtitle: "Internal Movements",
            icon: TrendingUp,
            href: "/enterprise/materials/inventory/transfers"
          }
        ]
      },
      {
        title: "Material Master Data",
        items: [
          {
            title: "Material Master",
            subtitle: "Product Information",
            icon: Package,
            href: "/enterprise/materials/master/materials"
          },
          {
            title: "Bill of Materials",
            subtitle: "BOM Management",
            icon: Settings,
            href: "/enterprise/materials/master/bom"
          },
          {
            title: "Plant/Storage Location",
            subtitle: "Location Management",
            icon: MapPin,
            href: "/enterprise/materials/master/locations"
          },
          {
            title: "Material Groups",
            subtitle: "Classification",
            icon: Target,
            href: "/enterprise/materials/master/groups"
          },
          {
            title: "Units of Measure",
            subtitle: "UOM Management",
            icon: Settings,
            href: "/enterprise/materials/master/uom"
          },
          {
            title: "Material Types",
            subtitle: "Type Configuration",
            icon: Package,
            href: "/enterprise/materials/master/types"
          }
        ]
      },
      {
        title: "Analytics & Reports",
        items: [
          {
            title: "Inventory Analysis",
            subtitle: "Stock Reports",
            icon: BarChart3,
            href: "/enterprise/materials/reports/inventory"
          },
          {
            title: "Purchase Analysis",
            subtitle: "Procurement Reports",
            icon: PieChart,
            href: "/enterprise/materials/reports/purchase"
          },
          {
            title: "Vendor Performance",
            subtitle: "Supplier Metrics",
            icon: Users,
            href: "/enterprise/materials/reports/vendor"
          },
          {
            title: "ABC Analysis",
            subtitle: "Material Classification",
            icon: Target,
            href: "/enterprise/materials/reports/abc"
          },
          {
            title: "Slow Moving Items",
            subtitle: "Stock Optimization",
            icon: Clock,
            href: "/enterprise/materials/reports/slow-moving"
          },
          {
            title: "Cost Analysis",
            subtitle: "Material Costs",
            icon: DollarSign,
            href: "/enterprise/materials/reports/cost"
          }
        ]
      },
      {
        title: "Services",
        items: [
          {
            title: "MRP Run",
            subtitle: "Material Requirements Planning",
            icon: Zap,
            href: "/enterprise/materials/services/mrp"
          },
          {
            title: "Reorder Point Planning",
            subtitle: "Automatic Reordering",
            icon: Target,
            href: "/enterprise/materials/services/reorder"
          },
          {
            title: "Forecast Planning",
            subtitle: "Demand Forecasting",
            icon: TrendingUp,
            href: "/enterprise/materials/services/forecast"
          },
          {
            title: "Invoice Verification",
            subtitle: "3-Way Matching",
            icon: CheckCircle,
            href: "/enterprise/materials/services/invoice"
          }
        ]
      }
    ]
  }

  return (
    <ModuleHomePage
      moduleTitle={mmData.moduleTitle}
      breadcrumb={mmData.breadcrumb}
      overview={mmData.overview}
      sections={mmData.sections}
      onBack={() => window.history.back()}
    />
  )
}