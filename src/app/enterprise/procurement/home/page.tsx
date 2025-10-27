'use client'

/**
 * Procurement Module Home Page
 * Smart Code: HERA.PROCUREMENT.HOME.v1
 * 
 * HERA Procurement module dashboard using ModuleHomePage template
 */

import React from 'react'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { 
  ShoppingCart,
  FileText,
  Receipt,
  Users,
  BarChart3,
  Target,
  TrendingUp,
  DollarSign,
  Package,
  FileSearch,
  UserCheck,
  Calculator,
  Database,
  Shield,
  Globe,
  Calendar,
  Award,
  Activity,
  Zap,
  CheckCircle,
  AlertTriangle,
  Building2,
  Settings,
  Clock,
  CreditCard,
  Truck,
  PieChart,
  BarChart2,
  TrendingDown,
  Star,
  Briefcase,
  RefreshCw
} from 'lucide-react'

export default function ProcurementHomePage() {
  
  const procurementData = {
    moduleTitle: "Procurement",
    breadcrumb: "Enterprise → Procurement → Source-to-Pay Management",
    overview: {
      title: "HERA Procurement Management",
      subtitle: "AI-Powered Source-to-Pay Operations & Supplier Excellence",
      kpis: [
        {
          title: "Total Spend",
          value: "₹24.8M",
          subtitle: "Q1 2025 Spend",
          trend: "up" as const,
          trendValue: "+12.3%",
          icon: DollarSign
        },
        {
          title: "Cost Savings",
          value: "₹3.2M",
          subtitle: "YTD Savings",
          trend: "up" as const,
          trendValue: "+18%",
          icon: TrendingUp
        },
        {
          title: "Supplier Performance",
          value: "92.3%",
          subtitle: "Average Score",
          trend: "up" as const,
          trendValue: "+4.2%",
          icon: Award
        },
        {
          title: "Purchase Orders",
          value: "1,847",
          subtitle: "Processed This Month",
          trend: "up" as const,
          trendValue: "+8%",
          icon: FileText
        },
        {
          title: "Contract Compliance",
          value: "96.7%",
          subtitle: "Compliance Rate",
          trend: "up" as const,
          trendValue: "+2.1%",
          icon: Shield
        },
        {
          title: "Cycle Time",
          value: "4.2",
          subtitle: "Days Avg P2P",
          trend: "down" as const,
          trendValue: "-1.3 days",
          icon: Clock
        }
      ]
    },
    sections: [
      {
        title: "Modern Procurement",
        requiredPermissions: ["procurement.modern"],
        items: [
          {
            title: "AI Spend Analytics",
            subtitle: "Intelligent spend analysis & insights",
            icon: BarChart3,
            href: "/enterprise/procurement/modern/analytics",
            badge: "AI",
            requiredPermissions: ["procurement.analytics"]
          },
          {
            title: "Cost Optimization",
            subtitle: "Automated savings identification",
            icon: Target,
            href: "/enterprise/procurement/modern/optimization",
            badge: "₹3.2M",
            requiredPermissions: ["procurement.optimization"]
          },
          {
            title: "Procurement Strategy",
            subtitle: "Strategic procurement planning",
            icon: TrendingUp,
            href: "/enterprise/procurement/modern/strategy",
            requiredPermissions: ["procurement.strategy"]
          },
          {
            title: "Category Management",
            subtitle: "Category-based procurement",
            icon: Package,
            href: "/enterprise/procurement/modern/categories",
            badge: "24",
            requiredPermissions: ["procurement.categories"]
          },
          {
            title: "Demand Forecasting",
            subtitle: "AI-powered demand planning",
            icon: Activity,
            href: "/enterprise/procurement/modern/forecasting",
            badge: "Predictive",
            requiredPermissions: ["procurement.forecasting"]
          },
          {
            title: "Risk Management",
            subtitle: "Supply risk assessment",
            icon: Shield,
            href: "/enterprise/procurement/modern/risk",
            badge: "7",
            requiredRoles: ["procurement_manager"]
          }
        ]
      },
      {
        title: "Operational Procurement",
        items: [
          {
            title: "Purchase Requisitions",
            subtitle: "Create & manage requisitions",
            icon: ShoppingCart,
            href: "/enterprise/procurement/operations/requisitions",
            badge: "42",
            requiredPermissions: ["procurement.requisitions"]
          },
          {
            title: "Purchase Orders",
            subtitle: "Order creation & tracking",
            icon: FileText,
            href: "/enterprise/procurement/operations/orders",
            badge: "89",
            requiredPermissions: ["procurement.orders"]
          },
          {
            title: "Goods Receipt",
            subtitle: "Receipt & inspection",
            icon: CheckCircle,
            href: "/enterprise/procurement/operations/receipt",
            badge: "156",
            requiredPermissions: ["procurement.receipt"]
          },
          {
            title: "Three-Way Matching",
            subtitle: "PO-GR-Invoice matching",
            icon: Settings,
            href: "/enterprise/procurement/operations/matching",
            badge: "Auto",
            requiredPermissions: ["procurement.matching"]
          },
          {
            title: "Approval Workflows",
            subtitle: "Automated approvals",
            icon: RefreshCw,
            href: "/enterprise/procurement/operations/approvals",
            badge: "Live",
            requiredPermissions: ["procurement.approvals"]
          },
          {
            title: "Catalog Management",
            subtitle: "Product & service catalogs",
            icon: Database,
            href: "/enterprise/procurement/operations/catalog",
            badge: "12K",
            requiredPermissions: ["procurement.catalog"]
          }
        ]
      },
      {
        title: "Strategic Sourcing",
        items: [
          {
            title: "Sourcing Events",
            subtitle: "RFQ, RFP & auction management",
            icon: FileSearch,
            href: "/enterprise/procurement/sourcing/events",
            badge: "Active",
            requiredPermissions: ["procurement.sourcing"]
          },
          {
            title: "Supplier Discovery",
            subtitle: "Find & qualify suppliers",
            icon: Users,
            href: "/enterprise/procurement/sourcing/discovery",
            requiredPermissions: ["procurement.sourcing"]
          },
          {
            title: "Bid Analysis",
            subtitle: "AI-powered bid comparison",
            icon: Calculator,
            href: "/enterprise/procurement/sourcing/analysis",
            badge: "AI",
            requiredPermissions: ["procurement.analysis"]
          },
          {
            title: "Contract Negotiation",
            subtitle: "Terms & conditions management",
            icon: UserCheck, // fallback for "Handshake"
            href: "/enterprise/procurement/sourcing/negotiation",
            requiredPermissions: ["procurement.contracts"]
          },
          {
            title: "Supplier Onboarding",
            subtitle: "New supplier registration",
            icon: UserCheck,
            href: "/enterprise/procurement/sourcing/onboarding",
            badge: "12",
            requiredPermissions: ["procurement.onboarding"]
          },
          {
            title: "Market Intelligence",
            subtitle: "Market trends & pricing",
            icon: Globe,
            href: "/enterprise/procurement/sourcing/intelligence",
            badge: "Updated",
            requiredRoles: ["sourcing_specialist"]
          }
        ]
      },
      {
        title: "Supplier Management",
        items: [
          {
            title: "Supplier Portal",
            subtitle: "Supplier collaboration hub",
            icon: Building2,
            href: "/enterprise/procurement/suppliers/portal",
            badge: "247",
            requiredPermissions: ["procurement.suppliers"]
          },
          {
            title: "Performance Evaluation",
            subtitle: "Real-time supplier scoring",
            icon: Award,
            href: "/enterprise/procurement/suppliers/evaluation",
            badge: "92.3%",
            requiredPermissions: ["procurement.evaluation"]
          },
          {
            title: "Supplier Scorecards",
            subtitle: "Performance dashboards",
            icon: BarChart2,
            href: "/enterprise/procurement/suppliers/scorecards",
            requiredPermissions: ["procurement.scorecards"]
          },
          {
            title: "Risk Assessment",
            subtitle: "Financial & operational risk",
            icon: AlertTriangle,
            href: "/enterprise/procurement/suppliers/risk",
            badge: "7",
            requiredPermissions: ["procurement.risk"]
          },
          {
            title: "Sustainability Metrics",
            subtitle: "Carbon footprint tracking",
            icon: Activity,
            href: "/enterprise/procurement/suppliers/sustainability",
            badge: "Green",
            requiredPermissions: ["procurement.sustainability"]
          },
          {
            title: "Supplier Development",
            subtitle: "Capability improvement",
            icon: TrendingUp,
            href: "/enterprise/procurement/suppliers/development",
            requiredRoles: ["supplier_manager"]
          }
        ]
      },
      {
        title: "Invoice Management",
        items: [
          {
            title: "Invoice Processing",
            subtitle: "AI-powered automation",
            icon: Receipt,
            href: "/enterprise/procurement/invoices/processing",
            badge: "95%",
            requiredPermissions: ["procurement.invoices"]
          },
          {
            title: "Electronic Invoicing",
            subtitle: "E-invoice integration",
            icon: Zap,
            href: "/enterprise/procurement/invoices/electronic",
            badge: "Auto",
            requiredPermissions: ["procurement.einvoicing"]
          },
          {
            title: "Invoice Approval",
            subtitle: "Approval workflow",
            icon: CheckCircle,
            href: "/enterprise/procurement/invoices/approval",
            badge: "34",
            requiredPermissions: ["procurement.invoice_approval"]
          },
          {
            title: "Payment Processing",
            subtitle: "Automated payments",
            icon: CreditCard,
            href: "/enterprise/procurement/invoices/payment",
            requiredPermissions: ["procurement.payments"]
          },
          {
            title: "Vendor Payments",
            subtitle: "Supplier payment tracking",
            icon: Users,
            href: "/enterprise/procurement/invoices/vendor-payments",
            badge: "₹18.2M",
            requiredPermissions: ["procurement.vendor_payments"]
          },
          {
            title: "Tax Management",
            subtitle: "Tax compliance & reporting",
            icon: Calculator,
            href: "/enterprise/procurement/invoices/tax",
            requiredRoles: ["tax_specialist"]
          }
        ]
      },
      {
        title: "Analytics & Reporting",
        items: [
          {
            title: "Spend Analytics",
            subtitle: "Comprehensive spend insights",
            icon: BarChart3,
            href: "/enterprise/procurement/analytics/spend"
          },
          {
            title: "Savings Dashboard",
            subtitle: "Cost savings tracking",
            icon: Target,
            href: "/enterprise/procurement/analytics/savings"
          },
          {
            title: "Supplier Analytics",
            subtitle: "Supplier performance metrics",
            icon: PieChart,
            href: "/enterprise/procurement/analytics/suppliers"
          },
          {
            title: "Compliance Reports",
            subtitle: "Regulatory compliance",
            icon: Shield,
            href: "/enterprise/procurement/analytics/compliance"
          },
          {
            title: "Procurement KPIs",
            subtitle: "Key performance indicators",
            icon: Activity,
            href: "/enterprise/procurement/analytics/kpis"
          },
          {
            title: "Executive Dashboard",
            subtitle: "C-level procurement insights",
            icon: Star,
            href: "/enterprise/procurement/analytics/executive"
          }
        ]
      },
      {
        title: "Master Data & Configuration",
        items: [
          {
            title: "Vendor Master",
            subtitle: "Supplier information management",
            icon: Users,
            href: "/enterprise/procurement/master/vendors"
          },
          {
            title: "Material Master",
            subtitle: "Product & material data",
            icon: Package,
            href: "/enterprise/procurement/master/materials"
          },
          {
            title: "Purchase Groups",
            subtitle: "Purchasing organization",
            icon: Building2,
            href: "/enterprise/procurement/master/groups"
          },
          {
            title: "Terms & Conditions",
            subtitle: "Contract templates",
            icon: FileText,
            href: "/enterprise/procurement/master/terms"
          },
          {
            title: "Price Management",
            subtitle: "Pricing & conditions",
            icon: DollarSign,
            href: "/enterprise/procurement/master/pricing"
          },
          {
            title: "Workflow Configuration",
            subtitle: "Process automation setup",
            icon: Settings,
            href: "/enterprise/procurement/master/workflows"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="procurement" requiredPermissions={["procurement.read"]}>
      <ModuleHomePage
        moduleTitle={procurementData.moduleTitle}
        breadcrumb={procurementData.breadcrumb}
        overview={procurementData.overview}
        sections={procurementData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}