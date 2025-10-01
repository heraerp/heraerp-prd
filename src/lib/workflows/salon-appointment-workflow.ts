/**
 * HERA Salon Appointment Workflow
 * Smart Code: HERA.SALON.WORKFLOW.APPOINTMENT.V1
 *
 * Complete end-to-end appointment lifecycle using HERA Workflow Engine
 * Sacred 6-table architecture with payment guardrails
 */

import { WorkflowDefinition, WorkflowStep, WorkflowTrigger } from '@/lib/workflow/types'
import { universalApi } from '@/lib/universal-api'

export const APPOINTMENT_SMART_CODES = {
  // Entity Smart Codes
  APPOINTMENT: 'HERA.SALON.APPOINTMENT.ENTITY.BASE.V1',
  STATUS_REQUESTED: 'HERA.SALON.APPOINTMENT.STATUS.SCHEDULE_REQUESTED.V1',
  STATUS_SCHEDULED: 'HERA.SALON.APPOINTMENT.STATUS.SCHEDULED.V1',
  STATUS_CHECKED_IN: 'HERA.SALON.APPOINTMENT.STATUS.CHECKED_IN.V1',
  STATUS_IN_PROGRESS: 'HERA.SALON.APPOINTMENT.STATUS.IN_PROGRESS.V1',
  STATUS_COMPLETED: 'HERA.SALON.APPOINTMENT.STATUS.COMPLETED.V1',
  STATUS_REVIEW_PENDING: 'HERA.SALON.APPOINTMENT.STATUS.REVIEW_PENDING.V1',
  STATUS_REVIEWED: 'HERA.SALON.APPOINTMENT.STATUS.REVIEWED.V1',
  STATUS_CLOSED: 'HERA.SALON.APPOINTMENT.STATUS.CLOSED.V1',
  STATUS_CANCELLED_CLIENT: 'HERA.SALON.APPOINTMENT.STATUS.CANCELLED_BY_CLIENT.V1',
  STATUS_CANCELLED_NO_SERVICE: 'HERA.SALON.APPOINTMENT.STATUS.CANCELLED_NOT_SERVED.V1',
  STATUS_DISPUTED: 'HERA.SALON.APPOINTMENT.STATUS.DISPUTED.V1',
  STATUS_PARTIAL: 'HERA.SALON.APPOINTMENT.STATUS.PARTIALLY_COMPLETED.V1',

  // Relationship Smart Codes
  HAS_STATUS: 'HERA.SALON.APPOINTMENT.REL.APPOINTMENT_HAS_STATUS.V1',
  LINKED_TO_PAYMENT: 'HERA.SALON.APPOINTMENT.REL.APPOINTMENT_LINKED_TO_PAYMENT.V1',
  ASSIGNED_TO_STAFF: 'HERA.SALON.APPOINTMENT.REL.ASSIGNED_TO_STAFF.V1',
  FOR_SERVICE: 'HERA.SALON.APPOINTMENT.REL.FOR_SERVICE.V1',

  // Transaction Smart Codes
  CHECKIN: 'HERA.SALON.APPOINTMENT.TXN.CHECKIN.V1',
  SERVICE_DELIVERY: 'HERA.SALON.APPOINTMENT.TXN.SERVICE_DELIVERY.V1',
  COMPLETION: 'HERA.SALON.APPOINTMENT.TXN.COMPLETION.V1',
  PAYMENT_PREAUTH: 'HERA.SALON.PAYMENT.TXN.PREAUTH.V1',
  PAYMENT_CAPTURE: 'HERA.SALON.PAYMENT.TXN.CAPTURE.V1',
  PAYMENT_REFUND: 'HERA.SALON.PAYMENT.TXN.REFUND.V1',
  PAYMENT_VOID: 'HERA.SALON.PAYMENT.TXN.VOID.V1',

  // Transaction Line Smart Codes
  SERVICE_LINE: 'HERA.SALON.APPOINTMENT.TXN.LINE.SERVICE.V1',
  PRODUCT_LINE: 'HERA.SALON.APPOINTMENT.TXN.LINE.PRODUCT.V1',
  DISCOUNT_LINE: 'HERA.SALON.APPOINTMENT.TXN.LINE.DISCOUNT.V1'
} as const

export const salonAppointmentWorkflow: WorkflowDefinition = {
  id: 'salon-appointment-workflow',
  name: 'Salon Appointment Lifecycle',
  description: 'Complete appointment flow from booking to review with payment guardrails',
  version: '1.0.0',
  smart_code: 'HERA.SALON.WORKFLOW.APPOINTMENT.V1',

  // Initial trigger - appointment creation
  trigger: {
    type: 'entity_created',
    entity_type: 'appointment',
    smart_code_pattern: 'HERA.SALON.APPOINTMENT.ENTITY.*'
  },

  // Workflow variables
  variables: {
    appointment_id: { type: 'string', required: true },
    organization_id: { type: 'string', required: true },
    client_id: { type: 'string', required: true },
    service_id: { type: 'string', required: true },
    staff_id: { type: 'string', required: true },
    appointment_time: { type: 'datetime', required: true },
    duration_minutes: { type: 'number', required: true },
    payment_status: { type: 'string', default: 'pending', required: false },
    cancellation_reason: { type: 'string', required: false }
  },

  // Workflow steps
  steps: [
    {
      id: 'setup-status-entities',
      name: 'Ensure Status Entities Exist',
      type: 'conditional',
      condition: 'first_run_only',
      actions: [
        {
          type: 'create_entity',
          entities: [
            {
              entity_type: 'appointment_status',
              entity_name: 'Schedule Requested',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_REQUESTED
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'Scheduled',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_SCHEDULED
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'Checked In',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_CHECKED_IN
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'In Progress',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_IN_PROGRESS
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'Completed',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_COMPLETED
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'Review Pending',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_REVIEW_PENDING
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'Reviewed',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_REVIEWED
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'Closed',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_CLOSED
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'Cancelled by Client',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_CANCELLED_CLIENT
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'Cancelled - Not Served',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_CANCELLED_NO_SERVICE
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'Disputed',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_DISPUTED
            },
            {
              entity_type: 'appointment_status',
              entity_name: 'Partially Completed',
              smart_code: APPOINTMENT_SMART_CODES.STATUS_PARTIAL
            }
          ]
        }
      ]
    },

    {
      id: 'set-initial-status',
      name: 'Set Initial Status to Scheduled',
      type: 'action',
      actions: [
        {
          type: 'create_relationship',
          from_entity_id: '${appointment_id}',
          to_entity_id: '${status_scheduled_id}',
          relationship_type: 'APPOINTMENT_HAS_STATUS',
          smart_code: APPOINTMENT_SMART_CODES.HAS_STATUS,
          is_active: true,
          effective_date: 'now'
        },
        {
          type: 'send_notification',
          channel: 'whatsapp',
          template: 'appointment_confirmation',
          recipient: '${client_id}'
        }
      ]
    },

    {
      id: 'wait-for-appointment-time',
      name: 'Wait Until Appointment Time',
      type: 'wait',
      delay: '${appointment_time}',
      timeout: {
        duration: '15m',
        before: true,
        action: 'send_reminder'
      }
    },

    {
      id: 'check-in-process',
      name: 'Client Check-In',
      type: 'user_action',
      assigned_to: 'receptionist_role',
      actions: [
        {
          type: 'create_transaction',
          transaction_type: 'APPOINTMENT.CHECKIN',
          smart_code: APPOINTMENT_SMART_CODES.CHECKIN,
          source_entity_id: '${client_id}',
          target_entity_id: '${appointment_id}',
          total_amount: 0
        },
        {
          type: 'update_status',
          new_status: APPOINTMENT_SMART_CODES.STATUS_CHECKED_IN
        }
      ],
      timeout: {
        duration: '30m',
        action: 'mark_no_show'
      }
    },

    {
      id: 'payment-authorization',
      name: 'Process Payment Authorization',
      type: 'action',
      guardrail: {
        type: 'payment_required',
        min_amount: '${service_price}',
        payment_types: ['preauth', 'deposit', 'full_payment']
      },
      actions: [
        {
          type: 'create_transaction',
          transaction_type: 'PAYMENT.PREAUTH',
          smart_code: APPOINTMENT_SMART_CODES.PAYMENT_PREAUTH,
          source_entity_id: '${client_id}',
          total_amount: '${service_price}',
          transaction_status: 'pending'
        },
        {
          type: 'process_payment',
          payment_method: 'card',
          amount: '${service_price}'
        },
        {
          type: 'create_relationship',
          from_entity_id: '${appointment_id}',
          to_entity_id: '${payment_txn_id}',
          relationship_type: 'APPOINTMENT_LINKED_TO_PAYMENT',
          smart_code: APPOINTMENT_SMART_CODES.LINKED_TO_PAYMENT
        }
      ],
      error_handler: {
        payment_declined: 'handle-payment-failure',
        payment_timeout: 'cancel-appointment'
      }
    },

    {
      id: 'start-service',
      name: 'Start Service Delivery',
      type: 'action',
      condition: 'payment_status == "approved"',
      actions: [
        {
          type: 'update_status',
          new_status: APPOINTMENT_SMART_CODES.STATUS_IN_PROGRESS
        },
        {
          type: 'create_transaction',
          transaction_type: 'SERVICE.DELIVERY',
          smart_code: APPOINTMENT_SMART_CODES.SERVICE_DELIVERY,
          source_entity_id: '${staff_id}',
          target_entity_id: '${appointment_id}'
        },
        {
          type: 'send_notification',
          staff_id: '${staff_id}',
          message: 'Client ready for service'
        }
      ]
    },

    {
      id: 'complete-service',
      name: 'Complete Service',
      type: 'user_action',
      assigned_to: '${staff_id}',
      actions: [
        {
          type: 'update_status',
          new_status: APPOINTMENT_SMART_CODES.STATUS_COMPLETED
        },
        {
          type: 'capture_payment',
          payment_txn_id: '${payment_txn_id}',
          amount: '${final_amount}'
        },
        {
          type: 'create_transaction_lines',
          transaction_id: '${service_delivery_txn_id}',
          lines: [
            {
              line_type: 'service',
              entity_id: '${service_id}',
              quantity: 1,
              unit_price: '${service_price}',
              smart_code: APPOINTMENT_SMART_CODES.SERVICE_LINE
            }
          ]
        }
      ]
    },

    {
      id: 'request-review',
      name: 'Request Client Review',
      type: 'action',
      delay: '24h',
      actions: [
        {
          type: 'update_status',
          new_status: APPOINTMENT_SMART_CODES.STATUS_REVIEW_PENDING
        },
        {
          type: 'send_notification',
          channel: 'whatsapp',
          template: 'review_request',
          recipient: '${client_id}'
        }
      ]
    },

    {
      id: 'close-appointment',
      name: 'Close Appointment',
      type: 'action',
      condition: 'review_completed OR timeout(7d)',
      actions: [
        {
          type: 'update_status',
          new_status: APPOINTMENT_SMART_CODES.STATUS_CLOSED
        },
        {
          type: 'update_entity' // Archive appointment
        }
      ]
    }
  ],

  // Exception handlers
  exception_handlers: [
    {
      id: 'client-cancellation',
      trigger: 'user_action.cancel',
      condition: 'current_status IN ["scheduled", "checked_in"]',
      actions: [
        {
          type: 'update_status',
          new_status: APPOINTMENT_SMART_CODES.STATUS_CANCELLED_CLIENT
        },
        {
          type: 'process_payment', // Process cancellation fee
          fee_percentage: 20
        },
        {
          type: 'send_notification',
          message: 'Appointment cancelled by client'
        }
      ]
    },

    {
      id: 'payment-failure',
      trigger: 'payment.declined',
      actions: [
        {
          type: 'update_status' // Block service start
        },
        {
          type: 'send_notification', // Request alternative payment
          timeout: '10m'
        }
      ]
    },

    {
      id: 'dispute-handler',
      trigger: 'client.dispute',
      condition: 'current_status == "completed"',
      actions: [
        {
          type: 'update_status',
          new_status: APPOINTMENT_SMART_CODES.STATUS_DISPUTED
        },
        {
          type: 'send_notification', // Notify manager
          priority: 'high'
        },
        {
          type: 'void_payment', // Freeze payment
          payment_txn_id: '${payment_txn_id}'
        }
      ]
    }
  ],

  // Guardrails
  guardrails: [
    {
      id: 'payment-before-service',
      description: 'Block service start without approved payment',
      condition: 'status_transition FROM "checked_in" TO "in_progress"',
      rule: 'EXISTS approved_payment LINKED_TO appointment',
      action: 'block',
      error_message: 'Cannot start service without approved payment'
    },

    {
      id: 'no-backdating',
      description: 'Prevent backdating transactions',
      condition: 'transaction_date < fiscal_period_start',
      rule: 'block_transaction',
      action: 'block',
      error_message: 'Cannot post to closed fiscal period'
    },

    {
      id: 'refund-requires-original',
      description: 'Refunds must reference original payment',
      condition: 'transaction_type == "PAYMENT.REFUND"',
      rule: 'MUST_HAVE reference_transaction_id',
      action: 'block',
      error_message: 'Refund must reference original payment transaction'
    }
  ]
}

// Helper function to execute workflow
export async function executeAppointmentWorkflow(appointmentId: string, organizationId: string) {
  // This would integrate with HERA Workflow Engine
  const workflowEngine = await import('@/lib/workflow/engine')

  return workflowEngine.execute({
    workflow: salonAppointmentWorkflow,
    context: {
      appointment_id: appointmentId,
      organization_id: organizationId,
      started_at: new Date(),
      started_by: 'system'
    }
  })
}

// Status transition helper
export async function transitionAppointmentStatus(
  appointmentId: string,
  newStatusCode: string,
  organizationId: string
) {
  // Expire current status
  await universalApi.updateRelationship({
    organization_id: organizationId,
    from_entity_id: appointmentId,
    relationship_type: 'APPOINTMENT_HAS_STATUS',
    is_active: false,
    expiration_date: new Date()
  })

  // Get status entity ID
  const statusEntity = await universalApi.getEntityBySmartCode(newStatusCode, organizationId)

  // Create new status relationship
  await universalApi.createRelationship({
    organization_id: organizationId,
    from_entity_id: appointmentId,
    to_entity_id: statusEntity.id,
    relationship_type: 'APPOINTMENT_HAS_STATUS',
    smart_code: APPOINTMENT_SMART_CODES.HAS_STATUS,
    is_active: true,
    effective_date: new Date()
  })
}
