/**
 * HERA Salon Type Definitions
 * Comprehensive types for salon modules ensuring type safety
 */

// ===== Dashboard Types =====
export interface DashboardData {
  appointments: number
  customers: number
  todayRevenue: number
  products: number
  recentAppointments: Appointment[]
  topServices: Service[]
  staffMembers: StaffMember[]
  loading: boolean
  error: string | null
}

export interface Appointment {
  id: string
  transaction_code?: string
  transaction_date: Date
  customer_id: string
  customer_name?: string
  service_id: string
  service_name?: string
  staff_id: string
  staff_name?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'no_show' | 'cancelled'
  duration: number
  amount: number
  metadata?: {
    appointment_date?: string
    appointment_time?: string
    notes?: string
  }
}

export interface Service {
  id: string
  entity_name: string
  entity_code?: string
  price: number
  duration: number
  category: string
  metadata?: {
    description?: string
    popular?: boolean
  }
}

export interface StaffMember {
  id: string
  entity_name: string
  name?: string
  title?: string
  specialty?: string
  specialties?: string[]
  rating?: number
  available?: boolean
  experience?: number
  metadata?: {
    specialization?: string
    instagram?: string
  }
}

// ===== Organization Types =====
export interface Organization {
  id: string
  organization_code: string
  organization_name: string
  subdomain?: string
  status?: string
  created_at?: string
}

// ===== Customer Types =====
export interface CustomerMetadata {
  source?: string
  notes?: string
  [key: string]: any
}

export interface CustomerBusinessRules {
  vip?: boolean
  deposit_required?: boolean
  preferred_location_id?: string
  preferred_staff_id?: string
}

// ===== POS Types =====
export interface CartItem {
  id?: string
  product?: Product
  type?: 'service' | 'product'
  name?: string
  price?: number
  quantity: number
  unit_price?: number
  discount?: number
  discount_amount?: number
  discount_percent?: number
  discountType?: 'percentage' | 'fixed'
  staff_id?: string
  staff_name?: string
  duration?: number
  tax_amount?: number
  line_total?: number
  metadata?: {
    category?: string
    sku?: string
  }
}

export interface Payment {
  method: 'cash' | 'card' | 'wallet' | 'loyalty' | 'softpos' | 'gift_card'
  amount: number
  reference?: string
  auth_code?: string
  cardType?: string
  lastFourDigits?: string
}

export interface TransactionData {
  items: CartItem[]
  customer?: {
    id: string
    name: string
    email?: string
    phone?: string
  }
  payments: Payment[]
  subtotal: number
  discount: number
  tax: number
  total: number
  receiptNumber?: string
  transactionId?: string
}

// ===== Inventory Types =====
export interface ProductFormData {
  name: string
  category: string
  barcode: string
  sku: string
  stock_on_hand: number
  reorder_point: number
  reorder_quantity: number
  unit_cost: number
  retail_price: number
  ownership_type: 'salon' | 'booth_renter' | 'consignment'
  owner_id: string
  usage_type: 'retail' | 'professional' | 'both'
  commission_type: 'percentage' | 'fixed'
  commission_rate: number
  location_id: string
}

// ===== Payroll Types =====
export interface PayrollEmployee {
  id: string
  entity_name: string
  entity_code: string
  entity_type: 'employee'
  smart_code: string
  classification: 'employee' | 'contractor' | 'booth_renter'
  department: string
  pay_schedule: 'weekly' | 'bi-weekly' | 'semi-monthly' | 'monthly'
  compensation_type: 'hourly' | 'salary' | 'commission' | 'hybrid'
  base_rate: number
  commission_rate?: number
  ytd_earnings: number
  last_pay_date?: Date
  bank_account?: string
  tax_exemptions?: number
  status: 'active' | 'terminated' | 'on_leave'
}

// ===== Finance Types =====
export type TabType =
  | 'dashboard'
  | 'calendar'
  | 'appointments'
  | 'services'
  | 'finance'
  | 'team'
  | 'whatsapp'
export type BranchType = 'all' | 'branch1' | 'branch2'
export type PeriodType = 'month' | 'quarter' | 'ytd' | 'custom'
export type DateSelectionType = 'current' | 'prior_month' | 'prior_year' | 'custom'

// ===== Product Types =====
export interface Product {
  id: string
  entity_type: 'product' | 'service'
  entity_name: string
  entity_code?: string
  smart_code: string
  barcode?: string
  price: number
  cost?: number
  vat_rate: number
  stock_on_hand?: number
  category_id?: string
  category_name?: string
  min_price?: number
  max_discount_pct?: number
  image_url?: string
  usage_type?: 'retail' | 'professional' | 'both'
  supplier_id?: string
  brand?: string
  size?: string
  unit?: string
}

// ===== Export Report Types =====
export type ExportFormat = 'pdf' | 'csv'

// ===== Error Response Type =====
export interface ApiError {
  message: string
  code?: string
  details?: any
}

// ===== Customer Types (Extended) =====
export interface Customer {
  id: string
  entity_type: 'customer'
  entity_name: string
  entity_code?: string
  smart_code: string
  status: 'active' | 'inactive' | 'blacklisted'
  created_at: string
  updated_at: string
  business_rules?: CustomerBusinessRules
  metadata?: CustomerMetadata
  // Dynamic data fields
  email?: string
  phone?: string
  whatsapp?: string
  address?: string
  dob?: string
  gender?: string
  hair_type?: string
  skin_type?: string
  color_formula?: string
  marketing_consent?: boolean
  sms_consent?: boolean
  whatsapp_consent?: boolean
  preferred_staff?: string
  preferred_location?: string
  tags?: string[]
  // Computed fields
  last_visit?: Date
  next_appointment?: Date
  lifetime_value?: number
  loyalty_points?: number
  loyalty_tier?: string
  loyalty_balance?: number
  membership_status?: 'active' | 'expired' | 'none'
  membership_name?: string
  gift_card_balance?: number
  deposit_balance?: number
  no_show_count?: number
  visit_count?: number
  average_ticket?: number
  referral_count?: number
}

// ===== POS Config Types =====
export interface POSConfig {
  rounding_mode: 'none' | 'nearest_5' | 'nearest_10'
  receipt_options: {
    show_tax_details: boolean
    show_item_codes: boolean
    footer_text: string
    header_logo?: string
  }
  tips_enabled: boolean
  split_payment_enabled: boolean
  offline_queue_enabled: boolean
  vat_rate: number
  currency: string
}

// ===== Register Types =====
export interface Register {
  id: string
  entity_name: string
  location_id: string
  location_name: string
  status: 'open' | 'closed'
  current_shift_id?: string
  float_amount?: number
}
