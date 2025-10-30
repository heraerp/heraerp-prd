'use client'

/**
 * CRM Meeting Activities
 * Smart Code: HERA.ENTERPRISE.CRM.ACTIVITIES.MEETINGS.v1
 * 
 * Meeting management and scheduling
 */

import React from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import {
  Calendar,
  CalendarPlus,
  Clock,
  Users,
  Video,
  MapPin,
  CheckCircle,
  AlertTriangle,
  Star,
  TrendingUp,
  BarChart3,
  FileText,
  Link,
  Mic,
  Camera,
  Settings,
  Bell,
  Repeat
} from 'lucide-react'

export default function CRMMeetingActivitiesPage() {
  const meetingsData = {
    moduleTitle: "Meeting Activities",
    breadcrumb: "Sales & Distribution → CRM → Activities → Meetings",
    overview: {
      title: "Meeting Management",
      subtitle: "Schedule, Track & Analyze Meetings",
      kpis: [
        {
          title: "Meetings Today",
          value: "12",
          subtitle: "Scheduled meetings",
          trend: "up" as const,
          trendValue: "+3 vs yesterday",
          icon: Calendar
        },
        {
          title: "Meeting Success Rate",
          value: "89.2",
          unit: "%",
          subtitle: "Meetings held vs scheduled",
          trend: "up" as const,
          trendValue: "+4.1%",
          icon: CheckCircle
        },
        {
          title: "Avg Meeting Duration",
          value: "42",
          unit: " min",
          subtitle: "Per meeting",
          trend: "neutral" as const,
          trendValue: "Optimal range",
          icon: Clock
        },
        {
          title: "Follow-up Actions",
          value: "34",
          subtitle: "Tasks created from meetings",
          trend: "up" as const,
          trendValue: "+8 this week",
          icon: FileText
        },
        {
          title: "Meeting Quality Score",
          value: "4.6",
          unit: "/5.0",
          subtitle: "Average participant rating",
          trend: "up" as const,
          trendValue: "+0.2 improved",
          icon: Star
        },
        {
          title: "Opportunities Advanced",
          value: "15",
          subtitle: "Deals progressed from meetings",
          trend: "up" as const,
          trendValue: "+7 vs last week",
          icon: TrendingUp
        }
      ]
    },
    sections: [
      {
        title: "Meeting Scheduling",
        items: [
          {
            title: "Schedule New Meeting",
            subtitle: "Create and send invitations",
            icon: CalendarPlus,
            href: "/enterprise/sales/crm/activities/meetings/schedule"
          },
          {
            title: "Today's Meetings",
            subtitle: "Today's scheduled meetings",
            icon: Calendar,
            href: "/enterprise/sales/crm/activities/meetings/today",
            badge: "12"
          },
          {
            title: "Upcoming Meetings",
            subtitle: "Future scheduled meetings",
            icon: Clock,
            href: "/enterprise/sales/crm/activities/meetings/upcoming",
            badge: "28"
          },
          {
            title: "Meeting Calendar",
            subtitle: "Calendar view of all meetings",
            icon: Calendar,
            href: "/enterprise/sales/crm/activities/meetings/calendar"
          },
          {
            title: "Recurring Meetings",
            subtitle: "Manage recurring schedules",
            icon: Repeat,
            href: "/enterprise/sales/crm/activities/meetings/recurring"
          },
          {
            title: "Meeting Templates",
            subtitle: "Pre-configured meeting types",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/meetings/templates"
          }
        ]
      },
      {
        title: "Meeting Types",
        items: [
          {
            title: "Discovery Meetings",
            subtitle: "Initial prospect meetings",
            icon: Users,
            href: "/enterprise/sales/crm/activities/meetings/discovery"
          },
          {
            title: "Demo Meetings",
            subtitle: "Product demonstrations",
            icon: Video,
            href: "/enterprise/sales/crm/activities/meetings/demos"
          },
          {
            title: "Proposal Meetings",
            subtitle: "Proposal presentations",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/meetings/proposals"
          },
          {
            title: "Negotiation Meetings",
            subtitle: "Deal negotiation sessions",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/activities/meetings/negotiations"
          },
          {
            title: "Close Meetings",
            subtitle: "Final closing meetings",
            icon: Star,
            href: "/enterprise/sales/crm/activities/meetings/closing"
          },
          {
            title: "Follow-up Meetings",
            subtitle: "Post-sale follow-ups",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/activities/meetings/followup"
          }
        ]
      },
      {
        title: "Meeting Tools",
        items: [
          {
            title: "Video Conferencing",
            subtitle: "Integrated video meetings",
            icon: Video,
            href: "/enterprise/sales/crm/activities/meetings/video"
          },
          {
            title: "Screen Sharing",
            subtitle: "Share presentations and demos",
            icon: Camera,
            href: "/enterprise/sales/crm/activities/meetings/screenshare"
          },
          {
            title: "Meeting Recording",
            subtitle: "Record and review meetings",
            icon: Mic,
            href: "/enterprise/sales/crm/activities/meetings/recording"
          },
          {
            title: "Meeting Notes",
            subtitle: "Collaborative note-taking",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/meetings/notes"
          },
          {
            title: "Action Items",
            subtitle: "Track meeting outcomes",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/activities/meetings/actions"
          },
          {
            title: "Meeting Links",
            subtitle: "Easy join links and rooms",
            icon: Link,
            href: "/enterprise/sales/crm/activities/meetings/links"
          }
        ]
      },
      {
        title: "Meeting Analytics",
        items: [
          {
            title: "Meeting Performance",
            subtitle: "Meeting success metrics",
            icon: BarChart3,
            href: "/enterprise/sales/crm/activities/meetings/performance"
          },
          {
            title: "Meeting Outcomes",
            subtitle: "Results and conversion rates",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/activities/meetings/outcomes"
          },
          {
            title: "Attendance Analysis",
            subtitle: "Participation patterns",
            icon: Users,
            href: "/enterprise/sales/crm/activities/meetings/attendance"
          },
          {
            title: "Meeting Efficiency",
            subtitle: "Time and productivity metrics",
            icon: Clock,
            href: "/enterprise/sales/crm/activities/meetings/efficiency"
          },
          {
            title: "Follow-up Tracking",
            subtitle: "Post-meeting action completion",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/activities/meetings/tracking"
          },
          {
            title: "ROI Analysis",
            subtitle: "Meeting return on investment",
            icon: Star,
            href: "/enterprise/sales/crm/activities/meetings/roi"
          }
        ]
      },
      {
        title: "Meeting Management",
        items: [
          {
            title: "Meeting Rooms",
            subtitle: "Manage physical meeting spaces",
            icon: MapPin,
            href: "/enterprise/sales/crm/activities/meetings/rooms"
          },
          {
            title: "Meeting Invitations",
            subtitle: "Invitation templates and tracking",
            icon: Users,
            href: "/enterprise/sales/crm/activities/meetings/invitations"
          },
          {
            title: "Meeting Reminders",
            subtitle: "Automated reminder settings",
            icon: Bell,
            href: "/enterprise/sales/crm/activities/meetings/reminders"
          },
          {
            title: "Meeting Conflicts",
            subtitle: "Scheduling conflict resolution",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/activities/meetings/conflicts"
          },
          {
            title: "Meeting Preferences",
            subtitle: "Personal meeting settings",
            icon: Settings,
            href: "/enterprise/sales/crm/activities/meetings/preferences"
          },
          {
            title: "Meeting History",
            subtitle: "Past meeting records",
            icon: Calendar,
            href: "/enterprise/sales/crm/activities/meetings/history"
          }
        ]
      },
      {
        title: "Integration & Settings",
        items: [
          {
            title: "Calendar Integration",
            subtitle: "Sync with external calendars",
            icon: Calendar,
            href: "/enterprise/sales/crm/activities/meetings/calendar-sync"
          },
          {
            title: "Email Integration",
            subtitle: "Meeting invites via email",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/meetings/email-integration"
          },
          {
            title: "Zoom Integration",
            subtitle: "Seamless Zoom meetings",
            icon: Video,
            href: "/enterprise/sales/crm/activities/meetings/zoom"
          },
          {
            title: "Teams Integration",
            subtitle: "Microsoft Teams meetings",
            icon: Users,
            href: "/enterprise/sales/crm/activities/meetings/teams"
          },
          {
            title: "Meeting Workflows",
            subtitle: "Automated meeting processes",
            icon: Settings,
            href: "/enterprise/sales/crm/activities/meetings/workflows"
          },
          {
            title: "Meeting Compliance",
            subtitle: "Recording and privacy settings",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/activities/meetings/compliance"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.activities"]}>
      <ModuleHomePage
        moduleTitle={meetingsData.moduleTitle}
        breadcrumb={meetingsData.breadcrumb}
        overview={meetingsData.overview}
        sections={meetingsData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}