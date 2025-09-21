// ================================================================================
// HERA DNA TRANSACTION FLOW CONFIGURATIONS
// Industry-specific transaction flow patterns with localization
// ================================================================================

import {
  Users,
  Calendar,
  Scissors,
  CreditCard,
  Package,
  FileText,
  ShoppingCart,
  UtensilsCrossed,
  Heart,
  Truck,
  Calculator,
  Gift,
  Clock,
  MapPin,
  Phone,
  Mail,
  Star,
  AlertCircle,
  CheckCircle,
  Shield
} from 'lucide-react'
import type { TransactionStep, TranslationDictionary } from './UniversalTransactionFlow'

// ================================================================================
// SALON TRANSACTION FLOWS
// ================================================================================

export const salonBookingSteps: TransactionStep[] = [
  {
    id: 'service-selection',
    name: 'Select Services',
    description: 'Choose services for your appointment',
    icon: Scissors,
    component: null, // Would be actual component
    validation: async data => {
      if (!data.services || data.services.length === 0) {
        return {
          valid: false,
          errors: { services: 'Please select at least one service' }
        }
      }
      return { valid: true }
    },
    requiredFields: ['services'],
    smartCode: 'HERA.SALON.BOOKING.SERVICE.SELECT.V1'
  },
  {
    id: 'staff-selection',
    name: 'Choose Staff',
    description: 'Select your preferred stylist',
    icon: Users,
    component: null,
    validation: async data => {
      if (!data.staffId) {
        return {
          valid: false,
          errors: { staffId: 'Please select a staff member' }
        }
      }
      return { valid: true }
    },
    requiredFields: ['staffId'],
    smartCode: 'HERA.SALON.BOOKING.STAFF.SELECT.V1'
  },
  {
    id: 'datetime-selection',
    name: 'Date & Time',
    description: 'Choose your appointment slot',
    icon: Calendar,
    component: null,
    validation: async data => {
      if (!data.date || !data.time) {
        return {
          valid: false,
          errors: {
            date: !data.date ? 'Please select a date' : undefined,
            time: !data.time ? 'Please select a time' : undefined
          }
        }
      }
      // Check if slot is still available
      const slotAvailable = true // Would check actual availability
      if (!slotAvailable) {
        return {
          valid: false,
          errors: { time: 'This slot is no longer available' }
        }
      }
      return { valid: true }
    },
    requiredFields: ['date', 'time'],
    smartCode: 'HERA.SALON.BOOKING.DATETIME.SELECT.V1'
  },
  {
    id: 'customer-info',
    name: 'Your Information',
    description: 'Provide your contact details',
    icon: Phone,
    component: null,
    validation: async data => {
      const errors: Record<string, string> = {}

      if (!data.customerName) errors.customerName = 'Name is required'
      if (!data.customerPhone) errors.customerPhone = 'Phone is required'
      if (!data.customerEmail) errors.customerEmail = 'Email is required'

      // Validate phone format
      if (data.customerPhone && !/^\+?[\d\s-()]+$/.test(data.customerPhone)) {
        errors.customerPhone = 'Invalid phone number'
      }

      // Validate email format
      if (data.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.customerEmail)) {
        errors.customerEmail = 'Invalid email address'
      }

      return {
        valid: Object.keys(errors).length === 0,
        errors
      }
    },
    requiredFields: ['customerName', 'customerPhone', 'customerEmail'],
    smartCode: 'HERA.SALON.BOOKING.CUSTOMER.INFO.V1'
  },
  {
    id: 'confirmation',
    name: 'Confirm Booking',
    description: 'Review and confirm your appointment',
    icon: CheckCircle,
    component: null,
    smartCode: 'HERA.SALON.BOOKING.CONFIRM.v1'
  }
]

// ================================================================================
// RESTAURANT TRANSACTION FLOWS
// ================================================================================

export const restaurantOrderSteps: TransactionStep[] = [
  {
    id: 'order-type',
    name: 'Order Type',
    description: 'How would you like to receive your order?',
    icon: UtensilsCrossed,
    component: null,
    validation: async data => {
      if (!data.orderType) {
        return {
          valid: false,
          errors: { orderType: 'Please select order type' }
        }
      }
      return { valid: true }
    },
    requiredFields: ['orderType'],
    smartCode: 'HERA.REST.ORDER.TYPE.SELECT.V1'
  },
  {
    id: 'menu-items',
    name: 'Menu Selection',
    description: 'Choose items from our menu',
    icon: ShoppingCart,
    component: null,
    validation: async data => {
      if (!data.items || data.items.length === 0) {
        return {
          valid: false,
          errors: { items: 'Please add at least one item' }
        }
      }
      return { valid: true }
    },
    requiredFields: ['items'],
    smartCode: 'HERA.REST.ORDER.MENU.SELECT.V1'
  },
  {
    id: 'delivery-info',
    name: 'Delivery Details',
    description: 'Where should we deliver?',
    icon: MapPin,
    component: null,
    skipCondition: data => data.orderType !== 'delivery',
    validation: async data => {
      const errors: Record<string, string> = {}

      if (!data.deliveryAddress) errors.deliveryAddress = 'Address is required'
      if (!data.deliveryPhone) errors.deliveryPhone = 'Phone is required'

      return {
        valid: Object.keys(errors).length === 0,
        errors
      }
    },
    requiredFields: ['deliveryAddress', 'deliveryPhone'],
    smartCode: 'HERA.REST.ORDER.DELIVERY.INFO.V1'
  },
  {
    id: 'payment',
    name: 'Payment',
    description: 'Complete your payment',
    icon: CreditCard,
    component: null,
    validation: async data => {
      if (!data.paymentMethod) {
        return {
          valid: false,
          errors: { paymentMethod: 'Please select payment method' }
        }
      }
      return { valid: true }
    },
    requiredFields: ['paymentMethod'],
    smartCode: 'HERA.REST.ORDER.PAYMENT.v1'
  }
]

// ================================================================================
// HEALTHCARE TRANSACTION FLOWS
// ================================================================================

export const healthcareAppointmentSteps: TransactionStep[] = [
  {
    id: 'appointment-type',
    name: 'Visit Type',
    description: 'What type of appointment do you need?',
    icon: Heart,
    component: null,
    validation: async data => {
      if (!data.appointmentType) {
        return {
          valid: false,
          errors: { appointmentType: 'Please select appointment type' }
        }
      }
      return { valid: true }
    },
    requiredFields: ['appointmentType'],
    smartCode: 'HERA.HLTH.APPT.TYPE.SELECT.V1'
  },
  {
    id: 'doctor-selection',
    name: 'Choose Doctor',
    description: 'Select your preferred physician',
    icon: Users,
    component: null,
    skipCondition: data => data.appointmentType === 'emergency',
    validation: async data => {
      if (!data.doctorId) {
        return {
          valid: false,
          errors: { doctorId: 'Please select a doctor' }
        }
      }
      return { valid: true }
    },
    requiredFields: ['doctorId'],
    smartCode: 'HERA.HLTH.APPT.DOCTOR.SELECT.V1'
  },
  {
    id: 'symptoms',
    name: 'Describe Symptoms',
    description: 'Tell us about your health concern',
    icon: FileText,
    component: null,
    validation: async data => {
      if (!data.symptoms || data.symptoms.length < 10) {
        return {
          valid: false,
          errors: { symptoms: 'Please describe your symptoms (min 10 characters)' }
        }
      }
      return { valid: true }
    },
    requiredFields: ['symptoms'],
    smartCode: 'HERA.HLTH.APPT.SYMPTOMS.v1'
  },
  {
    id: 'insurance',
    name: 'Insurance Information',
    description: 'Provide your insurance details',
    icon: Shield,
    component: null,
    validation: async data => {
      if (!data.hasInsurance) {
        return { valid: true } // Self-pay is OK
      }

      const errors: Record<string, string> = {}
      if (!data.insuranceProvider) errors.insuranceProvider = 'Provider is required'
      if (!data.insuranceNumber) errors.insuranceNumber = 'Policy number is required'

      return {
        valid: Object.keys(errors).length === 0,
        errors
      }
    },
    smartCode: 'HERA.HLTH.APPT.INSURANCE.v1'
  }
]

// ================================================================================
// RETAIL TRANSACTION FLOWS
// ================================================================================

export const retailPurchaseSteps: TransactionStep[] = [
  {
    id: 'shopping-cart',
    name: 'Shopping Cart',
    description: 'Review items in your cart',
    icon: ShoppingCart,
    component: null,
    validation: async data => {
      if (!data.cartItems || data.cartItems.length === 0) {
        return {
          valid: false,
          errors: { cartItems: 'Your cart is empty' }
        }
      }

      // Check stock availability
      const outOfStock = data.cartItems.filter(item => item.quantity > item.stock)
      if (outOfStock.length > 0) {
        return {
          valid: false,
          errors: {
            stock: `${outOfStock.length} items are out of stock`
          }
        }
      }

      return { valid: true }
    },
    requiredFields: ['cartItems'],
    smartCode: 'HERA.RETAIL.PURCHASE.CART.v1'
  },
  {
    id: 'customer-info',
    name: 'Contact Information',
    description: 'How can we reach you?',
    icon: Mail,
    component: null,
    validation: async data => {
      const errors: Record<string, string> = {}

      if (!data.email) errors.email = 'Email is required'
      if (!data.phone) errors.phone = 'Phone is required'

      return {
        valid: Object.keys(errors).length === 0,
        errors
      }
    },
    requiredFields: ['email', 'phone'],
    smartCode: 'HERA.RETAIL.PURCHASE.CONTACT.v1'
  },
  {
    id: 'shipping',
    name: 'Shipping',
    description: 'Where should we send your order?',
    icon: Truck,
    component: null,
    validation: async data => {
      const errors: Record<string, string> = {}

      if (!data.shippingAddress) errors.shippingAddress = 'Address is required'
      if (!data.shippingCity) errors.shippingCity = 'City is required'
      if (!data.shippingPostal) errors.shippingPostal = 'Postal code is required'

      return {
        valid: Object.keys(errors).length === 0,
        errors
      }
    },
    requiredFields: ['shippingAddress', 'shippingCity', 'shippingPostal'],
    smartCode: 'HERA.RETAIL.PURCHASE.SHIPPING.v1'
  },
  {
    id: 'payment',
    name: 'Payment',
    description: 'Secure payment processing',
    icon: CreditCard,
    component: null,
    validation: async data => {
      if (!data.paymentMethod) {
        return {
          valid: false,
          errors: { paymentMethod: 'Please select payment method' }
        }
      }

      if (data.paymentMethod === 'card' && !data.cardToken) {
        return {
          valid: false,
          errors: { cardToken: 'Please enter card details' }
        }
      }

      return { valid: true }
    },
    requiredFields: ['paymentMethod'],
    smartCode: 'HERA.RETAIL.PURCHASE.PAYMENT.v1'
  }
]

// ================================================================================
// ADDITIONAL TRANSLATIONS
// ================================================================================

export const industryTranslations: TranslationDictionary = {
  en: {
    salon: {
      service: 'Service',
      stylist: 'Stylist',
      duration: 'Duration',
      appointment: 'Appointment',
      bookingConfirmed: 'Booking Confirmed',
      reminderSent: 'Reminder will be sent'
    },
    restaurant: {
      orderType: 'Order Type',
      dineIn: 'Dine In',
      takeout: 'Takeout',
      delivery: 'Delivery',
      items: 'Items',
      total: 'Total',
      estimatedTime: 'Estimated Time',
      orderPlaced: 'Order Placed'
    },
    healthcare: {
      visitType: 'Visit Type',
      consultation: 'Consultation',
      followUp: 'Follow Up',
      emergency: 'Emergency',
      symptoms: 'Symptoms',
      insurance: 'Insurance',
      copay: 'Copay',
      appointmentScheduled: 'Appointment Scheduled'
    },
    retail: {
      cart: 'Shopping Cart',
      quantity: 'Quantity',
      price: 'Price',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      tax: 'Tax',
      orderNumber: 'Order Number',
      trackingNumber: 'Tracking Number'
    }
  },
  es: {
    salon: {
      service: 'Servicio',
      stylist: 'Estilista',
      duration: 'Duración',
      appointment: 'Cita',
      bookingConfirmed: 'Reserva Confirmada',
      reminderSent: 'Se enviará recordatorio'
    },
    restaurant: {
      orderType: 'Tipo de Orden',
      dineIn: 'Comer Aquí',
      takeout: 'Para Llevar',
      delivery: 'Entrega',
      items: 'Artículos',
      total: 'Total',
      estimatedTime: 'Tiempo Estimado',
      orderPlaced: 'Orden Realizada'
    },
    healthcare: {
      visitType: 'Tipo de Visita',
      consultation: 'Consulta',
      followUp: 'Seguimiento',
      emergency: 'Emergencia',
      symptoms: 'Síntomas',
      insurance: 'Seguro',
      copay: 'Copago',
      appointmentScheduled: 'Cita Programada'
    },
    retail: {
      cart: 'Carrito',
      quantity: 'Cantidad',
      price: 'Precio',
      subtotal: 'Subtotal',
      shipping: 'Envío',
      tax: 'Impuesto',
      orderNumber: 'Número de Orden',
      trackingNumber: 'Número de Seguimiento'
    }
  },
  ar: {
    salon: {
      service: 'الخدمة',
      stylist: 'المصمم',
      duration: 'المدة',
      appointment: 'الموعد',
      bookingConfirmed: 'تم تأكيد الحجز',
      reminderSent: 'سيتم إرسال تذكير'
    },
    restaurant: {
      orderType: 'نوع الطلب',
      dineIn: 'تناول الطعام',
      takeout: 'طلب خارجي',
      delivery: 'توصيل',
      items: 'العناصر',
      total: 'المجموع',
      estimatedTime: 'الوقت المقدر',
      orderPlaced: 'تم تقديم الطلب'
    },
    healthcare: {
      visitType: 'نوع الزيارة',
      consultation: 'استشارة',
      followUp: 'متابعة',
      emergency: 'طوارئ',
      symptoms: 'الأعراض',
      insurance: 'التأمين',
      copay: 'المشاركة',
      appointmentScheduled: 'تم جدولة الموعد'
    },
    retail: {
      cart: 'سلة التسوق',
      quantity: 'الكمية',
      price: 'السعر',
      subtotal: 'المجموع الفرعي',
      shipping: 'الشحن',
      tax: 'الضريبة',
      orderNumber: 'رقم الطلب',
      trackingNumber: 'رقم التتبع'
    }
  }
}

// ================================================================================
// TRANSACTION FLOW REGISTRY
// ================================================================================

export const transactionFlowRegistry = {
  // Salon flows
  'salon.booking': {
    steps: salonBookingSteps,
    smartCode: 'HERA.SALON.TXN.FLOW.BOOKING.V1',
    name: 'Salon Appointment Booking',
    icon: Scissors
  },
  'salon.walkin': {
    steps: salonBookingSteps.filter(s => s.id !== 'datetime-selection'),
    smartCode: 'HERA.SALON.TXN.FLOW.WALKIN.V1',
    name: 'Walk-in Service',
    icon: Clock
  },

  // Restaurant flows
  'restaurant.order': {
    steps: restaurantOrderSteps,
    smartCode: 'HERA.REST.TXN.FLOW.ORDER.V1',
    name: 'Restaurant Order',
    icon: UtensilsCrossed
  },
  'restaurant.reservation': {
    steps: [], // Different steps for reservation
    smartCode: 'HERA.REST.TXN.FLOW.RESERVATION.V1',
    name: 'Table Reservation',
    icon: Calendar
  },

  // Healthcare flows
  'healthcare.appointment': {
    steps: healthcareAppointmentSteps,
    smartCode: 'HERA.HLTH.TXN.FLOW.APPOINTMENT.V1',
    name: 'Medical Appointment',
    icon: Heart
  },
  'healthcare.prescription': {
    steps: [], // Different steps for prescription
    smartCode: 'HERA.HLTH.TXN.FLOW.PRESCRIPTION.V1',
    name: 'Prescription Refill',
    icon: FileText
  },

  // Retail flows
  'retail.purchase': {
    steps: retailPurchaseSteps,
    smartCode: 'HERA.RETAIL.TXN.FLOW.PURCHASE.V1',
    name: 'Retail Purchase',
    icon: ShoppingCart
  },
  'retail.return': {
    steps: [], // Different steps for returns
    smartCode: 'HERA.RETAIL.TXN.FLOW.RETURN.V1',
    name: 'Product Return',
    icon: Package
  }
}

// Helper function to get flow configuration
export function getTransactionFlow(flowKey: string) {
  return transactionFlowRegistry[flowKey]
}

// Helper function to merge translations
export function mergeTranslations(
  base: TranslationDictionary,
  industry: TranslationDictionary
): TranslationDictionary {
  const merged = { ...base }

  Object.keys(industry).forEach(locale => {
    if (!merged[locale]) {
      merged[locale] = industry[locale]
    } else {
      merged[locale] = {
        ...merged[locale],
        ...industry[locale]
      }
    }
  })

  return merged
}
