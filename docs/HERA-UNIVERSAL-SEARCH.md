# HERA Universal Search Documentation
## AI-Powered Global Search with Command Palette

---

## 🎯 Overview

The **UniversalSearch** component provides an enterprise-grade global search experience with AI-powered suggestions, voice search, and command palette interface. It enables users to quickly find and navigate to any entity, transaction, report, or action across the entire HERA system.

### Key Features
- 🔍 **Fuzzy Search** - Intelligent matching across all data types
- 🤖 **AI Suggestions** - Smart query understanding and recommendations
- 🎙️ **Voice Search** - Hands-free search with speech recognition
- ⌘ **Command Palette** - Quick access with Cmd/Ctrl+K shortcut
- 📱 **Mobile Optimized** - Touch-friendly with responsive design
- 🏷️ **Smart Code Integration** - Every result tagged with business context
- ⚡ **Real-time Results** - Instant search with debouncing
- 🕐 **Recent & Popular** - Quick access to frequently used items

---

## 🚀 Quick Start

### Basic Implementation
```typescript
import { UniversalSearch } from '@/lib/dna/components/search/UniversalSearch'

<UniversalSearch
  placeholder="Search anything..."
  onSelect={(result) => {
    // Handle selection
    if (result.url) {
      router.push(result.url)
    } else if (result.action) {
      result.action()
    }
  }}
/>
```

### With Full Configuration
```typescript
<UniversalSearch
  // Core configuration
  placeholder="Search customers, orders, reports... (⌘K)"
  scopes={[
    { id: 'entities', label: 'Entities', icon: Database, enabled: true },
    { id: 'transactions', label: 'Transactions', icon: CreditCard, enabled: true },
    { id: 'reports', label: 'Reports', icon: FileText, enabled: true }
  ]}
  
  // Features
  aiSuggestions={true}
  recentSearches={true}
  popularSearches={true}
  voiceSearch={true}
  commandPalette={true}
  
  // Data source
  searchEndpoint="/api/v1/search"
  staticResults={fallbackData}
  
  // Behavior
  debounceMs={300}
  maxResults={20}
  minQueryLength={2}
  
  // Callbacks
  onSelect={handleSelect}
  onSearch={handleSearch}
  
  // Styling
  theme="command"
  position="center"
/>
```

---

## 📋 Configuration

### Core Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `placeholder` | string | "Search anything... (⌘K)" | Input placeholder text |
| `scopes` | SearchScope[] | All scopes | Filter search by data type |
| `onSelect` | (result: SearchResult) => void | Required | Handle item selection |
| `onSearch` | (query: string) => void | - | Track search queries |

### Feature Flags

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `aiSuggestions` | boolean | true | Show AI-powered suggestions |
| `recentSearches` | boolean | true | Display recent search history |
| `popularSearches` | boolean | true | Show popular searches |
| `voiceSearch` | boolean | true | Enable voice search button |
| `commandPalette` | boolean | true | Enable Cmd+K shortcut |

### Data Configuration

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `searchEndpoint` | string | - | API endpoint for search |
| `staticResults` | SearchResult[] | [] | Static/offline search data |
| `debounceMs` | number | 300 | Debounce delay in ms |
| `maxResults` | number | 20 | Maximum results to show |
| `minQueryLength` | number | 2 | Minimum query length |

### Styling Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `theme` | 'default' \| 'minimal' \| 'command' | 'command' | Visual theme |
| `position` | 'center' \| 'top' | 'center' | Dialog position |
| `className` | string | - | Additional CSS classes |

---

## 🔍 Search Result Structure

```typescript
interface SearchResult {
  id: string
  type: 'entity' | 'transaction' | 'report' | 'action' | 'help'
  category: string
  title: string
  subtitle?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  url?: string
  action?: () => void | Promise<void>
  metadata?: Record<string, any>
  score?: number
  smartCode?: string
}
```

### Result Types

#### Entity Results
```typescript
{
  id: 'cust-123',
  type: 'entity',
  category: 'customer',
  title: 'Acme Corporation',
  subtitle: 'Technology company - San Francisco',
  url: '/customers/acme-corp',
  smartCode: 'HERA.CRM.CUST.ENT.PROF.v1'
}
```

#### Transaction Results
```typescript
{
  id: 'inv-2024-001',
  type: 'transaction',
  category: 'sale',
  title: 'Invoice #INV-2024-001',
  subtitle: '$1,250.00 - Acme Corporation',
  url: '/transactions/inv-2024-001',
  smartCode: 'HERA.FIN.SALE.TXN.INV.v1'
}
```

#### Action Results
```typescript
{
  id: 'act-create-invoice',
  type: 'action',
  category: 'action',
  title: 'Create New Invoice',
  subtitle: 'Quick action',
  action: async () => {
    await router.push('/invoices/new')
  },
  smartCode: 'HERA.ACTION.CREATE.INV.v1'
}
```

---

## 🤖 AI-Powered Features

### Smart Suggestions
The search component provides intelligent suggestions based on:
- Query context and intent
- User search history
- Popular searches in the organization
- Related terms and synonyms

### Example AI Suggestions
```typescript
// User types: "revenue"
// AI suggests:
- "Show revenue report"
- "Compare revenue by month"
- "Top revenue customers"
- "Revenue forecast"
```

### Custom AI Provider
```typescript
<UniversalSearch
  aiSuggestions={true}
  onSearch={async (query) => {
    // Custom AI integration
    const suggestions = await myAIService.getSuggestions(query)
    // Handle suggestions
  }}
/>
```

---

## 🎙️ Voice Search

### Requirements
- Modern browser with Web Speech API support
- Microphone permissions
- HTTPS connection (production)

### Usage
```typescript
<UniversalSearch
  voiceSearch={true}
  // Voice search button appears in search input
/>
```

### Supported Languages
Default: `en-US`

To support other languages, extend the component:
```typescript
// In component customization
recognition.lang = 'es-ES' // Spanish
recognition.lang = 'ar-SA' // Arabic
recognition.lang = 'zh-CN' // Chinese
```

---

## ⌘ Command Palette

### Keyboard Shortcuts
- **Open Search**: `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
- **Navigate**: `↑` `↓` Arrow keys
- **Select**: `Enter`
- **Close**: `Escape`

### Disable Command Palette
```typescript
<UniversalSearch
  commandPalette={false}
  // Cmd+K shortcut disabled
/>
```

---

## 🎨 Theming

### Built-in Themes

#### Command Theme (Default)
Professional command palette style with muted background
```typescript
theme="command"
```

#### Minimal Theme
Clean, simple appearance
```typescript
theme="minimal"
```

#### Default Theme
Standard HERA design with shadows
```typescript
theme="default"
```

### Custom Styling
```css
/* Override CSS variables */
.universal-search {
  --search-border-radius: 12px;
  --search-max-width: 600px;
  --search-backdrop-blur: 8px;
}
```

---

## 📱 Mobile Optimization

### Touch Gestures
- Large touch targets (44px minimum)
- Smooth scrolling in results
- Touch-friendly item selection

### Voice Search on Mobile
- Prominent microphone button
- Native speech recognition
- Visual feedback during recording

### Responsive Behavior
- Full-screen mode on small devices
- Adjusted result density
- Simplified UI elements

---

## 🔌 API Integration

### Server-Side Search
```typescript
// API endpoint implementation
app.post('/api/v1/search', async (req, res) => {
  const { query, scopes, limit } = req.body
  
  // Search across universal tables
  const results = await universalApi.search({
    query,
    tables: scopes,
    limit,
    organization_id: req.user.organization_id
  })
  
  // Transform to SearchResult format
  const searchResults = results.map(transformToSearchResult)
  
  res.json({ results: searchResults })
})
```

### Client Integration
```typescript
<UniversalSearch
  searchEndpoint="/api/v1/search"
  onSelect={handleSelect}
/>
```

---

## 🧪 Testing

### Unit Testing
```typescript
import { render, fireEvent, waitFor } from '@testing-library/react'
import { UniversalSearch } from '@/lib/dna/components/search'

test('searches and selects result', async () => {
  const onSelect = jest.fn()
  const mockResults = [/* ... */]
  
  const { getByPlaceholderText, getByText } = render(
    <UniversalSearch
      staticResults={mockResults}
      onSelect={onSelect}
    />
  )
  
  // Open search
  fireEvent.click(getByPlaceholderText(/search/i))
  
  // Type query
  fireEvent.change(getByPlaceholderText(/search/i), {
    target: { value: 'customer' }
  })
  
  // Wait for results
  await waitFor(() => {
    expect(getByText('Acme Corporation')).toBeInTheDocument()
  })
  
  // Select result
  fireEvent.click(getByText('Acme Corporation'))
  
  expect(onSelect).toHaveBeenCalledWith(
    expect.objectContaining({
      title: 'Acme Corporation'
    })
  )
})
```

---

## 🚀 Performance

### Optimization Tips

1. **Debouncing**
   ```typescript
   debounceMs={300} // Adjust based on API response time
   ```

2. **Result Limits**
   ```typescript
   maxResults={20} // Balance between coverage and performance
   ```

3. **Static Results**
   ```typescript
   // Preload common results for instant display
   staticResults={commonSearchItems}
   ```

4. **Lazy Loading**
   ```typescript
   // Load search component on demand
   const UniversalSearch = lazy(() => 
     import('@/lib/dna/components/search/UniversalSearch')
   )
   ```

---

## 🐛 Troubleshooting

### Common Issues

1. **Voice search not working**
   - Check browser compatibility
   - Ensure HTTPS connection
   - Grant microphone permissions

2. **No search results**
   - Verify `minQueryLength` setting
   - Check scope configuration
   - Validate API endpoint

3. **Cmd+K not working**
   - Check `commandPalette` prop
   - Verify no conflicting shortcuts
   - Test in different browsers

---

## 🎯 Best Practices

1. **Provide Good Placeholders**
   ```typescript
   placeholder="Search customers, orders, reports..."
   ```

2. **Use Smart Codes**
   ```typescript
   // Always include smart codes in results
   smartCode: 'HERA.CRM.CUST.ENT.PROF.v1'
   ```

3. **Handle All Result Types**
   ```typescript
   onSelect={(result) => {
     if (result.url) router.push(result.url)
     else if (result.action) result.action()
     else console.warn('Unhandled result type')
   })
   ```

4. **Track Usage**
   ```typescript
   onSearch={(query) => {
     analytics.track('search_performed', { query })
   }}
   ```

5. **Provide Fallbacks**
   ```typescript
   staticResults={offlineSearchData} // Works without API
   ```

---

This UniversalSearch component provides a world-class search experience that scales from small businesses to large enterprises, with the flexibility to adapt to any industry through HERA's universal architecture.