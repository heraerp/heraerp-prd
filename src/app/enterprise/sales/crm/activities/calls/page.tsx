'use client'

/**
 * CRM Call Activities
 * Smart Code: HERA.ENTERPRISE.CRM.ACTIVITIES.CALLS.v1
 * 
 * Call activity management and tracking
 */

import React from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import {
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  Clock,
  Calendar,
  Users,
  BarChart3,
  TrendingUp,
  Star,
  CheckCircle,
  AlertTriangle,
  Activity,
  Mic,
  MicOff,
  Play,
  VolumeX,
  Volume2,
  FileText
} from 'lucide-react'

export default function CRMCallActivitiesPage() {
  const callsData = {
    moduleTitle: "Call Activities",
    breadcrumb: "Sales & Distribution → CRM → Activities → Calls",
    overview: {
      title: "Call Activity Management",
      subtitle: "Phone Communication & Call Tracking",
      kpis: [
        {
          title: "Calls Today",
          value: "47",
          subtitle: "Total calls made",
          trend: "up" as const,
          trendValue: "+12 vs yesterday",
          icon: Phone
        },
        {
          title: "Call Success Rate",
          value: "68.4",
          unit: "%",
          subtitle: "Connected calls",
          trend: "up" as const,
          trendValue: "+5.2%",
          icon: CheckCircle
        },
        {
          title: "Average Call Duration",
          value: "8.3",
          unit: " min",
          subtitle: "Per connected call",
          trend: "up" as const,
          trendValue: "+1.2 min",
          icon: Clock
        },
        {
          title: "Follow-up Required",
          value: "23",
          subtitle: "Calls needing follow-up",
          trend: "neutral" as const,
          trendValue: "12 scheduled",
          icon: Calendar
        },
        {
          title: "Call Quality Score",
          value: "4.2",
          unit: "/5.0",
          subtitle: "Average call rating",
          trend: "up" as const,
          trendValue: "+0.3 improved",
          icon: Star
        },
        {
          title: "Opportunities Created",
          value: "8",
          subtitle: "From today's calls",
          trend: "up" as const,
          trendValue: "+3 vs target",
          icon: TrendingUp
        }
      ]
    },
    sections: [
      {
        title: "Call Management",
        items: [
          {
            title: "Make New Call",
            subtitle: "Initiate outbound call",
            icon: PhoneOutgoing,
            href: "/enterprise/sales/crm/activities/calls/make"
          },
          {
            title: "Call Queue",
            subtitle: "Scheduled and pending calls",
            icon: Clock,
            href: "/enterprise/sales/crm/activities/calls/queue",
            badge: "23"
          },
          {
            title: "Call History",
            subtitle: "All call records",
            icon: Phone,
            href: "/enterprise/sales/crm/activities/calls/history"
          },
          {
            title: "Missed Calls",
            subtitle: "Calls requiring follow-up",
            icon: PhoneIncoming,
            href: "/enterprise/sales/crm/activities/calls/missed",
            badge: "7"
          },
          {
            title: "Call Templates",
            subtitle: "Pre-defined call scripts",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/calls/templates"
          },
          {
            title: "Call Recordings",
            subtitle: "Audio recordings and notes",
            icon: Mic,
            href: "/enterprise/sales/crm/activities/calls/recordings"
          }
        ]
      },
      {
        title: "Call Lists & Campaigns",
        items: [
          {
            title: "Prospect Call Lists",
            subtitle: "Organized calling lists",
            icon: Users,
            href: "/enterprise/sales/crm/activities/calls/lists"
          },
          {
            title: "Cold Calling Campaigns",
            subtitle: "Outbound campaigns",
            icon: PhoneOutgoing,
            href: "/enterprise/sales/crm/activities/calls/campaigns"
          },
          {
            title: "Follow-up Calls",
            subtitle: "Scheduled follow-ups",
            icon: Calendar,
            href: "/enterprise/sales/crm/activities/calls/followup",
            badge: "15"
          },
          {
            title: "Warm Call Lists",
            subtitle: "Qualified prospects",
            icon: Star,
            href: "/enterprise/sales/crm/activities/calls/warm"
          },
          {
            title: "VIP Customer Calls",
            subtitle: "High-value customer outreach",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/activities/calls/vip"
          },
          {
            title: "Call Cadences",
            subtitle: "Automated call sequences",
            icon: Activity,
            href: "/enterprise/sales/crm/activities/calls/cadences"
          }
        ]
      },
      {
        title: "Call Analytics",
        items: [
          {
            title: "Call Performance Reports",
            subtitle: "Call metrics and KPIs",
            icon: BarChart3,
            href: "/enterprise/sales/crm/activities/calls/performance"
          },
          {
            title: "Call Outcome Analysis",
            subtitle: "Results and conversion rates",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/activities/calls/outcomes"
          },
          {
            title: "Call Duration Analysis",
            subtitle: "Time management insights",
            icon: Clock,
            href: "/enterprise/sales/crm/activities/calls/duration"
          },
          {
            title: "Best Time to Call",
            subtitle: "Optimal calling times",
            icon: Calendar,
            href: "/enterprise/sales/crm/activities/calls/timing"
          },
          {
            title: "Call Success Patterns",
            subtitle: "Identify winning approaches",
            icon: Star,
            href: "/enterprise/sales/crm/activities/calls/patterns"
          },
          {
            title: "Rep Call Performance",
            subtitle: "Individual calling metrics",
            icon: Users,
            href: "/enterprise/sales/crm/activities/calls/rep-performance"
          }
        ]
      },
      {
        title: "Call Tools & Features",
        items: [
          {
            title: "Click-to-Call",
            subtitle: "One-click calling from CRM",
            icon: PhoneCall,
            href: "/enterprise/sales/crm/activities/calls/click-to-call"
          },
          {
            title: "Call Recording",
            subtitle: "Record and review calls",
            icon: Mic,
            href: "/enterprise/sales/crm/activities/calls/recording"
          },
          {
            title: "Call Transcription",
            subtitle: "AI-powered call transcripts",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/calls/transcription"
          },
          {
            title: "Call Coaching",
            subtitle: "Real-time coaching tools",
            icon: Volume2,
            href: "/enterprise/sales/crm/activities/calls/coaching"
          },
          {
            title: "Call Disposition",
            subtitle: "Call outcome tracking",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/activities/calls/disposition"
          },
          {
            title: "Call Notes & Tasks",
            subtitle: "Post-call action items",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/calls/notes"
          }
        ]
      },
      {
        title: "Integration & Settings",
        items: [
          {
            title: "Phone System Integration",
            subtitle: "VoIP and PBX connections",
            icon: Phone,
            href: "/enterprise/sales/crm/activities/calls/integration"
          },
          {
            title: "Call Routing Rules",
            subtitle: "Automatic call distribution",
            icon: Activity,
            href: "/enterprise/sales/crm/activities/calls/routing"
          },
          {
            title: "Caller ID Management",
            subtitle: "Outbound number settings",
            icon: PhoneOutgoing,
            href: "/enterprise/sales/crm/activities/calls/caller-id"
          },
          {
            title: "Call Monitoring",
            subtitle: "Supervisor monitoring tools",
            icon: Users,
            href: "/enterprise/sales/crm/activities/calls/monitoring"
          },
          {
            title: "Call Compliance",
            subtitle: "Recording consent and regulations",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/activities/calls/compliance"
          },
          {
            title: "Call Settings",
            subtitle: "General call preferences",
            icon: Star,
            href: "/enterprise/sales/crm/activities/calls/settings"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.activities"]}>
      <ModuleHomePage
        moduleTitle={callsData.moduleTitle}
        breadcrumb={callsData.breadcrumb}
        overview={callsData.overview}
        sections={callsData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}