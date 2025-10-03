/**
 * Fixed Customer Preset with Proper Smart Codes
 *
 * This follows HERA DNA standards:
 * - All smart codes are UPPERCASE with .V1 suffix
 * - Minimum 6 segments
 * - Proper field configuration
 */

export const CUSTOMER_PRESET_FIXED = {
  entity_type: 'CUSTOMER',
  labels: {
    singular: 'Customer',
    plural: 'Customers'
  },
  permissions: {
    create: () => true,
    edit: (role: string) => ['owner', 'manager', 'receptionist'].includes(role),
    delete: (role: string) => ['owner', 'manager'].includes(role),
    view: () => true
  },
  dynamicFields: [
    {
      field_name: 'name',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.NAME.V1',
      required: true,
      label: 'Full Name',
      placeholder: 'e.g., Jennifer Smith'
    },
    {
      field_name: 'phone',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.PHONE.V1',
      required: true,
      label: 'Phone Number',
      placeholder: '+1 (555) 123-4567'
    },
    {
      field_name: 'email',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.EMAIL.V1',
      label: 'Email Address',
      placeholder: 'customer@example.com'
    },
    {
      field_name: 'date_of_birth',
      field_type: 'date',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.BIRTHDAY.V1',
      label: 'Date of Birth'
    },
    {
      field_name: 'address',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.ADDRESS.V1',
      label: 'Address',
      placeholder: '123 Main St, City, State ZIP'
    },
    {
      field_name: 'vip',
      field_type: 'boolean',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.VIP.V1',
      defaultValue: false,
      label: 'VIP Customer'
    },
    {
      field_name: 'customer_type',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.TYPE.V1',
      defaultValue: 'regular',
      label: 'Customer Type'
    },
    {
      field_name: 'tags',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.TAGS.V1',
      label: 'Tags',
      placeholder: 'e.g., VIP, Color Expert, Bridal'
    },
    {
      field_name: 'allergies',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.ALLERGIES.V1',
      label: 'Allergies/Sensitivities',
      placeholder: 'e.g., PPD, Ammonia, Fragrance'
    },
    {
      field_name: 'preferences',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.PREFERENCES.V1',
      label: 'Service Preferences',
      placeholder: 'e.g., Likes natural products'
    },
    {
      field_name: 'notes',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.NOTES.V1',
      label: 'Internal Notes',
      placeholder: 'Private notes about the customer'
    },
    {
      field_name: 'loyalty_points',
      field_type: 'number',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.LOYALTY.POINTS.V1',
      defaultValue: 0,
      label: 'Loyalty Points'
    },
    {
      field_name: 'lifetime_value',
      field_type: 'number',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.LIFETIME.VALUE.V1',
      defaultValue: 0,
      label: 'Lifetime Value',
      readOnly: true
    },
    {
      field_name: 'wallet_balance',
      field_type: 'number',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.WALLET.BALANCE.V1',
      defaultValue: 0,
      label: 'Wallet Balance',
      roles: ['owner', 'manager', 'accountant'] // Only visible to these roles
    },
    {
      field_name: 'visit_count',
      field_type: 'number',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.VISIT.COUNT.V1',
      defaultValue: 0,
      label: 'Total Visits',
      readOnly: true
    },
    {
      field_name: 'last_visit',
      field_type: 'date',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.LAST.VISIT.V1',
      label: 'Last Visit',
      readOnly: true
    },
    {
      field_name: 'average_ticket',
      field_type: 'number',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.AVG.TICKET.V1',
      defaultValue: 0,
      label: 'Average Ticket',
      readOnly: true
    },
    {
      field_name: 'preferred_stylist',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.PREFERRED.STYLIST.V1',
      label: 'Preferred Stylist'
    },
    {
      field_name: 'status',
      field_type: 'text',
      smart_code: 'HERA.SALON.CUSTOMER.DYN.STATUS.V1',
      defaultValue: 'active',
      label: 'Status'
    }
  ],
  relationships: [
    {
      type: 'REFERRED_BY',
      smart_code: 'HERA.SALON.CUSTOMER.REL.REFERRED.BY.V1',
      cardinality: 'one'
    },
    {
      type: 'PREFERRED_STYLIST',
      smart_code: 'HERA.SALON.CUSTOMER.REL.PREFERRED.STYLIST.V1',
      cardinality: 'one'
    },
    {
      type: 'HAS_MEMBERSHIP',
      smart_code: 'HERA.SALON.CUSTOMER.REL.HAS.MEMBERSHIP.V1',
      cardinality: 'one'
    }
  ]
}
