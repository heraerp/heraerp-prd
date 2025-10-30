'use client'

/**
 * CRM Email Activities
 * Smart Code: HERA.ENTERPRISE.CRM.ACTIVITIES.EMAILS.v1
 * 
 * Email communication and campaign management
 */

import React from 'react'
import { ProtectedPage, ProtectedSection } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import {
  Mail,
  Send,
  Inbox,
  MailOpen,
  Reply,
  Forward,
  Users,
  TrendingUp,
  BarChart3,
  Clock,
  Star,
  CheckCircle,
  AlertTriangle,
  FileText,
  Image,
  Paperclip,
  Eye,
  MousePointer
} from 'lucide-react'

export default function CRMEmailActivitiesPage() {
  const emailsData = {
    moduleTitle: "Email Activities",
    breadcrumb: "Sales & Distribution → CRM → Activities → Emails",
    overview: {
      title: "Email Communication Hub",
      subtitle: "Email Campaigns, Templates & Analytics",
      kpis: [
        {
          title: "Emails Sent Today",
          value: "142",
          subtitle: "Individual and campaign emails",
          trend: "up" as const,
          trendValue: "+23 vs yesterday",
          icon: Send
        },
        {
          title: "Open Rate",
          value: "34.8",
          unit: "%",
          subtitle: "Email open percentage",
          trend: "up" as const,
          trendValue: "+2.3%",
          icon: MailOpen
        },
        {
          title: "Click-through Rate",
          value: "8.7",
          unit: "%",
          subtitle: "Link click percentage",
          trend: "up" as const,
          trendValue: "+1.2%",
          icon: MousePointer
        },
        {
          title: "Response Rate",
          value: "12.4",
          unit: "%",
          subtitle: "Email reply rate",
          trend: "up" as const,
          trendValue: "+3.1%",
          icon: Reply
        },
        {
          title: "Unsubscribe Rate",
          value: "0.8",
          unit: "%",
          subtitle: "Unsubscription rate",
          trend: "down" as const,
          trendValue: "-0.3% improved",
          icon: AlertTriangle
        },
        {
          title: "Opportunities Created",
          value: "6",
          subtitle: "From email responses",
          trend: "up" as const,
          trendValue: "+2 this week",
          icon: TrendingUp
        }
      ]
    },
    sections: [
      {
        title: "Email Composition",
        items: [
          {
            title: "Compose New Email",
            subtitle: "Send individual emails",
            icon: Mail,
            href: "/enterprise/sales/crm/activities/emails/compose"
          },
          {
            title: "Email Templates",
            subtitle: "Pre-designed email templates",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/emails/templates"
          },
          {
            title: "Quick Replies",
            subtitle: "Fast response templates",
            icon: Reply,
            href: "/enterprise/sales/crm/activities/emails/quick-replies"
          },
          {
            title: "Email Signatures",
            subtitle: "Professional email signatures",
            icon: Star,
            href: "/enterprise/sales/crm/activities/emails/signatures"
          },
          {
            title: "Email Attachments",
            subtitle: "Manage email attachments",
            icon: Paperclip,
            href: "/enterprise/sales/crm/activities/emails/attachments"
          },
          {
            title: "Rich Media Emails",
            subtitle: "Images, videos, and rich content",
            icon: Image,
            href: "/enterprise/sales/crm/activities/emails/rich-media"
          }
        ]
      },
      {
        title: "Email Management",
        items: [
          {
            title: "Inbox",
            subtitle: "Incoming email management",
            icon: Inbox,
            href: "/enterprise/sales/crm/activities/emails/inbox",
            badge: "23"
          },
          {
            title: "Sent Emails",
            subtitle: "Outbound email tracking",
            icon: Send,
            href: "/enterprise/sales/crm/activities/emails/sent"
          },
          {
            title: "Email Threads",
            subtitle: "Conversation management",
            icon: Reply,
            href: "/enterprise/sales/crm/activities/emails/threads"
          },
          {
            title: "Scheduled Emails",
            subtitle: "Delayed send emails",
            icon: Clock,
            href: "/enterprise/sales/crm/activities/emails/scheduled",
            badge: "8"
          },
          {
            title: "Draft Emails",
            subtitle: "Unsent draft emails",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/emails/drafts",
            badge: "5"
          },
          {
            title: "Email Tracking",
            subtitle: "Open and click tracking",
            icon: Eye,
            href: "/enterprise/sales/crm/activities/emails/tracking"
          }
        ]
      },
      {
        title: "Email Campaigns",
        items: [
          {
            title: "Create Campaign",
            subtitle: "Design email campaigns",
            icon: Users,
            href: "/enterprise/sales/crm/activities/emails/campaigns/create"
          },
          {
            title: "Active Campaigns",
            subtitle: "Running email campaigns",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/activities/emails/campaigns/active",
            badge: "3"
          },
          {
            title: "Campaign Templates",
            subtitle: "Reusable campaign designs",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/emails/campaigns/templates"
          },
          {
            title: "Drip Campaigns",
            subtitle: "Automated email sequences",
            icon: Clock,
            href: "/enterprise/sales/crm/activities/emails/campaigns/drip"
          },
          {
            title: "A/B Testing",
            subtitle: "Email testing and optimization",
            icon: BarChart3,
            href: "/enterprise/sales/crm/activities/emails/campaigns/ab-testing"
          },
          {
            title: "Campaign Analytics",
            subtitle: "Performance metrics",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/activities/emails/campaigns/analytics"
          }
        ]
      },
      {
        title: "Email Analytics",
        items: [
          {
            title: "Email Performance",
            subtitle: "Open, click, and response rates",
            icon: BarChart3,
            href: "/enterprise/sales/crm/activities/emails/analytics/performance"
          },
          {
            title: "Engagement Metrics",
            subtitle: "Email engagement analysis",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/activities/emails/analytics/engagement"
          },
          {
            title: "Deliverability Reports",
            subtitle: "Email delivery success",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/activities/emails/analytics/deliverability"
          },
          {
            title: "Bounce Analysis",
            subtitle: "Email bounce tracking",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/activities/emails/analytics/bounces"
          },
          {
            title: "Time-based Analytics",
            subtitle: "Best sending times",
            icon: Clock,
            href: "/enterprise/sales/crm/activities/emails/analytics/timing"
          },
          {
            title: "Email ROI",
            subtitle: "Revenue from email activities",
            icon: Star,
            href: "/enterprise/sales/crm/activities/emails/analytics/roi"
          }
        ]
      },
      {
        title: "Email Automation",
        items: [
          {
            title: "Email Workflows",
            subtitle: "Automated email processes",
            icon: Users,
            href: "/enterprise/sales/crm/activities/emails/automation/workflows"
          },
          {
            title: "Trigger-based Emails",
            subtitle: "Event-triggered communications",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/activities/emails/automation/triggers"
          },
          {
            title: "Follow-up Sequences",
            subtitle: "Automated follow-up emails",
            icon: Reply,
            href: "/enterprise/sales/crm/activities/emails/automation/sequences"
          },
          {
            title: "Lead Nurturing",
            subtitle: "Automated lead nurturing",
            icon: Star,
            href: "/enterprise/sales/crm/activities/emails/automation/nurturing"
          },
          {
            title: "Email Personalization",
            subtitle: "Dynamic content insertion",
            icon: Users,
            href: "/enterprise/sales/crm/activities/emails/automation/personalization"
          },
          {
            title: "Smart Sending",
            subtitle: "AI-optimized send times",
            icon: Clock,
            href: "/enterprise/sales/crm/activities/emails/automation/smart-sending"
          }
        ]
      },
      {
        title: "Integration & Settings",
        items: [
          {
            title: "Email Integration",
            subtitle: "Connect email providers",
            icon: Mail,
            href: "/enterprise/sales/crm/activities/emails/integration/providers"
          },
          {
            title: "Email Sync",
            subtitle: "Two-way email synchronization",
            icon: TrendingUp,
            href: "/enterprise/sales/crm/activities/emails/integration/sync"
          },
          {
            title: "Email Rules",
            subtitle: "Automatic email processing",
            icon: CheckCircle,
            href: "/enterprise/sales/crm/activities/emails/settings/rules"
          },
          {
            title: "Spam Protection",
            subtitle: "Email security settings",
            icon: AlertTriangle,
            href: "/enterprise/sales/crm/activities/emails/settings/spam"
          },
          {
            title: "Email Compliance",
            subtitle: "GDPR and CAN-SPAM compliance",
            icon: FileText,
            href: "/enterprise/sales/crm/activities/emails/settings/compliance"
          },
          {
            title: "Email Preferences",
            subtitle: "Personal email settings",
            icon: Star,
            href: "/enterprise/sales/crm/activities/emails/settings/preferences"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="sales" requiredPermissions={["crm.activities"]}>
      <ModuleHomePage
        moduleTitle={emailsData.moduleTitle}
        breadcrumb={emailsData.breadcrumb}
        overview={emailsData.overview}
        sections={emailsData.sections}
        onBack={() => window.history.back()}
      />
    </ProtectedPage>
  )
}