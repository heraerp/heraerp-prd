/**
 * Enterprise Salon Module Home
 * Smart Code: HERA.ENTERPRISE.SALON.HOME.v1
 * 
 * Enterprise-integrated salon module home page with RBAC protection
 */

'use client'

import React from 'react'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import { 
  Calendar, 
  CreditCard, 
  Users, 
  Settings, 
  Package, 
  UserPlus, 
  Building2, 
  BarChart3, 
  FileText, 
  DollarSign,
  Scissors,
  Clock,
  TrendingUp,
  Calculator
} from 'lucide-react'

export default function EnterpriseSalonHomePage() {
  
  const salonData = {
    moduleTitle: "Salon Management",
    breadcrumb: "Beauty Business Operations",
    overview: {
      title: "Salon Business Overview",
      subtitle: "Comprehensive beauty business management and analytics",
      kpis: [
        {
          title: "Today's Appointments",
          value: "24",
          subtitle: "12 completed, 8 pending",
          trend: "up" as const,
          trendValue: "+3 from yesterday",
          icon: Calendar
        },
        {
          title: "Daily Revenue",
          value: "₹8,450",
          subtitle: "From services & products",
          trend: "up" as const,
          trendValue: "+15.2%",
          icon: DollarSign
        },
        {
          title: "Active Staff",
          value: "6",
          subtitle: "Currently working",
          trend: "neutral" as const,
          trendValue: "All present",
          icon: UserPlus
        },
        {
          title: "Customer Satisfaction",
          value: "4.8",
          unit: "/5",
          subtitle: "Based on recent reviews",
          trend: "up" as const,
          trendValue: "+0.2",
          icon: TrendingUp
        },
        {
          title: "Monthly Target",
          value: "68%",
          subtitle: "₹85,000 of ₹125,000",
          trend: "up" as const,
          trendValue: "On track",
          icon: BarChart3
        },
        {
          title: "Inventory Status",
          value: "92%",
          subtitle: "Stock availability",
          trend: "neutral" as const,
          trendValue: "Optimal",
          icon: Package
        }
      ]
    },
    sections: [
      {
        title: "Front Office Operations",
        requiredPermissions: ["salon.appointments"],
        items: [
          {
            title: "Appointments",
            subtitle: "Schedule & manage bookings",
            icon: Calendar,
            href: "/enterprise/salon/appointments",
            badge: "24",
            requiredPermissions: ["salon.appointments"]
          },
          {
            title: "Walk-in Queue",
            subtitle: "Manage walk-in customers",
            icon: Clock,
            href: "/enterprise/salon/appointments",
            badge: "3"
          },
          {
            title: "Customer Management",
            subtitle: "Client database & history",
            icon: Users,
            href: "/enterprise/salon/customers",
            requiredPermissions: ["salon.customers"]
          },
          {
            title: "Point of Sale",
            subtitle: "Process payments & sales",
            icon: CreditCard,
            href: "/enterprise/salon/pos",
            requiredPermissions: ["salon.pos"]
          }
        ]
      },
      {
        title: "Business Management",
        requiredPermissions: ["salon.staff"],
        items: [
          {
            title: "Staff Management",
            subtitle: "Team scheduling & performance",
            icon: UserPlus,
            href: "/enterprise/salon/staffs",
            requiredPermissions: ["salon.staff"]
          },
          {
            title: "Services & Pricing",
            subtitle: "Service catalog & rates",
            icon: Scissors,
            href: "/enterprise/salon/services",
            requiredPermissions: ["salon.services"]
          },
          {
            title: "Inventory Management",
            subtitle: "Products & stock control",
            icon: Package,
            href: "/enterprise/salon/inventory",
            requiredPermissions: ["salon.inventory"]
          },
          {
            title: "Branch Management",
            subtitle: "Multi-location operations",
            icon: Building2,
            href: "/enterprise/salon/branches",
            requiredRoles: ["salon_owner", "salon_manager"]
          }
        ]
      },
      {
        title: "Financial Operations",
        requiredPermissions: ["salon.finance"],
        items: [
          {
            title: "Financial Dashboard",
            subtitle: "Revenue & expense tracking",
            icon: BarChart3,
            href: "/enterprise/salon/finance",
            requiredPermissions: ["salon.finance"]
          },
          {
            title: "Daily Reports",
            subtitle: "Sales & performance reports",
            icon: FileText,
            href: "/enterprise/salon/reports",
            requiredPermissions: ["salon.reports"]
          },
          {
            title: "Commission Tracking",
            subtitle: "Staff commission calculations",
            icon: Calculator,
            href: "/enterprise/salon/finance",
            requiredRoles: ["salon_owner", "salon_accountant"]
          },
          {
            title: "Profit & Loss",
            subtitle: "Financial statements",
            icon: TrendingUp,
            href: "/enterprise/salon/profit-loss",
            requiredRoles: ["salon_owner", "salon_accountant"]
          }
        ]
      },
      {
        title: "Settings & Configuration",
        requiredRoles: ["salon_owner", "salon_manager"],
        items: [
          {
            title: "System Settings",
            subtitle: "General configuration",
            icon: Settings,
            href: "/enterprise/salon/settings",
            requiredRoles: ["salon_owner", "salon_manager"]
          },
          {
            title: "User Management",
            subtitle: "Staff access control",
            icon: Users,
            href: "/enterprise/salon/users",
            requiredRoles: ["salon_owner"]
          },
          {
            title: "Service Categories",
            subtitle: "Organize service offerings",
            icon: Package,
            href: "/enterprise/salon/service-categories",
            requiredRoles: ["salon_owner", "salon_manager"]
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="salon" requiredPermissions={["salon.appointments"]}>
      <ModuleHomePage
        moduleTitle={salonData.moduleTitle}
        breadcrumb={salonData.breadcrumb}
        overview={salonData.overview}
        sections={salonData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}