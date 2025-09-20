/**
 * HERA Universal Configuration - Notification Rules Family
 * Smart Code: HERA.UNIV.CONFIG.NOTIFICATION.*
 *
 * Manages notification triggers, templates, delivery methods, and customer preferences
 */

import type { UniversalRule, Context } from '../universal-config-service'

// Notification-specific context extensions
export interface NotificationContext extends Context {
  trigger_event?: NotificationTrigger
  customer_preferences?: {
    email_opt_in: boolean
    sms_opt_in: boolean
    push_opt_in: boolean
    quiet_hours?: { start: string; end: string }
    language?: string
  }
  event_data?: Record<string, any>
  priority?: 'low' | 'normal' | 'high' | 'urgent'
}

// Notification trigger types
export type NotificationTrigger =
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_cancelled'
  | 'booking_rescheduled'
  | 'payment_received'
  | 'payment_failed'
  | 'loyalty_points_earned'
  | 'loyalty_tier_upgrade'
  | 'birthday_greeting'
  | 'feedback_request'
  | 'promotion_available'
  | 'appointment_no_show'
  | 'staff_assigned'
  | 'service_completed'
  | 'custom_trigger'

// Notification rule payload types
export interface NotificationPayload {
  enabled: boolean

  // Delivery channels
  channels: NotificationChannel[]

  // Timing configuration
  send_immediately?: boolean
  delay_minutes?: number
  batch_window?: {
    start_time: string
    end_time: string
  }

  // Templates per channel
  templates: {
    [K in NotificationChannel]?: NotificationTemplate
  }

  // Reminder configuration
  reminders?: {
    intervals: number[] // Minutes before appointment
    channels: NotificationChannel[]
  }

  // Rate limiting
  rate_limit?: {
    max_per_hour?: number
    max_per_day?: number
    max_per_week?: number
  }

  // Customer segment overrides
  segment_overrides?: {
    [segment: string]: {
      channels?: NotificationChannel[]
      template_overrides?: Record<string, any>
      enabled?: boolean
    }
  }

  // A/B testing
  variants?: NotificationVariant[]

  // Delivery preferences
  respect_quiet_hours: boolean
  respect_opt_out: boolean
  fallback_channel?: NotificationChannel

  // Tracking
  track_opens?: boolean
  track_clicks?: boolean

  // Custom data
  custom_data?: Record<string, any>
}

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp'

export interface NotificationTemplate {
  subject?: string // For email
  body: string
  variables?: string[] // Available template variables

  // Rich content (email/push)
  html_body?: string
  attachments?: string[]
  images?: string[]

  // SMS specific
  sender_id?: string

  // Push specific
  title?: string
  icon?: string
  action_url?: string

  // WhatsApp specific
  template_name?: string // Pre-approved template
  template_params?: string[]

  // Localization
  translations?: {
    [locale: string]: {
      subject?: string
      body: string
      title?: string
    }
  }
}

export interface NotificationVariant {
  variant_id: string
  weight: number // For distribution
  template_overrides: Partial<NotificationTemplate>
}

/**
 * Notification rule family definition
 */
export const NotificationRuleFamily = {
  // Family identifier
  family: 'HERA.UNIV.CONFIG.NOTIFICATION',

  // Sub-families for specific notification scenarios
  subFamilies: {
    BOOKING: 'HERA.UNIV.CONFIG.NOTIFICATION.BOOKING.V1',
    PAYMENT: 'HERA.UNIV.CONFIG.NOTIFICATION.PAYMENT.V1',
    LOYALTY: 'HERA.UNIV.CONFIG.NOTIFICATION.LOYALTY.V1',
    MARKETING: 'HERA.UNIV.CONFIG.NOTIFICATION.MARKETING.V1',
    OPERATIONAL: 'HERA.UNIV.CONFIG.NOTIFICATION.OPERATIONAL.V1',
    REMINDER: 'HERA.UNIV.CONFIG.NOTIFICATION.REMINDER.V1',
    FEEDBACK: 'HERA.UNIV.CONFIG.NOTIFICATION.FEEDBACK.V1',
    CUSTOM: 'HERA.UNIV.CONFIG.NOTIFICATION.CUSTOM.V1'
  },

  // Default conditions
  defaultConditions: {
    effective_from: new Date().toISOString()
  },

  // Default payload values
  defaultPayload: {
    enabled: true,
    channels: ['email'],
    send_immediately: true,
    respect_quiet_hours: true,
    respect_opt_out: true,
    rate_limit: {
      max_per_day: 10
    }
  },

  // Validation function
  validate: (rule: UniversalRule): string[] => {
    const errors: string[] = []
    const payload = rule.payload as NotificationPayload

    // Validate channels
    if (!payload.channels || payload.channels.length === 0) {
      errors.push('At least one channel must be specified')
    }

    // Validate templates
    if (payload.templates) {
      for (const channel of payload.channels) {
        if (!payload.templates[channel]) {
          errors.push(`Missing template for channel: ${channel}`)
        }
      }
    }

    // Validate delay
    if (payload.delay_minutes !== undefined && payload.delay_minutes < 0) {
      errors.push('delay_minutes must be positive')
    }

    // Validate batch window times
    if (payload.batch_window) {
      if (
        !isValidTimeFormat(payload.batch_window.start_time) ||
        !isValidTimeFormat(payload.batch_window.end_time)
      ) {
        errors.push('Invalid batch window time format (use HH:MM)')
      }
    }

    // Validate rate limits
    if (payload.rate_limit) {
      const limits = ['max_per_hour', 'max_per_day', 'max_per_week'] as const
      for (const limit of limits) {
        const value = payload.rate_limit[limit]
        if (value !== undefined && value < 0) {
          errors.push(`${limit} must be positive`)
        }
      }
    }

    return errors
  },

  // Merge strategy
  mergeStrategy: 'combine', // Combine templates from multiple rules

  // Context requirements
  requiredContext: ['trigger_event'],

  // Sample templates
  templates: {
    bookingConfirmation: {
      smart_code: 'HERA.UNIV.CONFIG.NOTIFICATION.BOOKING.V1',
      status: 'active',
      priority: 100,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        enabled: true,
        channels: ['email', 'sms'],
        send_immediately: true,
        templates: {
          email: {
            subject: 'Booking Confirmed - {{service_name}}',
            body: `Dear {{customer_name}},

Your booking has been confirmed:
- Service: {{service_name}}
- Date: {{appointment_date}}
- Time: {{appointment_time}}
- Specialist: {{specialist_name}}

We look forward to seeing you!`,
            html_body: `<html><body>
<h2>Booking Confirmed</h2>
<p>Dear {{customer_name}},</p>
<p>Your booking has been confirmed:</p>
<ul>
  <li><strong>Service:</strong> {{service_name}}</li>
  <li><strong>Date:</strong> {{appointment_date}}</li>
  <li><strong>Time:</strong> {{appointment_time}}</li>
  <li><strong>Specialist:</strong> {{specialist_name}}</li>
</ul>
<p>We look forward to seeing you!</p>
</body></html>`,
            variables: [
              'customer_name',
              'service_name',
              'appointment_date',
              'appointment_time',
              'specialist_name'
            ]
          },
          sms: {
            body: 'Hi {{customer_name}}, your {{service_name}} booking on {{appointment_date}} at {{appointment_time}} is confirmed. See you soon!',
            variables: ['customer_name', 'service_name', 'appointment_date', 'appointment_time']
          }
        },
        respect_quiet_hours: false, // Send immediately for confirmations
        respect_opt_out: true
      }
    },

    appointmentReminder: {
      smart_code: 'HERA.UNIV.CONFIG.NOTIFICATION.REMINDER.V1',
      status: 'active',
      priority: 100,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        enabled: true,
        channels: ['sms', 'push'],
        reminders: {
          intervals: [1440, 60], // 24 hours and 1 hour before
          channels: ['sms', 'push']
        },
        templates: {
          sms: {
            body: 'Reminder: You have a {{service_name}} appointment tomorrow at {{appointment_time}}. Reply CANCEL to cancel.',
            variables: ['service_name', 'appointment_time']
          },
          push: {
            title: 'Appointment Reminder',
            body: '{{service_name}} tomorrow at {{appointment_time}}',
            action_url: '/appointments/{{appointment_id}}',
            variables: ['service_name', 'appointment_time', 'appointment_id']
          }
        },
        respect_quiet_hours: true,
        respect_opt_out: true
      }
    },

    loyaltyPointsEarned: {
      smart_code: 'HERA.UNIV.CONFIG.NOTIFICATION.LOYALTY.V1',
      status: 'active',
      priority: 50,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        enabled: true,
        channels: ['email', 'in_app'],
        send_immediately: false,
        delay_minutes: 30, // Send after service completion
        templates: {
          email: {
            subject: 'You earned {{points}} loyalty points!',
            body: `Hi {{customer_name}},

You've earned {{points}} points for your recent visit!
Your total balance: {{total_points}} points

{{#if can_redeem}}
You have enough points to redeem rewards! Check them out in your account.
{{/if}}`,
            variables: ['customer_name', 'points', 'total_points', 'can_redeem']
          },
          in_app: {
            body: 'You earned {{points}} points! Total: {{total_points}}',
            variables: ['points', 'total_points']
          }
        },
        respect_quiet_hours: true,
        respect_opt_out: true
      }
    },

    feedbackRequest: {
      smart_code: 'HERA.UNIV.CONFIG.NOTIFICATION.FEEDBACK.V1',
      status: 'active',
      priority: 30,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        enabled: true,
        channels: ['email'],
        send_immediately: false,
        delay_minutes: 1440, // 24 hours after service
        templates: {
          email: {
            subject: 'How was your experience with {{service_name}}?',
            body: `Dear {{customer_name}},

Thank you for visiting us yesterday for your {{service_name}} service with {{specialist_name}}.

We'd love to hear about your experience. Your feedback helps us improve our services.

[Rate Your Experience]

Thank you!`,
            html_body: `<html><body>
<p>Dear {{customer_name}},</p>
<p>Thank you for visiting us yesterday for your {{service_name}} service with {{specialist_name}}.</p>
<p>We'd love to hear about your experience. Your feedback helps us improve our services.</p>
<p><a href="{{feedback_url}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Rate Your Experience</a></p>
<p>Thank you!</p>
</body></html>`,
            variables: ['customer_name', 'service_name', 'specialist_name', 'feedback_url']
          }
        },
        rate_limit: {
          max_per_week: 1 // Don't spam with feedback requests
        },
        respect_quiet_hours: true,
        respect_opt_out: true
      }
    },

    // A/B testing example
    promotionalWithVariants: {
      smart_code: 'HERA.UNIV.CONFIG.NOTIFICATION.MARKETING.V1',
      status: 'active',
      priority: 20,
      conditions: {
        effective_from: new Date().toISOString()
      },
      payload: {
        enabled: true,
        channels: ['email'],
        send_immediately: false,
        batch_window: {
          start_time: '10:00',
          end_time: '11:00'
        },
        templates: {
          email: {
            subject: 'Special Offer Just for You!',
            body: 'Get 20% off your next service. Book now!'
          }
        },
        variants: [
          {
            variant_id: 'urgent_tone',
            weight: 0.5,
            template_overrides: {
              subject: 'Limited Time: 20% Off - Book Today!',
              body: 'Hurry! This 20% discount expires soon. Book your service now!'
            }
          },
          {
            variant_id: 'personal_tone',
            weight: 0.5,
            template_overrides: {
              subject: "{{customer_name}}, here's your exclusive 20% discount",
              body: 'Hi {{customer_name}}, as a valued customer, enjoy 20% off your favorite service!'
            }
          }
        ],
        track_opens: true,
        track_clicks: true,
        respect_quiet_hours: true,
        respect_opt_out: true
      }
    }
  }
}

// Helper function
function isValidTimeFormat(time: string): boolean {
  const regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
  return regex.test(time)
}

// Type guard
export function isNotificationPayload(payload: any): payload is NotificationPayload {
  return (
    payload &&
    typeof payload.enabled === 'boolean' &&
    Array.isArray(payload.channels) &&
    payload.channels.length > 0
  )
}

// Export types
export type NotificationRule = UniversalRule & {
  payload: NotificationPayload
}
