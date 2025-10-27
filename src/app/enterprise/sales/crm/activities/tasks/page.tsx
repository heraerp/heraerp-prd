'use client'

/**
 * CRM Task Activities
 * Smart Code: HERA.ENTERPRISE.CRM.ACTIVITIES.TASKS.v1
 * 
 * Task management and activity tracking
 */

import React from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import {
  CheckSquare,
  Square,
  Plus,
  Calendar,
  Clock,
  Users,
  Star,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Flag,
  RefreshCw,
  FileText,
  CheckCircle,
  Timer,
  Target,
  Activity
} from 'lucide-react'

export default function CRMTaskActivitiesPage() {
  const tasksData = {
    moduleTitle: "Task Activities",
    breadcrumb: "Sales & Distribution → CRM → Activities → Tasks",
    overview: {
      title: "Task & Activity Management",
      subtitle: "Track To-dos, Follow-ups & Action Items",
      kpis: [
        {
          title: "Open Tasks",
          value: "34",
          subtitle: "Active tasks assigned",
          trend: "neutral" as const,
          trendValue: "8 due today",
          icon: Square
        },
        {
          title: "Completion Rate",
          value: "87.3",
          unit: "%",
          subtitle: "Tasks completed on time",
          trend: "up" as const,
          trendValue: "+5.2%",
          icon: CheckCircle
        },
        {
          title: "Overdue Tasks",
          value: "7",
          subtitle: "Past due tasks",
          trend: "down" as const,
          trendValue: "-3 resolved",
          icon: AlertTriangle
        },
        {
          title: "Avg Task Duration",
          value: "2.4",
          unit: " days",
          subtitle: "Time to complete",
          trend: "down" as const,
          trendValue: "-0.6 days faster",
          icon: Clock
        },
        {
          title: "High Priority Tasks",
          value: "12",
          subtitle: "Urgent tasks pending",
          trend: "neutral" as const,
          trendValue: "4 due today",
          icon: Flag
        },
        {
          title: "Team Productivity",
          value: "94",
          unit: "/100",
          subtitle: "Productivity index",
          trend: "up" as const,
          trendValue: "+7 points",
          icon: TrendingUp
        }
      ]
    },
    sections: [
      {
        title: "Task Management",
        items: [
          {
            title: "Create New Task",
            subtitle: "Add new task or to-do",
            icon: Plus,
            href: "/enterprise/sales/crm/activities/tasks/create"
          },
          {
            title: "My Tasks",
            subtitle: "Tasks assigned to me",
            icon: CheckSquare,
            href: "/enterprise/sales/crm/activities/tasks/my-tasks",
            badge: "23"
          },
          {
            title: "Due Today",
            subtitle: "Tasks due today",
            icon: Calendar,
            href: "/enterprise/sales/crm/activities/tasks/due-today",
            badge: "8"
          },
          {
            title: "Overdue Tasks",
            subtitle: "Past due tasks",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/activities/tasks/overdue",
            badge: "7"
          },
          {
            title: "High Priority",
            subtitle: "Urgent and important tasks",
            icon: Flag,
            href: "/enterprise/sales/crm/activities/tasks/high-priority",
            badge: "12"
          },
          {
            title: "Completed Tasks",
            subtitle: "Recently completed tasks",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/activities/tasks/completed"
          }
        ]
      },
      {
        title: "Task Categories",
        items: [
          {
            title: "Follow-up Tasks",
            subtitle: "Customer follow-up activities",
            icon: RefreshCw,
            href: "/enterprise/sales/crm/activities/tasks/follow-up"
          },
          {
            title: "Lead Qualification",
            subtitle: "Lead research and qualification",
            icon: Users,
            href: "/enterprise/sales/crm/activities/tasks/qualification"
          },
          {
            title: "Proposal Tasks",
            subtitle: "Proposal and quote preparation",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/tasks/proposals"
          },
          {
            title: "Meeting Preparation",
            subtitle: "Pre-meeting research and setup",
            icon: Calendar,
            href: "/enterprise/sales/crm/activities/tasks/meeting-prep"
          },
          {
            title: "Deal Closing",
            subtitle: "Final closing activities",
            icon: Target,
            href: "/enterprise/sales/crm/activities/tasks/closing"
          },
          {
            title: "Administrative Tasks",
            subtitle: "CRM data updates and admin",
            icon: Star,
            href: "/enterprise/sales/crm/activities/tasks/admin"
          }
        ]
      },
      {
        title: "Team Tasks",
        items: [
          {
            title: "Team Dashboard",
            subtitle: "Team task overview",
            icon: Users,
            href: "/enterprise/sales/crm/activities/tasks/team"
          },
          {
            title: "Assign Tasks",
            subtitle: "Delegate tasks to team members",
            icon: Users,
            href: "/enterprise/sales/crm/activities/tasks/assign"
          },
          {
            title: "Task Templates",
            subtitle: "Pre-defined task templates",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/tasks/templates"
          },
          {
            title: "Recurring Tasks",
            subtitle: "Repeating task schedules",
            icon: RefreshCw,
            href: "/enterprise/sales/crm/activities/tasks/recurring"
          },
          {
            title: "Task Dependencies",
            subtitle: "Task prerequisite management",
            icon: Activity,
            href: "/enterprise/sales/crm/activities/tasks/dependencies"
          },
          {
            title: "Task Collaboration",
            subtitle: "Shared task workspaces",
            icon: Users,
            href: "/enterprise/sales/crm/activities/tasks/collaboration"
          }
        ]
      },
      {
        title: "Task Analytics",
        items: [
          {
            title: "Task Performance",
            subtitle: "Completion rates and trends",
            icon: BarChart3,
            href: "/enterprise/sales/crm/activities/tasks/performance"
          },
          {
            title: "Productivity Metrics",
            subtitle: "Individual and team productivity",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/activities/tasks/productivity"
          },
          {
            title: "Time Tracking",
            subtitle: "Task duration analysis",
            icon: Timer,
            href: "/enterprise/sales/crm/activities/tasks/time-tracking"
          },
          {
            title: "Bottleneck Analysis",
            subtitle: "Identify process bottlenecks",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/activities/tasks/bottlenecks"
          },
          {
            title: "Task Impact Analysis",
            subtitle: "Task contribution to outcomes",
            icon: Target,
            href: "/enterprise/sales/crm/activities/tasks/impact"
          },
          {
            title: "Workload Distribution",
            subtitle: "Team workload balance",
            icon: Users,
            href: "/enterprise/sales/crm/activities/tasks/workload"
          }
        ]
      },
      {
        title: "Task Automation",
        items: [
          {
            title: "Automated Task Creation",
            subtitle: "Rule-based task generation",
            icon: Plus,
            href: "/enterprise/sales/crm/activities/tasks/automation/creation"
          },
          {
            title: "Task Workflows",
            subtitle: "Automated task sequences",
            icon: Activity,
            href: "/enterprise/sales/crm/activities/tasks/automation/workflows"
          },
          {
            title: "Smart Assignments",
            subtitle: "AI-powered task routing",
            icon: Users,
            href: "/enterprise/sales/crm/activities/tasks/automation/assignments"
          },
          {
            title: "Deadline Management",
            subtitle: "Automatic deadline tracking",
            icon: Clock,
            href: "/enterprise/sales/crm/activities/tasks/automation/deadlines"
          },
          {
            title: "Task Notifications",
            subtitle: "Automated task reminders",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/activities/tasks/automation/notifications"
          },
          {
            title: "Escalation Rules",
            subtitle: "Overdue task escalation",
            icon: Flag,
            href: "/enterprise/sales/crm/activities/tasks/automation/escalation"
          }
        ]
      },
      {
        title: "Integration & Settings",
        items: [
          {
            title: "Calendar Integration",
            subtitle: "Sync tasks with calendar",
            icon: Calendar,
            href: "/enterprise/sales/crm/activities/tasks/integration/calendar"
          },
          {
            title: "Email Integration",
            subtitle: "Create tasks from emails",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/tasks/integration/email"
          },
          {
            title: "Project Management",
            subtitle: "Connect with project tools",
            icon: Activity,
            href: "/enterprise/sales/crm/activities/tasks/integration/projects"
          },
          {
            title: "Mobile Tasks",
            subtitle: "Mobile task management",
            icon: Star,
            href: "/enterprise/sales/crm/activities/tasks/mobile"
          },
          {
            title: "Task Preferences",
            subtitle: "Personal task settings",
            icon: Star,
            href: "/enterprise/sales/crm/activities/tasks/settings/preferences"
          },
          {
            title: "Task Categories Setup",
            subtitle: "Configure task categories",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/tasks/settings/categories"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.activities"]}>
      <ModuleHomePage
        moduleTitle={tasksData.moduleTitle}
        breadcrumb={tasksData.breadcrumb}
        overview={tasksData.overview}
        sections={tasksData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}