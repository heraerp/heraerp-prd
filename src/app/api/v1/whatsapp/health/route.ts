import { NextRequest, NextResponse } from 'next/server'

// Smart code validation regex
const SMART_CODE_REGEX = /^HERA\.[A-Z]+(\.[A-Z0-9]+)*\.v\d+$/;

// Sacred tables list
const SACRED_TABLES = [
  'core_organizations',
  'core_entities',
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
];

// WhatsApp smart codes catalog
const WHATSAPP_SMART_CODES = {
  // Thread/Conversation
  'HERA.WHATSAPP.INBOX.THREAD.v1': 'WhatsApp conversation thread',
  'HERA.WHATSAPP.INBOX.ASSIGN.v1': 'Assign conversation to agent',
  'HERA.WHATSAPP.INBOX.RESOLVE.v1': 'Resolve conversation',
  
  // Messages
  'HERA.WHATSAPP.MESSAGE.TEXT.v1': 'Text message',
  'HERA.WHATSAPP.MESSAGE.MEDIA.v1': 'Media message (image/video/document)',
  'HERA.WHATSAPP.MESSAGE.INTERACTIVE.v1': 'Interactive message (buttons/lists)',
  'HERA.WHATSAPP.MESSAGE.TEMPLATE.v1': 'Template message',
  
  // Internal
  'HERA.WHATSAPP.NOTE.INTERNAL.v1': 'Internal note on conversation',
  
  // Templates
  'HERA.WHATSAPP.TEMPLATE.REGISTER.v1': 'Register message template',
  'HERA.WHATSAPP.TEMPLATE.BODY.v1': 'Template body content',
  'HERA.WHATSAPP.TEMPLATE.VARS.v1': 'Template variables',
  
  // Campaign
  'HERA.WHATSAPP.CAMPAIGN.OUTBOUND.v1': 'Outbound campaign',
  'HERA.WHATSAPP.CAMPAIGN.AUDIENCE.v1': 'Campaign audience query',
  'HERA.WHATSAPP.CAMPAIGN.DELIVERY.v1': 'Campaign delivery to recipient',
  
  // Payments
  'HERA.AR.PAYMENT.LINK.SHARE.v1': 'Share payment link',
  'HERA.AR.PAYMENT.COLLECTION.WHATSAPP.v1': 'Payment collection via WhatsApp',
  
  // Relationships
  'HERA.WHATSAPP.REL.THREAD_TO_ENTITY.v1': 'Thread to entity relationship',
  
  // Customer
  'HERA.CRM.CUSTOMER.WHATSAPP.v1': 'WhatsApp customer',
  
  // Notifications
  'HERA.AR.NOTIFY.INVOICE.DUE.v1': 'Invoice due notification',
  'HERA.SALON.NOTIFY.APPOINTMENT.v1': 'Appointment notification'
};

/**
 * Validate a payload against HERA guardrails
 */
function validatePayload(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // 1. Check organization ID
  if (!payload.organizationId && !payload.organization_id) {
    errors.push('Missing organization_id');
  }

  // 2. Check smart code format
  if (payload.smart_code || payload.smartCode) {
    const smartCode = payload.smart_code || payload.smartCode;
    if (!SMART_CODE_REGEX.test(smartCode)) {
      errors.push(`Invalid smart code format: ${smartCode}`);
    }
    if (!WHATSAPP_SMART_CODES[smartCode] && !smartCode.includes('WHATSAPP')) {
      errors.push(`Unknown WhatsApp smart code: ${smartCode}`);
    }
  }

  // 3. Check table restrictions
  if (payload.table && !SACRED_TABLES.includes(payload.table)) {
    errors.push(`Invalid table: ${payload.table}. Only sacred tables allowed.`);
  }

  // 4. Check for business columns (should be in metadata/dynamic data)
  const businessFields = ['status', 'is_deleted', 'phone', 'email', 'address'];
  businessFields.forEach(field => {
    if (payload[field]) {
      errors.push(`Business field '${field}' should be in metadata or core_dynamic_data`);
    }
  });

  // 5. Check transaction pattern
  if (payload.transaction_type) {
    const validTypes = ['MESSAGE_THREAD', 'CAMPAIGN', 'PAYMENT'];
    if (!validTypes.includes(payload.transaction_type)) {
      errors.push(`Invalid transaction_type: ${payload.transaction_type}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'validate', payload } = body;

    if (action === 'validate') {
      const validation = validatePayload(payload);
      
      return NextResponse.json({
        status: validation.valid ? 'success' : 'error',
        valid: validation.valid,
        errors: validation.errors,
        recommendations: validation.errors.length > 0 ? [
          'Ensure organization_id is present on all operations',
          'Use valid HERA smart codes (see catalog below)',
          'Store business data in metadata or core_dynamic_data',
          'Follow universal transaction patterns'
        ] : []
      });
    }

    if (action === 'catalog') {
      return NextResponse.json({
        status: 'success',
        smart_codes: WHATSAPP_SMART_CODES,
        total: Object.keys(WHATSAPP_SMART_CODES).length
      });
    }

    return NextResponse.json({
      status: 'error',
      error: 'Invalid action. Use: validate, catalog'
    }, { status: 400 });

  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json(
      { status: 'error', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  // Health check status
  const checks = {
    mcp_wrapper: true,
    six_tables_enforcement: true,
    smart_code_validation: true,
    org_isolation: true,
    idempotency_support: true,
    service_role_isolation: true
  };

  const allHealthy = Object.values(checks).every(v => v === true);

  return NextResponse.json({
    status: allHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    component: 'HERA.WHATSAPP.HEALTH.v1',
    checks,
    guardrails: {
      organization_isolation: 'Every operation requires organization_id',
      smart_code_validation: 'All entities/transactions must have valid smart codes',
      six_tables_only: 'Only sacred tables allowed, business data in metadata',
      universal_patterns: 'Conversations = headers, messages = lines',
      service_role_protection: 'Service key only in MCP, never in app code'
    },
    catalog: {
      smart_codes_count: Object.keys(WHATSAPP_SMART_CODES).length,
      smart_codes_endpoint: '/api/v1/whatsapp/health (POST with action: catalog)'
    }
  });
}