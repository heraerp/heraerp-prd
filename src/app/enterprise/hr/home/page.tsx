'use client'

/**
 * HR Module Home Page
 * Smart Code: HERA.HR.HOME.v1
 * 
 * SAP Fiori-inspired Human Resources module dashboard
 */

import React from 'react'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import { 
  Users,
  UserCheck,
  Clock,
  DollarSign,
  Calendar,
  Award,
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle,
  FileText,
  Briefcase,
  GraduationCap,
  Heart,
  MapPin,
  Phone,
  Mail,
  Settings,
  BarChart3,
  PieChart
} from 'lucide-react'

export default function HRHomePage() {
  
  const hrData = {
    moduleTitle: "Human Resources",
    breadcrumb: "Human Capital Management (HCM)",
    overview: {
      title: "My HR Overview",
      subtitle: "Employee & Organizational Insights",
      kpis: [
        {
          title: "Total Employees",
          value: "1,247",
          subtitle: "Active Workforce",
          trend: "up" as const,
          trendValue: "+3.2%",
          icon: Users
        },
        {
          title: "New Hires",
          value: "42",
          subtitle: "This Quarter",
          trend: "up" as const,
          trendValue: "+15%",
          icon: UserCheck
        },
        {
          title: "Employee Turnover",
          value: "8.4%",
          subtitle: "Annual Rate",
          trend: "down" as const,
          trendValue: "-2.1%",
          icon: TrendingUp
        },
        {
          title: "Avg. Tenure",
          value: "4.2",
          unit: "years",
          subtitle: "Employee Retention",
          trend: "up" as const,
          trendValue: "+0.3",
          icon: Clock
        },
        {
          title: "Payroll Cost",
          value: "₹84.7M",
          subtitle: "Monthly Total",
          trend: "up" as const,
          trendValue: "+4.8%",
          icon: DollarSign
        },
        {
          title: "Open Positions",
          value: "23",
          subtitle: "Active Requisitions",
          trend: "neutral" as const,
          trendValue: "Stable",
          icon: Target
        }
      ]
    },
    sections: [
      {
        title: "Employee Management",
        items: [
          {
            title: "Employee Records",
            subtitle: "Personnel Administration",
            icon: Users,
            href: "/enterprise/hr/employees",
            badge: "1,247"
          },
          {
            title: "New Employee Onboarding",
            subtitle: "Hire to Retire Process",
            icon: UserCheck,
            href: "/enterprise/hr/onboarding",
            badge: "12"
          },
          {
            title: "Employee Self-Service",
            subtitle: "ESS Portal",
            icon: Settings,
            href: "/enterprise/hr/ess"
          },
          {
            title: "Manager Self-Service",
            subtitle: "MSS Dashboard",
            icon: Briefcase,
            href: "/enterprise/hr/mss"
          },
          {
            title: "Leave Management",
            subtitle: "Time & Attendance",
            icon: Calendar,
            href: "/enterprise/hr/leave",
            badge: "18"
          },
          {
            title: "Performance Reviews",
            subtitle: "Goal Management",
            icon: Award,
            href: "/enterprise/hr/performance",
            badge: "67"
          }
        ]
      },
      {
        title: "Payroll & Benefits",
        items: [
          {
            title: "Payroll Processing",
            subtitle: "Monthly Payroll Run",
            icon: DollarSign,
            href: "/enterprise/hr/payroll"
          },
          {
            title: "Benefits Administration",
            subtitle: "Health, Insurance, PF",
            icon: Heart,
            href: "/enterprise/hr/benefits"
          },
          {
            title: "Tax Management",
            subtitle: "TDS & Compliance",
            icon: FileText,
            href: "/enterprise/hr/tax"
          },
          {
            title: "Expense Reimbursements",
            subtitle: "Employee Expenses",
            icon: DollarSign,
            href: "/enterprise/hr/expenses",
            badge: "34"
          },
          {
            title: "Salary Structures",
            subtitle: "Compensation Planning",
            icon: BarChart3,
            href: "/enterprise/hr/compensation"
          },
          {
            title: "Overtime Management",
            subtitle: "Extra Hours Tracking",
            icon: Clock,
            href: "/enterprise/hr/overtime"
          }
        ]
      },
      {
        title: "Talent Management",
        items: [
          {
            title: "Recruitment",
            subtitle: "Hire the Best Talent",
            icon: Target,
            href: "/enterprise/hr/recruitment",
            badge: "23"
          },
          {
            title: "Learning & Development",
            subtitle: "Training Programs",
            icon: GraduationCap,
            href: "/enterprise/hr/learning",
            badge: "156"
          },
          {
            title: "Career Planning",
            subtitle: "Succession Planning",
            icon: TrendingUp,
            href: "/enterprise/hr/career"
          },
          {
            title: "Skills Management",
            subtitle: "Competency Matrix",
            icon: Award,
            href: "/enterprise/hr/skills"
          },
          {
            title: "Employee Surveys",
            subtitle: "Engagement & Feedback",
            icon: CheckCircle,
            href: "/enterprise/hr/surveys"
          },
          {
            title: "Exit Management",
            subtitle: "Offboarding Process",
            icon: AlertTriangle,
            href: "/enterprise/hr/exit"
          }
        ]
      },
      {
        title: "Analytics & Reports",
        items: [
          {
            title: "HR Dashboard",
            subtitle: "Executive Overview",
            icon: BarChart3,
            href: "/enterprise/hr/analytics/dashboard"
          },
          {
            title: "Workforce Analytics",
            subtitle: "People Insights",
            icon: PieChart,
            href: "/enterprise/hr/analytics/workforce"
          },
          {
            title: "Attendance Reports",
            subtitle: "Time & Productivity",
            icon: Clock,
            href: "/enterprise/hr/reports/attendance"
          },
          {
            title: "Payroll Reports",
            subtitle: "Cost Analysis",
            icon: DollarSign,
            href: "/enterprise/hr/reports/payroll"
          },
          {
            title: "Compliance Reports",
            subtitle: "Regulatory Compliance",
            icon: FileText,
            href: "/enterprise/hr/reports/compliance"
          },
          {
            title: "Employee Directory",
            subtitle: "Organization Chart",
            icon: Users,
            href: "/enterprise/hr/directory"
          }
        ]
      }
    ]
  }

  return (
    <ModuleHomePage
      moduleTitle={hrData.moduleTitle}
      breadcrumb={hrData.breadcrumb}
      overview={hrData.overview}
      sections={hrData.sections}
      onBack={() => window.history.back()}
    />
  )
}