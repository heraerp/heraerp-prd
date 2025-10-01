/**
 * HERA Salon Manager Service Contracts
 * Type definitions for salon operations
 */

export interface ISalonManagerService {
  bookAppointment(request: AppointmentRequest): Promise<AppointmentResult>
  checkInventory(productName?: string): Promise<InventoryCheckResult>
  analyzeRevenue(period: string): Promise<RevenueAnalysis>
  analyzeStaffPerformance(period: string): Promise<StaffPerformance[]>
  findAvailableSlots(date: Date, serviceName?: string): Promise<AvailableSlotsResult>
  getClientBirthdays(month: number): Promise<BirthdayListResult>
  findAppointments(query: string): Promise<AppointmentSearchResult>
  getAIInsights(context: string): Promise<AIInsightsResult>
}

export interface AppointmentRequest {
  clientId?: string
  clientName: string
  clientPhone?: string
  stylistId?: string
  stylistName: string
  serviceId?: string
  serviceName: string
  dateTime: string
  notes?: string
}

export interface AppointmentResult {
  success: boolean
  appointmentId?: string
  appointmentCode?: string
  message: string
  error?: string
}

export interface InventoryCheckResult {
  products: InventoryItem[]
  summary: {
    totalProducts: number
    totalValue: number
    lowStockItems: number
    outOfStock: number
  }
}

export interface InventoryItem {
  id: string
  name: string
  code: string
  currentStock: number
  minStock: number
  unitCost: number
  totalValue: number
  isLow: boolean
  category: string
}

export interface RevenueAnalysis {
  period: string
  startDate: Date
  endDate: Date
  totalRevenue: number
  serviceRevenue: number
  productRevenue: number
  transactionCount: number
  averageTicket: number
  topServices: { category: string; revenue: number }[]
  topProducts: { category: string; revenue: number }[]
}

export interface StaffPerformance {
  stylistId: string
  stylistName: string
  period: string
  revenue: number
  commission: number
  appointmentCount: number
  serviceCount: number
  averageTicket: number
  topServices: { service: string; count: number }[]
}

export interface ClientInfo {
  id: string
  name: string
  phone?: string
  email?: string
  lastVisit?: Date
  totalSpent?: number
  favoriteService?: string
}

export interface ServiceInfo {
  id: string
  name: string
  category: string
  price: number
  duration: number // minutes
  description?: string
}

export interface SalonTransaction {
  id: string
  type: 'appointment' | 'sale' | 'payment'
  code: string
  date: Date
  clientId?: string
  clientName?: string
  stylistId?: string
  stylistName?: string
  amount: number
  status: string
  items: TransactionItem[]
}

export interface TransactionItem {
  id: string
  type: 'service' | 'product'
  name: string
  quantity: number
  unitPrice: number
  amount: number
  commission?: number
}

export interface AvailableSlotsResult {
  date: string
  availableSlots: TimeSlot[]
  totalAvailable: number
}

export interface TimeSlot {
  time: string
  display: string
  stylistId?: string
  stylistName?: string
}

export interface BirthdayListResult {
  month: number
  monthName: string
  clients: BirthdayClient[]
  totalBirthdays: number
}

export interface BirthdayClient {
  clientId: string
  clientName: string
  birthDate: string
  dayOfMonth: number
}

export interface AppointmentSearchResult {
  success: boolean
  appointments?: AppointmentDetail[]
  totalFound: number
  message: string
  error?: string
}

export interface AppointmentDetail {
  id: string
  code: string
  date: Date
  clientName: string
  stylistName: string
  serviceName: string
  amount: number
  status: string
  duration: number
}

export interface AIInsightsResult {
  success: boolean
  insights?: {
    recommendations: AIRecommendation[]
    patterns: AIPattern[]
    predictions: AIPrediction[]
  }
  generatedAt?: Date
  error?: string
}

export interface AIRecommendation {
  type: string
  title: string
  description: string
  confidence: number
  actions?: string[]
}

export interface AIPattern {
  type: string
  description: string
  confidence: number
  data?: any
}

export interface AIPrediction {
  type: string
  description: string
  confidence: number
  projectedValue?: number
  projectedMonthEnd?: number
  timeframe?: string
}

// Smart codes for salon operations
export const SALON_SMART_CODES = {
  // Entities
  CUSTOMER: 'HERA.SALON.CUSTOMER.PROFILE.V1',
  STYLIST: 'HERA.SALON.EMPLOYEE.STYLIST.V1',
  SERVICE: 'HERA.SALON.SERVICE.CATALOG.V1',
  PRODUCT: 'HERA.SALON.PRODUCT.INVENTORY.V1',

  // Transactions
  APPOINTMENT: 'HERA.SALON.APPOINTMENT.BOOKING.V1',
  SALE: 'HERA.SALON.SALE.TRANSACTION.V1',
  PAYMENT: 'HERA.SALON.PAYMENT.RECEIVED.V1',

  // Lines
  SERVICE_LINE: 'HERA.SALON.SERVICE.LINE.V1',
  PRODUCT_LINE: 'HERA.SALON.PRODUCT.LINE.V1',

  // Dynamic fields
  PHONE: 'HERA.SALON.FIELD.PHONE.V1',
  EMAIL: 'HERA.SALON.FIELD.EMAIL.V1',
  BIRTH_DATE: 'HERA.SALON.FIELD.BIRTHDATE.V1',
  COMMISSION_RATE: 'HERA.SALON.FIELD.COMMISSION.V1',
  STOCK_LEVEL: 'HERA.SALON.FIELD.STOCK.V1'
}
