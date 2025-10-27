'use client'

/**
 * Manufacturing Module Home Page
 * Smart Code: HERA.MANUFACTURING.HOME.v1
 * 
 * HERA Manufacturing module dashboard using ModuleHomePage template
 */

import React from 'react'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { 
  Factory,
  Cog,
  Calendar,
  Settings2,
  ClipboardCheck,
  BarChart3,
  Package,
  Gauge,
  Timer,
  Wrench,
  Target,
  TrendingUp,
  Activity,
  Database,
  Truck,
  Zap,
  Shield,
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  Building2,
  Calculator,
  Receipt,
  BarChart2,
  PieChart,
  Settings,
  BookOpen,
  Briefcase
} from 'lucide-react'

export default function ManufacturingHomePage() {
  
  const manufacturingData = {
    moduleTitle: "Manufacturing",
    breadcrumb: "Enterprise → Manufacturing → Production Management",
    overview: {
      title: "HERA Manufacturing Management",
      subtitle: "AI-Powered Production Operations & Quality Control",
      kpis: [
        {
          title: "Overall Equipment Effectiveness",
          value: "94.2%",
          subtitle: "Current Performance",
          trend: "up" as const,
          trendValue: "+3.8%",
          icon: Gauge
        },
        {
          title: "Production Orders",
          value: "247",
          subtitle: "Active Orders",
          trend: "up" as const,
          trendValue: "+8%",
          icon: Factory
        },
        {
          title: "Quality Yield Rate",
          value: "99.1%",
          subtitle: "First-Pass Yield",
          trend: "up" as const,
          trendValue: "+2.3%",
          icon: ClipboardCheck
        },
        {
          title: "Capacity Utilization",
          value: "87.5%",
          subtitle: "Current Usage",
          trend: "neutral" as const,
          trendValue: "Optimal",
          icon: BarChart3
        },
        {
          title: "On-Time Delivery",
          value: "98.3%",
          subtitle: "Schedule Performance",
          trend: "up" as const,
          trendValue: "+1.7%",
          icon: Timer
        },
        {
          title: "Cost Efficiency",
          value: "₹2.4M",
          subtitle: "Cost Savings YTD",
          trend: "up" as const,
          trendValue: "+15.2%",
          icon: Target
        }
      ]
    },
    sections: [
      {
        title: "Production Engineering",
        requiredPermissions: ["manufacturing.engineering"],
        items: [
          {
            title: "Product Definition",
            subtitle: "Bills of Materials & Routings",
            icon: Package,
            href: "/enterprise/manufacturing/engineering/product-definition",
            badge: "Updated",
            requiredPermissions: ["manufacturing.bom"]
          },
          {
            title: "BOM Management",
            subtitle: "Bill of Materials control",
            icon: FileText,
            href: "/enterprise/manufacturing/engineering/bom",
            badge: "156",
            requiredPermissions: ["manufacturing.bom"]
          },
          {
            title: "Product Configuration",
            subtitle: "Configurable product models",
            icon: Settings,
            href: "/enterprise/manufacturing/engineering/configuration",
            requiredPermissions: ["manufacturing.config"]
          },
          {
            title: "Work Centers",
            subtitle: "Production resource setup",
            icon: Building2,
            href: "/enterprise/manufacturing/engineering/workcenters",
            badge: "42",
            requiredPermissions: ["manufacturing.workcenters"]
          },
          {
            title: "Routing Management",
            subtitle: "Production process flows",
            icon: Cog,
            href: "/enterprise/manufacturing/engineering/routing",
            badge: "38",
            requiredPermissions: ["manufacturing.routing"]
          },
          {
            title: "Engineering Changes",
            subtitle: "Change order management",
            icon: AlertTriangle,
            href: "/enterprise/manufacturing/engineering/changes",
            badge: "7",
            requiredRoles: ["manufacturing_engineer"]
          }
        ]
      },
      {
        title: "Production Planning",
        items: [
          {
            title: "Demand Forecasting",
            subtitle: "AI-powered demand planning",
            icon: TrendingUp,
            href: "/enterprise/manufacturing/planning/demand",
            badge: "AI",
            requiredPermissions: ["manufacturing.planning"]
          },
          {
            title: "Master Production Schedule",
            subtitle: "Production schedule optimization",
            icon: Calendar,
            href: "/enterprise/manufacturing/planning/mps",
            requiredPermissions: ["manufacturing.planning"]
          },
          {
            title: "Material Requirements Planning",
            subtitle: "MRP calculations & planning",
            icon: Truck,
            href: "/enterprise/manufacturing/planning/mrp",
            badge: "Running",
            requiredPermissions: ["manufacturing.mrp"]
          },
          {
            title: "Capacity Planning",
            subtitle: "Resource optimization",
            icon: BarChart2,
            href: "/enterprise/manufacturing/planning/capacity",
            requiredPermissions: ["manufacturing.capacity"]
          },
          {
            title: "Supply & Demand Matching",
            subtitle: "Automated supply planning",
            icon: Target,
            href: "/enterprise/manufacturing/planning/supply-demand",
            badge: "Optimized",
            requiredPermissions: ["manufacturing.planning"]
          },
          {
            title: "Production Simulation",
            subtitle: "What-if analysis & modeling",
            icon: Activity,
            href: "/enterprise/manufacturing/planning/simulation",
            badge: "New",
            requiredRoles: ["manufacturing_planner"]
          }
        ]
      },
      {
        title: "Manufacturing Operations",
        items: [
          {
            title: "Production Orders",
            subtitle: "Order creation & management",
            icon: Factory,
            href: "/enterprise/manufacturing/operations/orders",
            badge: "247",
            requiredPermissions: ["manufacturing.orders"]
          },
          {
            title: "Shop Floor Control",
            subtitle: "Real-time production tracking",
            icon: Gauge,
            href: "/enterprise/manufacturing/operations/shopfloor",
            badge: "Live",
            requiredPermissions: ["manufacturing.shopfloor"]
          },
          {
            title: "Production Monitoring",
            subtitle: "Real-time insights & alerts",
            icon: BarChart3,
            href: "/enterprise/manufacturing/operations/monitoring",
            requiredPermissions: ["manufacturing.monitoring"]
          },
          {
            title: "Resource Management",
            subtitle: "Equipment & labor tracking",
            icon: Users,
            href: "/enterprise/manufacturing/operations/resources",
            requiredPermissions: ["manufacturing.resources"]
          },
          {
            title: "Material Consumption",
            subtitle: "Material usage tracking",
            icon: Package,
            href: "/enterprise/manufacturing/operations/materials",
            badge: "Real-time",
            requiredPermissions: ["manufacturing.materials"]
          },
          {
            title: "Maintenance Integration",
            subtitle: "Predictive maintenance",
            icon: Wrench,
            href: "/enterprise/manufacturing/operations/maintenance",
            badge: "AI",
            requiredPermissions: ["manufacturing.maintenance"]
          }
        ]
      },
      {
        title: "Manufacturing Options",
        items: [
          {
            title: "Discrete Manufacturing",
            subtitle: "Make-to-stock & engineer-to-order",
            icon: Settings2,
            href: "/enterprise/manufacturing/options/discrete",
            requiredPermissions: ["manufacturing.discrete"]
          },
          {
            title: "Process Manufacturing",
            subtitle: "Process orders & master recipes",
            icon: Briefcase,
            href: "/enterprise/manufacturing/options/process",
            requiredPermissions: ["manufacturing.process"]
          },
          {
            title: "Repetitive Manufacturing",
            subtitle: "High-volume production",
            icon: RefreshCw,
            href: "/enterprise/manufacturing/options/repetitive",
            requiredPermissions: ["manufacturing.repetitive"]
          },
          {
            title: "Kanban & JIT",
            subtitle: "Pull-based production",
            icon: Activity,
            href: "/enterprise/manufacturing/options/kanban",
            requiredPermissions: ["manufacturing.kanban"]
          },
          {
            title: "Lean Manufacturing",
            subtitle: "Waste reduction & optimization",
            icon: Target,
            href: "/enterprise/manufacturing/options/lean",
            badge: "Optimized",
            requiredPermissions: ["manufacturing.lean"]
          },
          {
            title: "Flexible Manufacturing",
            subtitle: "Multi-variant production",
            icon: Zap,
            href: "/enterprise/manufacturing/options/flexible",
            badge: "AI",
            requiredRoles: ["manufacturing_manager"]
          }
        ]
      },
      {
        title: "Quality Management",
        items: [
          {
            title: "Quality Planning",
            subtitle: "Quality measures & criteria",
            icon: ClipboardCheck,
            href: "/enterprise/manufacturing/quality/planning",
            requiredPermissions: ["manufacturing.quality"]
          },
          {
            title: "Quality Inspection",
            subtitle: "Material & product inspection",
            icon: CheckCircle,
            href: "/enterprise/manufacturing/quality/inspection",
            badge: "24",
            requiredPermissions: ["manufacturing.inspection"]
          },
          {
            title: "AI Visual Inspection",
            subtitle: "Automated quality control",
            icon: Zap,
            href: "/enterprise/manufacturing/quality/ai-inspection",
            badge: "AI",
            requiredPermissions: ["manufacturing.ai_quality"]
          },
          {
            title: "Quality Analytics",
            subtitle: "Quality KPIs & trends",
            icon: BarChart3,
            href: "/enterprise/manufacturing/quality/analytics",
            requiredPermissions: ["manufacturing.quality"]
          },
          {
            title: "Process Improvement",
            subtitle: "Continuous improvement",
            icon: TrendingUp,
            href: "/enterprise/manufacturing/quality/improvement",
            badge: "Active",
            requiredPermissions: ["manufacturing.improvement"]
          },
          {
            title: "Compliance Management",
            subtitle: "Standards & certifications",
            icon: Shield,
            href: "/enterprise/manufacturing/quality/compliance",
            requiredRoles: ["quality_manager"]
          }
        ]
      },
      {
        title: "Analytics & Reporting",
        items: [
          {
            title: "Production Dashboard",
            subtitle: "Real-time production metrics",
            icon: Gauge,
            href: "/enterprise/manufacturing/analytics/dashboard"
          },
          {
            title: "OEE Analysis",
            subtitle: "Overall Equipment Effectiveness",
            icon: BarChart2,
            href: "/enterprise/manufacturing/analytics/oee"
          },
          {
            title: "Cost Analysis",
            subtitle: "Manufacturing cost tracking",
            icon: Calculator,
            href: "/enterprise/manufacturing/analytics/costs"
          },
          {
            title: "Performance Reports",
            subtitle: "KPI reporting & trends",
            icon: PieChart,
            href: "/enterprise/manufacturing/analytics/performance"
          },
          {
            title: "Digital Twin Analytics",
            subtitle: "Simulation-based insights",
            icon: Activity,
            href: "/enterprise/manufacturing/analytics/digital-twin"
          },
          {
            title: "Predictive Analytics",
            subtitle: "AI-powered predictions",
            icon: TrendingUp,
            href: "/enterprise/manufacturing/analytics/predictive"
          }
        ]
      },
      {
        title: "Master Data & Configuration",
        items: [
          {
            title: "Product Master",
            subtitle: "Product definitions & variants",
            icon: Package,
            href: "/enterprise/manufacturing/master/products"
          },
          {
            title: "Material Master",
            subtitle: "Raw materials & components",
            icon: Database,
            href: "/enterprise/manufacturing/master/materials"
          },
          {
            title: "Equipment Master",
            subtitle: "Machine & equipment data",
            icon: Cog,
            href: "/enterprise/manufacturing/master/equipment"
          },
          {
            title: "Resource Groups",
            subtitle: "Production resource planning",
            icon: Users,
            href: "/enterprise/manufacturing/master/resource-groups"
          },
          {
            title: "Plant Configuration",
            subtitle: "Manufacturing plant setup",
            icon: Building2,
            href: "/enterprise/manufacturing/master/plants"
          },
          {
            title: "Standard Costs",
            subtitle: "Cost standards & variances",
            icon: Receipt,
            href: "/enterprise/manufacturing/master/costs"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="manufacturing" requiredPermissions={["manufacturing.read"]}>
      <ModuleHomePage
        moduleTitle={manufacturingData.moduleTitle}
        breadcrumb={manufacturingData.breadcrumb}
        overview={manufacturingData.overview}
        sections={manufacturingData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}