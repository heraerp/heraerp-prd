# HERA Universal Transaction Flow Documentation
## Enterprise-Grade Multi-Step Transaction Wizard

---

## 🎯 Overview

The **UniversalTransactionFlow** is a HERA DNA component that provides enterprise-grade multi-step transaction processing with full localization support. It adapts to any industry and business type through configuration rather than custom code.

### Key Features
- 🌐 **Multi-Language Support** - Built-in localization (EN, ES, AR, ZH)
- 🏭 **Industry Adaptable** - Works for salon, restaurant, healthcare, retail, etc.
- 🎯 **Smart Code Integration** - Every step tagged with business intelligence
- ✅ **Enterprise Validation** - Async validation with field-level errors
- 💾 **Draft Support** - Save and resume incomplete transactions
- 📱 **Mobile Responsive** - Touch-friendly with gesture support
- 🎨 **Theme Variants** - Default, minimal, and enterprise themes
- ⚡ **Performance** - Optimized with React 19 and animations

---

## 🚀 Quick Start

### Basic Implementation
```typescript
import { UniversalTransactionFlow } from '@/lib/dna/components/transaction/UniversalTransactionFlow'
import { salonBookingSteps } from '@/lib/dna/components/transaction/transaction-flows.config'

<UniversalTransactionFlow
  transactionType="salon-booking"
  smartCode="HERA.SALON.TXN.FLOW.BOOKING.v1"
  steps={salonBookingSteps}
  locale="en"
  industry="salon"
  onComplete={async (data) => {
    // Process completed transaction
    await universalApi.createTransaction({
      transaction_type: 'appointment',
      smart_code: 'HERA.SALON.APPT.TXN.BOOK.v1',
      metadata: data
    })
  }}
/>
```

### With All Features
```typescript
<UniversalTransactionFlow
  // Core configuration
  transactionType="restaurant-order"
  smartCode="HERA.REST.TXN.FLOW.ORDER.v1"
  steps={restaurantOrderSteps}
  
  // Localization
  locale="es"
  translations={customTranslations}
  
  // Industry configuration  
  industry="restaurant"
  businessType="fine-dining"
  currency="EUR"
  
  // Features
  allowDraft={true}
  allowSkip={false}
  showProgress={true}
  showStepNumbers={true}
  animationEnabled={true}
  autoSave={true}
  autoSaveInterval={30000}
  
  // Data and callbacks
  initialData={{ tableNumber: 5 }}
  onComplete={handleComplete}
  onStepChange={handleStepChange}
  onSaveDraft={handleSaveDraft}
  onCancel={handleCancel}
  
  // Styling
  theme="enterprise"
  className="max-w-2xl mx-auto"
/>
```

---

## 📋 Step Configuration

### Step Interface
```typescript
interface TransactionStep {
  id: string
  name: string
  description?: string
  icon?: React.ComponentType<any>
  component: React.ComponentType<TransactionStepProps>
  validation?: (data: any) => Promise<ValidationResult> | ValidationResult
  skipCondition?: (data: any) => boolean
  requiredFields?: string[]
  smartCode?: string
  localizationKey?: string
}
```

### Creating Custom Steps
```typescript
const customStep: TransactionStep = {
  id: 'payment-method',
  name: 'Payment Method',
  description: 'Choose how to pay',
  icon: CreditCard,
  component: PaymentMethodStep,
  validation: async (data) => {
    if (!data.paymentMethod) {
      return {
        valid: false,
        errors: { paymentMethod: 'Payment method is required' }
      }
    }
    
    // Check payment method validity
    const isValid = await checkPaymentMethod(data.paymentMethod)
    
    return {
      valid: isValid,
      warnings: data.amount > 1000 ? {
        amount: 'Large transaction - additional verification may be required'
      } : undefined
    }
  },
  requiredFields: ['paymentMethod'],
  smartCode: 'HERA.PAYMENT.METHOD.SELECT.v1'
}
```

### Step Component Props
```typescript
interface TransactionStepProps {
  data: Record<string, any>      // Current transaction data
  onChange: (updates: Record<string, any>) => void  // Update data
  errors: Record<string, string>  // Validation errors
  locale: string                  // Current language
  industry: string                // Business industry
  readonly?: boolean              // Disable editing
}
```

---

## 🌍 Localization

### Built-in Languages
- **English** (en) - Default
- **Spanish** (es)
- **Arabic** (ar) - With RTL support
- **Chinese** (zh)

### Translation Structure
```typescript
const translations: TranslationDictionary = {
  en: {
    buttons: {
      next: 'Next',
      back: 'Back',
      complete: 'Complete',
      saveDraft: 'Save Draft'
    },
    validation: {
      required: 'This field is required',
      invalid: 'Invalid value'
    },
    // Industry-specific
    salon: {
      service: 'Service',
      stylist: 'Stylist',
      duration: 'Duration'
    }
  },
  es: {
    buttons: {
      next: 'Siguiente',
      back: 'Atrás',
      complete: 'Completar',
      saveDraft: 'Guardar Borrador'
    }
    // ...
  }
}
```

### Adding Custom Translations
```typescript
import { mergeTranslations } from '@/lib/dna/components/transaction/transaction-flows.config'

const customTranslations = {
  fr: {
    buttons: {
      next: 'Suivant',
      back: 'Retour'
    }
  }
}

const allTranslations = mergeTranslations(defaultTranslations, customTranslations)
```

---

## 🏭 Industry Configurations

### Pre-configured Flows

#### Salon Booking
```typescript
import { salonBookingSteps } from './transaction-flows.config'

// Steps included:
// 1. Service Selection
// 2. Staff Selection  
// 3. Date & Time
// 4. Customer Info
// 5. Confirmation
```

#### Restaurant Order
```typescript
import { restaurantOrderSteps } from './transaction-flows.config'

// Steps included:
// 1. Order Type (Dine-in/Takeout/Delivery)
// 2. Menu Selection
// 3. Delivery Info (conditional)
// 4. Payment
```

#### Healthcare Appointment
```typescript
import { healthcareAppointmentSteps } from './transaction-flows.config'

// Steps included:
// 1. Visit Type
// 2. Doctor Selection
// 3. Symptoms
// 4. Insurance
```

#### Retail Purchase
```typescript
import { retailPurchaseSteps } from './transaction-flows.config'

// Steps included:
// 1. Shopping Cart
// 2. Contact Info
// 3. Shipping
// 4. Payment
```

---

## 🎨 Theming

### Theme Options
- **default** - Standard HERA design
- **minimal** - Clean, reduced visual elements
- **enterprise** - Enhanced shadows and borders

### Custom Styling
```typescript
// Component classes
<UniversalTransactionFlow
  className="custom-flow"
  theme="enterprise"
/>

// CSS
.custom-flow {
  --flow-primary: #8B5CF6;
  --flow-border-radius: 12px;
}
```

---

## 💡 Advanced Features

### Conditional Steps
Skip steps based on data:
```typescript
{
  id: 'insurance',
  skipCondition: (data) => data.paymentType === 'self-pay',
  // ...
}
```

### Auto-Save
Enable draft saving:
```typescript
<UniversalTransactionFlow
  autoSave={true}
  autoSaveInterval={30000} // 30 seconds
  onSaveDraft={async (data) => {
    await saveDraftToAPI(data)
  }}
/>
```

### Step Change Tracking
Monitor progress:
```typescript
onStepChange={(stepIndex, data) => {
  analytics.track('transaction_step', {
    step: stepIndex,
    transaction_type: 'booking',
    data_filled: Object.keys(data).length
  })
}}
```

### Validation Warnings
Non-blocking warnings:
```typescript
validation: async (data) => ({
  valid: true,
  warnings: {
    amount: data.amount > 5000 ? 'Large transaction detected' : undefined
  }
})
```

---

## 📱 Mobile Optimization

### Touch Gestures
- Swipe between steps (when enabled)
- Touch-friendly buttons (44px targets)
- Mobile-optimized layouts

### Responsive Design
- Stack navigation on mobile
- Full-width forms
- Condensed progress indicators

---

## 🔐 Security Considerations

### Data Handling
- All data stays client-side until completion
- No automatic server sync without explicit save
- Sensitive fields can be masked

### Validation Security
```typescript
validation: async (data) => {
  // Server-side validation
  const response = await validateWithServer(data)
  
  return {
    valid: response.valid,
    errors: response.errors
  }
}
```

---

## 📊 Analytics Integration

Track user behavior:
```typescript
// Completion rate
onComplete={(data) => {
  analytics.track('transaction_completed', {
    type: transactionType,
    duration: Date.now() - startTime,
    steps_completed: steps.length
  })
}}

// Abandonment
onCancel={() => {
  analytics.track('transaction_abandoned', {
    type: transactionType,
    last_step: currentStep
  })
}}
```

---

## 🚀 Performance Tips

1. **Lazy Load Steps**
   ```typescript
   const LazyStep = lazy(() => import('./steps/ComplexStep'))
   ```

2. **Memoize Validations**
   ```typescript
   const validation = useMemo(() => async (data) => {
     // Expensive validation
   }, [dependencies])
   ```

3. **Debounce Auto-Save**
   ```typescript
   const debouncedSave = useDebouncedCallback(onSaveDraft, 1000)
   ```

---

## 🧪 Testing

### Unit Testing
```typescript
import { render, fireEvent } from '@testing-library/react'

test('completes transaction flow', async () => {
  const onComplete = jest.fn()
  
  const { getByText } = render(
    <UniversalTransactionFlow
      steps={mockSteps}
      onComplete={onComplete}
    />
  )
  
  // Navigate through steps
  fireEvent.click(getByText('Next'))
  // ...
  
  fireEvent.click(getByText('Complete'))
  
  await waitFor(() => {
    expect(onComplete).toHaveBeenCalled()
  })
})
```

---

## 🐛 Troubleshooting

### Common Issues

1. **Step not rendering**
   - Check component export
   - Verify step configuration

2. **Validation not working**
   - Ensure async validation returns properly
   - Check error field names match

3. **Translation missing**
   - Verify locale key exists
   - Check translation path

---

## 🎯 Best Practices

1. **Keep Steps Focused** - One purpose per step
2. **Progressive Disclosure** - Only show needed fields
3. **Clear Validation** - Specific error messages
4. **Save Progress** - Enable drafts for long flows
5. **Test All Paths** - Including skip conditions
6. **Monitor Analytics** - Track completion rates

---

This UniversalTransactionFlow component demonstrates HERA's DNA philosophy: build once, use everywhere with configuration-driven customization rather than code duplication.