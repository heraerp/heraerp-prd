/**
 * HERA WhatsApp Message Templates for Salon
 * 
 * Professional WhatsApp Business message templates for appointment notifications
 */

export const WHATSAPP_TEMPLATES = {
  // Appointment confirmation template
  appointment_confirmation: {
    name: 'appointment_confirmation',
    text: `
🎉 *Appointment Confirmed!*

Dear {{customer_name}},

Your appointment at {{salon_name}} has been confirmed!

📅 *Service:* {{service_name}}
📅 *Date:* {{appointment_date}}
⏰ *Time:* {{appointment_time}}
💇 *Stylist:* {{staff_name}}
🔢 *Booking ID:* {{appointment_id}}

We look forward to serving you! 

For any changes or questions, please contact us.

Best regards,
{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'salon_name', 
      'service_name',
      'appointment_date',
      'appointment_time',
      'staff_name',
      'appointment_id'
    ]
  },

  // Appointment reminder template (24 hours before)
  appointment_reminder: {
    name: 'appointment_reminder',
    text: `
⏰ *Appointment Reminder*

Hi {{customer_name}},

This is a friendly reminder about your appointment:

📅 *Service:* {{service_name}}
📅 *Date:* {{appointment_date}}
⏰ *Time:* {{appointment_time}}
💇 *Stylist:* {{staff_name}}

📍 See you tomorrow at {{salon_name}}!

If you need to reschedule, please let us know as soon as possible.

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'service_name',
      'appointment_date',
      'appointment_time',
      'staff_name',
      'salon_name'
    ]
  },

  // Appointment cancellation template
  appointment_cancellation: {
    name: 'appointment_cancellation',
    text: `
❌ *Appointment Cancelled*

Dear {{customer_name}},

Your appointment has been cancelled {{cancellation_reason}}.

📅 *Service:* {{service_name}}
📅 *Date:* {{appointment_date}}
⏰ *Time:* {{appointment_time}}
🔢 *Booking ID:* {{appointment_id}}

We apologize for any inconvenience. Please contact us to reschedule.

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'cancellation_reason',
      'service_name',
      'appointment_date',
      'appointment_time',
      'appointment_id',
      'salon_name'
    ]
  },

  // Appointment rescheduled template
  appointment_rescheduled: {
    name: 'appointment_rescheduled',
    text: `
📅 *Appointment Rescheduled*

Hi {{customer_name}},

Your appointment has been rescheduled:

*Previous:*
📅 {{old_date}} at {{old_time}}

*New Appointment:*
📅 *Service:* {{service_name}}
📅 *Date:* {{new_date}}
⏰ *Time:* {{new_time}}
💇 *Stylist:* {{staff_name}}

Thank you for your understanding!

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'old_date',
      'old_time',
      'service_name',
      'new_date',
      'new_time',
      'staff_name',
      'salon_name'
    ]
  },

  // Check-in reminder (2 hours before)
  appointment_checkin_reminder: {
    name: 'appointment_checkin_reminder',
    text: `
📍 *Check-in Reminder*

Hi {{customer_name}},

Your appointment is in 2 hours!

📅 *Service:* {{service_name}}
⏰ *Time:* {{appointment_time}}
💇 *Stylist:* {{staff_name}}

Please arrive 10 minutes early for check-in.

See you soon at {{salon_name}}!
    `.trim(),
    parameters: [
      'customer_name',
      'service_name',
      'appointment_time',
      'staff_name',
      'salon_name'
    ]
  },

  // Post-appointment thank you
  appointment_thankyou: {
    name: 'appointment_thankyou',
    text: `
💝 *Thank You!*

Dear {{customer_name}},

Thank you for choosing {{salon_name}}! We hope you loved your {{service_name}} with {{staff_name}}.

⭐ Please rate your experience and leave a review!
💎 Book your next appointment to maintain your gorgeous look!

We appreciate your business!

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'salon_name',
      'service_name',
      'staff_name'
    ]
  },

  // Birthday special campaign
  birthday_special: {
    name: 'birthday_special',
    text: `
🎂 *Happy Birthday!*

Dear {{customer_name}},

Wishing you a wonderful birthday from all of us at {{salon_name}}!

🎁 *Special Birthday Gift:*
{{birthday_offer}} on any service!

🎫 *Promo Code:* {{promo_code}}
📅 *Valid Until:* {{valid_until}}

Treat yourself to something special! 💄✨

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'salon_name',
      'birthday_offer',
      'promo_code',
      'valid_until'
    ]
  },

  // Post-service follow-up
  post_service_followup: {
    name: 'post_service_followup',
    text: `
✨ *How's Your New Look?*

Hi {{customer_name}},

We hope you're loving your {{service_name}} by {{staff_name}}!

💡 *Care Tip:* {{care_tips}}

⭐ *Love your result?* Share a review: {{review_link}}

🎁 *Next Visit Bonus:* {{next_appointment_discount}}

See you soon at {{salon_name}}!
    `.trim(),
    parameters: [
      'customer_name',
      'service_name',
      'staff_name',
      'care_tips',
      'review_link',
      'next_appointment_discount',
      'salon_name'
    ]
  },

  // Win-back campaign for inactive customers
  winback_offer: {
    name: 'winback_offer',
    text: `
💔 *We Miss You!*

Hi {{customer_name}},

It's been {{last_visit_days}} days since your last visit to {{salon_name}}, and we miss you!

💎 *Come Back Special:*
{{special_offer}} on {{favorite_service}}

📅 *Valid Until:* {{valid_until}}

Let's get you looking fabulous again! 💃

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'last_visit_days',
      'salon_name',
      'special_offer',
      'favorite_service',
      'valid_until'
    ]
  },

  // Payment confirmation
  payment_confirmation: {
    name: 'payment_confirmation',
    text: `
💳 *Payment Confirmed*

Dear {{customer_name}},

Your payment has been processed successfully!

💰 *Amount:* {{amount}}
💳 *Method:* {{payment_method}}
🆔 *Transaction:* {{transaction_id}}
💇 *Services:* {{services}}
📅 *Date:* {{payment_date}}

📄 *Receipt:* {{receipt_link}}

Thank you for choosing {{salon_name}}!
    `.trim(),
    parameters: [
      'customer_name',
      'amount',
      'payment_method',
      'transaction_id',
      'services',
      'payment_date',
      'receipt_link',
      'salon_name'
    ]
  },

  // Product recommendation
  product_recommendation: {
    name: 'product_recommendation',
    text: `
🛒 *Perfect Products for You*

Hi {{customer_name}},

Based on your recent {{service_name}}, we recommend:

✨ {{product_name}}
💰 Special Price: {{special_price}} (was {{original_price}})

🎯 *Why it's perfect for you:*
{{product_benefits}}

📱 Order now or visit us in-store!

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'service_name',
      'product_name',
      'special_price',
      'original_price',
      'product_benefits',
      'salon_name'
    ]
  },

  // Emergency closure
  emergency_closure: {
    name: 'emergency_closure',
    text: `
🚨 *Important Update*

Dear {{customer_name}},

We're sorry to inform you that {{salon_name}} will be closed on {{closure_date}} {{closure_reason}}.

📅 *Your affected appointment:*
⏰ {{appointment_time}} - {{service_name}}

📞 *Next Steps:*
{{rescheduling_info}}

We sincerely apologize for the inconvenience.

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'salon_name',
      'closure_date',
      'closure_reason',
      'appointment_time',
      'service_name',
      'rescheduling_info'
    ]
  },

  // New service launch
  new_service_launch: {
    name: 'new_service_launch',
    text: `
🚀 *Exciting New Service!*

Hi {{customer_name}},

We're thrilled to introduce our latest service:

✨ *{{service_name}}*
💰 *Introductory Price:* {{intro_price}}
⏱️ *Duration:* {{duration}}

🎁 *Launch Special:* {{launch_offer}}
📅 *Available from:* {{launch_date}}

Book now to be among the first to try it!

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'service_name',
      'intro_price',
      'duration',
      'launch_offer',
      'launch_date',
      'salon_name'
    ]
  },

  // VIP milestone celebration
  milestone_celebration: {
    name: 'milestone_celebration',
    text: `
🏆 *Congratulations!*

Dear {{customer_name}},

You've reached an amazing milestone with {{salon_name}}!

🎉 *{{milestone_type}}:* {{milestone_number}}

🎁 *Your Reward:*
{{reward_description}}

Thank you for being such a valued customer! 💎

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'salon_name',
      'milestone_type',
      'milestone_number',
      'reward_description'
    ]
  },

  // Outstanding payment reminder
  payment_reminder: {
    name: 'payment_reminder',
    text: `
💳 *Payment Reminder*

Dear {{customer_name}},

We have an outstanding balance on your account:

💰 *Amount Due:* {{amount_due}}
📅 *Service Date:* {{service_date}}
💇 *Services:* {{services}}

📱 Pay easily: {{payment_link}}
📞 Questions? Call us: {{salon_phone}}

{{salon_name}} Team
    `.trim(),
    parameters: [
      'customer_name',
      'amount_due',
      'service_date',
      'services',
      'payment_link',
      'salon_phone',
      'salon_name'
    ]
  }
}

// Helper function to format WhatsApp template message
export function formatWhatsAppTemplate(
  templateName: keyof typeof WHATSAPP_TEMPLATES,
  parameters: Record<string, string>
): string {
  const template = WHATSAPP_TEMPLATES[templateName]
  if (!template) {
    throw new Error(`WhatsApp template '${templateName}' not found`)
  }

  let message = template.text
  
  // Replace all parameters in the template
  template.parameters.forEach(param => {
    const value = parameters[param] || `[${param}]`
    const regex = new RegExp(`{{${param}}}`, 'g')
    message = message.replace(regex, value)
  })

  return message
}

// Validate template parameters
export function validateTemplateParameters(
  templateName: keyof typeof WHATSAPP_TEMPLATES,
  parameters: Record<string, string>
): { isValid: boolean; missingParams: string[] } {
  const template = WHATSAPP_TEMPLATES[templateName]
  if (!template) {
    return { isValid: false, missingParams: [] }
  }

  const missingParams = template.parameters.filter(param => !parameters[param])
  
  return {
    isValid: missingParams.length === 0,
    missingParams
  }
}