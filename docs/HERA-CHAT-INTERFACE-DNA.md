# HERA Chat Interface DNA Component

## Overview

The HERA Chat Interface DNA is a production-ready, enterprise-grade chat component that provides a complete AI-powered conversational interface with dark/light theme support, auto-scrolling, metrics dashboards, and quick actions. Built with all the lessons learned from our Ice Cream Manager implementation, this component can be deployed in seconds for any business domain.

## 🚀 Quick Start

```tsx
import { HeraChatInterface } from '@/lib/dna/components/chat-interface-dna'
import { Sparkles } from 'lucide-react'

export function MyChat() {
  return (
    <HeraChatInterface
      title="My Business Chat"
      subtitle="AI-Powered Assistant"
      apiEndpoint="/api/v1/my-business/chat"
      organizationId="your-org-id"
    />
  )
}
```

## 🎯 Key Features

### 1. **Dark/Light Theme Support**
- Smooth theme transitions
- Proper contrast in both modes
- Conditional gradient colors for metrics
- Deep Blue user message bubbles

### 2. **Intelligent Auto-Scroll**
- Automatically scrolls to bottom for new messages
- Detects when user is manually scrolling
- Shows scroll-to-bottom button when needed
- WhatsApp-style fixed input layout

### 3. **Current Question Header**
- Shows the user's question at top during AI processing
- Provides context during long responses
- Animated loading indicator

### 4. **Sidebar Components**
- Quick Actions with gradient icons
- Today's Metrics dashboard
- Chat History (optional)
- Responsive collapse on mobile

### 5. **Enterprise Features**
- Multi-tab support (Chat, Production, Analytics)
- Message actions and buttons
- Confidence indicators
- Error handling
- Example prompts

## 📋 Complete Props Reference

```typescript
interface HeraChatInterfaceProps {
  // Required props
  title: string                    // Main title of the chat interface
  subtitle: string                 // Subtitle or description
  apiEndpoint: string             // API endpoint for chat messages
  organizationId: string          // Organization ID for multi-tenancy
  
  // Optional customization
  icon?: React.ComponentType      // Icon component (from lucide-react)
  iconGradient?: string          // Gradient classes for icon background
  quickActions?: QuickAction[]    // Array of quick action buttons
  quickMetrics?: QuickMetric[]    // Array of metric cards
  examplePrompts?: string[]       // Example prompts shown initially
  welcomeMessage?: string         // Custom welcome message
  placeholder?: string            // Input placeholder text
  
  // Feature flags
  enableHistory?: boolean         // Enable chat history sidebar
  enableAnalytics?: boolean       // Enable analytics tab
  enableProduction?: boolean      // Enable production tab
  enableDarkMode?: boolean        // Allow theme switching
  defaultDarkMode?: boolean       // Initial theme state
  
  // Colors
  userMessageColorDark?: string   // Gradient for user messages (dark)
  userMessageColorLight?: string  // Gradient for user messages (light)
  
  // Callbacks
  onMessageSent?: (message: string) => void
  onActionClicked?: (action: ActionButton) => void
}
```

## 🎨 Customization Examples

### Ice Cream Business
```tsx
<HeraChatInterface
  title="HERA Ice Cream Manager"
  subtitle="AI-Powered Ice Cream Business Management"
  apiEndpoint="/api/v1/icecream-manager/chat"
  organizationId="ice-cream-org-id"
  
  icon={IceCream}
  iconGradient="from-blue-600 to-cyan-400"
  
  quickActions={[
    {
      icon: TruckIcon,
      label: 'Optimize Routes',
      description: 'Plan delivery routes',
      prompt: 'Optimize delivery routes for today',
      color: 'from-blue-600 to-cyan-400'
    }
  ]}
  
  quickMetrics={[
    {
      icon: Thermometer,
      label: 'Cold Chain',
      value: '✓ Compliant',
      trend: 100,
      color: 'from-blue-600 to-cyan-400'
    }
  ]}
/>
```

### Salon Business
```tsx
<HeraChatInterface
  title="HERA Salon Manager"
  subtitle="AI-Powered Salon Operations"
  apiEndpoint="/api/v1/salon-manager/chat"
  organizationId="salon-org-id"
  
  icon={Sparkles}
  iconGradient="from-purple-600 to-pink-400"
  defaultDarkMode={false} // Start in light mode
/>
```

### Healthcare
```tsx
<HeraChatInterface
  title="HERA Health Assistant"
  subtitle="Patient Care Management"
  apiEndpoint="/api/v1/healthcare/chat"
  organizationId="clinic-org-id"
  
  icon={Activity}
  iconGradient="from-red-600 to-pink-400"
  
  quickActions={[
    {
      icon: Calendar,
      label: 'Appointments',
      description: 'Patient scheduling',
      prompt: 'Show today\'s appointments',
      color: 'from-blue-600 to-cyan-400'
    }
  ]}
/>
```

## 🔧 API Integration

The component expects your API endpoint to accept POST requests with this format:

### Request
```json
{
  "message": "User's message",
  "organizationId": "org-id",
  "context": {
    "mode": "chat" // or "production" or "analytics"
  }
}
```

### Response
```json
{
  "message": "AI response text",
  "data": {}, // Optional data object
  "status": "success",
  "confidence": 90,
  "actions": [
    {
      "label": "View Details",
      "action": "view",
      "variant": "outline",
      "data": { "id": "123" }
    }
  ],
  "analyticalFramework": {
    "stage": "target"
  }
}
```

## 🎯 Advanced Usage

### Dynamic Configuration
```tsx
const businessConfigs = {
  restaurant: {
    icon: DollarSign,
    iconGradient: 'from-green-600 to-emerald-400',
    quickActions: [...restaurantActions]
  },
  retail: {
    icon: ShoppingBag,
    iconGradient: 'from-purple-600 to-pink-400',
    quickActions: [...retailActions]
  }
}

const selectedBusiness = 'restaurant'

<HeraChatInterface
  title={`HERA ${selectedBusiness} Manager`}
  subtitle="AI-Powered Operations"
  apiEndpoint={`/api/v1/${selectedBusiness}/chat`}
  organizationId={orgId}
  {...businessConfigs[selectedBusiness]}
/>
```

### Custom Event Handlers
```tsx
<HeraChatInterface
  title="Enterprise Chat"
  subtitle="Business Intelligence"
  apiEndpoint="/api/v1/enterprise/chat"
  organizationId={orgId}
  
  onMessageSent={(message) => {
    // Track analytics
    analytics.track('chat_message_sent', {
      message,
      timestamp: new Date()
    })
  }}
  
  onActionClicked={(action) => {
    switch(action.action) {
      case 'export':
        exportData(action.data)
        break
      case 'schedule':
        openCalendar(action.data)
        break
    }
  }}
/>
```

## 🌈 Gradient Color Options

The component supports these gradient combinations:

- `from-blue-600 to-cyan-400` - Ice/Water theme
- `from-purple-600 to-pink-400` - Salon/Beauty theme
- `from-green-600 to-emerald-400` - Finance/Success theme
- `from-orange-600 to-amber-400` - Energy/Warning theme
- `from-red-600 to-pink-400` - Healthcare/Alert theme
- `from-indigo-600 to-purple-400` - Enterprise/Professional theme

In light mode, these automatically convert to lighter variants (e.g., `from-blue-100 to-cyan-100`).

## 💡 Best Practices

1. **Always provide organizationId** for multi-tenant isolation
2. **Use descriptive quick actions** that match your business domain
3. **Keep metrics relevant** and update them in real-time if possible
4. **Customize the welcome message** to explain capabilities
5. **Use appropriate icons** from lucide-react for visual consistency
6. **Test both themes** to ensure proper contrast
7. **Handle errors gracefully** in your API responses

## 🚀 Performance Tips

1. **Lazy load the component** if not immediately visible
2. **Implement message pagination** for chat history
3. **Use WebSocket** for real-time updates if needed
4. **Cache API responses** where appropriate
5. **Optimize images** in message content

## 🧬 DNA Advantages

Using this HERA DNA component provides:

- **30-second deployment** vs hours of custom development
- **Proven UX patterns** tested across multiple implementations
- **Automatic theme support** without additional CSS
- **Mobile responsiveness** built-in
- **Accessibility features** included by default
- **Future updates** automatically when DNA evolves

## 📦 Installation

The component is already included in your HERA installation at:
```
/src/lib/dna/components/chat-interface-dna.tsx
```

Simply import and use it in any page or component.

## 🔄 Migration from Custom Chat

If you have an existing chat interface, migrate by:

1. Import the DNA component
2. Map your existing props to the DNA interface
3. Move custom logic to event handlers
4. Remove old chat code
5. Enjoy reduced maintenance burden!

---

*This HERA DNA component encapsulates weeks of development into a reusable, production-ready solution that can be deployed instantly for any business domain.*