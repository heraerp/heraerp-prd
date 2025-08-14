# HERA CRM Error Handling & Edge Case Management

## Overview

HERA CRM implements a comprehensive error handling system that provides user-friendly error messages, automatic retry mechanisms, and graceful fallbacks for all edge cases. The system is designed to enhance user experience and prevent data loss during unexpected situations.

## Architecture

### Core Components

1. **CRM Error Handler** (`/src/lib/crm/error-handler.ts`)
   - Centralized error processing and classification
   - 40+ predefined error codes with user-friendly messages
   - Automatic retry logic for recoverable errors
   - Error logging and monitoring

2. **Error Display Components** (`/src/components/crm/error-display.tsx`)
   - User-friendly error notifications
   - Toast notifications with auto-dismiss
   - Detailed error pages for critical failures
   - Error statistics dashboard

3. **Custom Hooks** (`/src/hooks/use-crm-error.ts`)
   - `useCRMError` - Main error handling hook
   - `useCRMFormValidation` - Form validation with error handling
   - `useCRMAsyncOperation` - Async operations with error management

4. **Error Provider** (`/src/components/crm/error-provider.tsx`)
   - Global error context and state management
   - Toast notification queue management
   - Error boundary integration

## Error Categories

### Authentication & Authorization
- `AUTH_REQUIRED` - User needs to sign in
- `AUTH_EXPIRED` - Session expired, requires re-authentication
- `INSUFFICIENT_PERMISSIONS` - User lacks required permissions

### Data Validation
- `INVALID_EMAIL` - Invalid email format
- `MISSING_REQUIRED_FIELD` - Required field is empty
- `DUPLICATE_CONTACT` - Contact with email already exists
- `INVALID_PHONE` - Invalid phone number format
- `INVALID_DATE` - Invalid date format or past date
- `INVALID_AMOUNT` - Invalid monetary amount

### Deal Management
- `DEAL_NOT_FOUND` - Deal record doesn't exist
- `DEAL_STAGE_INVALID` - Invalid stage transition
- `DEAL_VALUE_REQUIRED` - Deal value required for stage

### Contact Management
- `CONTACT_NOT_FOUND` - Contact record doesn't exist
- `CONTACT_HAS_ACTIVE_DEALS` - Cannot delete contact with active deals

### Network & API Errors
- `NETWORK_ERROR` - Connection failed
- `API_TIMEOUT` - Request timed out
- `SERVER_ERROR` - Internal server error
- `RATE_LIMITED` - Too many requests

### System Errors
- `ORG_NOT_FOUND` - Organization not found
- `SETTINGS_SAVE_FAILED` - Failed to save settings
- `UNKNOWN_ERROR` - Generic fallback error

## Usage Examples

### Basic Error Handling

```typescript
import { useCRMError } from '@/hooks/use-crm-error'

function ContactForm() {
  const { handleError, executeWithErrorHandling } = useCRMError()

  const saveContact = async (contactData) => {
    await executeWithErrorHandling(async () => {
      const response = await api.createContact(contactData)
      return response
    }, { component: 'ContactForm', action: 'saveContact' })
  }
}
```

### Form Validation

```typescript
import { useCRMFormValidation } from '@/hooks/use-crm-error'

function ContactForm() {
  const validation = useCRMFormValidation('contact')
  
  const handleSubmit = () => {
    if (!validation.validateForm(formData)) {
      return // Errors automatically displayed
    }
    // Proceed with form submission
  }

  return (
    <div>
      <input 
        type="email" 
        onChange={(e) => validation.validateField('email', e.target.value, true)}
      />
      {validation.getFieldError('email') && (
        <span className="error">{validation.getFieldError('email')}</span>
      )}
    </div>
  )
}
```

### Global Error Provider

```typescript
import { CRMErrorProvider } from '@/components/crm/error-provider'

function App() {
  return (
    <CRMErrorProvider maxErrors={5} defaultDuration={5000}>
      <CRMContent />
    </CRMErrorProvider>
  )
}
```

### Error Display

```typescript
import { ErrorDisplay } from '@/components/crm/error-display'

function ComponentWithError({ error }) {
  return (
    <div>
      {error && (
        <ErrorDisplay 
          error={error}
          onRetry={() => retryOperation()}
          onDismiss={() => clearError()}
          showDetails={true}
        />
      )}
    </div>
  )
}
```

## Error Handling Patterns

### 1. Automatic Retry
```typescript
const { executeWithErrorHandling } = useCRMError({
  autoRetry: true,
  maxRetries: 3,
  retryDelay: 1000
})
```

### 2. Manual Error Handling
```typescript
const { handleError } = useCRMError()

try {
  // Operation
} catch (error) {
  handleError('NETWORK_ERROR', error, { component: 'MyComponent' })
}
```

### 3. Validation with Fallbacks
```typescript
const result = crmErrorHandler.validateCRMData(data, 'contact')
if (!result.success) {
  // Use fallback data
  const fallbackData = result.fallbackData
}
```

## Edge Cases Handled

### 1. Network Connectivity
- **Offline Detection**: Automatic detection of network status
- **Request Queuing**: Queue operations when offline
- **Retry Logic**: Exponential backoff for failed requests
- **Fallback Data**: Show cached data when API unavailable

### 2. Data Integrity
- **Duplicate Prevention**: Check for duplicate records before creation
- **Validation**: Comprehensive client-side validation
- **Consistency Checks**: Verify data relationships
- **Recovery**: Automatic data recovery from errors

### 3. User Experience
- **Loading States**: Clear indication of processing status
- **Error Messages**: User-friendly, actionable error messages
- **Graceful Degradation**: Partial functionality when systems fail
- **Progress Preservation**: Save user progress during errors

### 4. Authentication Issues
- **Token Refresh**: Automatic token renewal
- **Session Recovery**: Restore session after network issues
- **Permission Handling**: Clear permission error messages
- **Login Prompts**: Seamless re-authentication flow

## Error Recovery Strategies

### 1. Data Recovery
```typescript
// Automatic fallback data
const fallbackContact = {
  name: 'Unknown Contact',
  email: '',
  status: 'inactive'
}
```

### 2. Operation Retry
```typescript
// Retry with exponential backoff
const retryDelays = {
  'NETWORK_ERROR': 1000,
  'API_TIMEOUT': 2000,
  'SERVER_ERROR': 3000,
  'RATE_LIMITED': 5000
}
```

### 3. State Preservation
```typescript
// Save form state during errors
const preserveFormState = (formData) => {
  localStorage.setItem('crm-form-backup', JSON.stringify(formData))
}
```

## Monitoring & Analytics

### Error Statistics
- **Error Frequency**: Track error occurrence by type
- **User Impact**: Measure affected user sessions
- **Recovery Success**: Monitor retry success rates
- **Performance Impact**: Track error handling overhead

### Dashboard Metrics
```typescript
const stats = crmErrorHandler.getErrorStats()
// Returns:
// - totalErrors: number
// - errorsByCategory: Record<string, number>
// - errorsBySeverity: Record<string, number>
// - recentErrors: CRMError[]
```

## Best Practices

### 1. Error Message Design
- **Clear & Actionable**: Tell users exactly what to do
- **Contextual**: Provide relevant information
- **Consistent**: Use similar language across the system
- **Helpful**: Suggest solutions, not just problems

### 2. Error Handling Strategy
- **Fail Gracefully**: Never break the entire application
- **Preserve Data**: Don't lose user work due to errors
- **Inform Users**: Keep users informed of system status
- **Quick Recovery**: Provide easy ways to recover

### 3. Development Guidelines
- **Use Proper Codes**: Always use specific error codes
- **Add Context**: Include component and action information
- **Handle Async**: Properly handle promises and async operations
- **Test Edge Cases**: Test all error scenarios

## Testing Error Handling

### Unit Tests
```typescript
describe('CRM Error Handler', () => {
  it('should handle network errors', () => {
    const result = crmErrorHandler.handleError('NETWORK_ERROR')
    expect(result.retryable).toBe(true)
    expect(result.error.userMessage).toContain('connection')
  })
})
```

### Integration Tests
```typescript
describe('Contact Form Error Handling', () => {
  it('should show validation errors', async () => {
    const { getByText } = render(<ContactForm />)
    // Test validation error display
  })
})
```

### End-to-End Tests
```typescript
describe('CRM Error Scenarios', () => {
  it('should handle API failures gracefully', async () => {
    // Mock API failure
    // Verify error handling and recovery
  })
})
```

## Configuration

### Environment Variables
```bash
# Error handling configuration
CRM_ERROR_RETRY_ATTEMPTS=3
CRM_ERROR_TIMEOUT=30000
CRM_ERROR_LOG_LEVEL=info
```

### Runtime Configuration
```typescript
const errorConfig = {
  maxErrors: 5,
  defaultDuration: 5000,
  autoRetry: true,
  logErrors: process.env.NODE_ENV === 'development'
}
```

## Error Codes Reference

| Code | Category | Severity | Retryable | Description |
|------|----------|----------|-----------|-------------|
| AUTH_REQUIRED | authentication | high | false | User authentication required |
| NETWORK_ERROR | network | medium | true | Network connection failed |
| DUPLICATE_CONTACT | validation | medium | false | Contact already exists |
| DEAL_NOT_FOUND | data | medium | false | Deal record not found |
| SERVER_ERROR | system | high | true | Internal server error |

*See `/src/lib/crm/error-handler.ts` for complete error codes list*

## Integration with HERA Universal Architecture

The CRM error handling system integrates seamlessly with HERA's universal 6-table architecture:

- **Core Entities**: Error tracking for all entity operations
- **Dynamic Data**: Validation for custom fields
- **Transactions**: Error handling for business operations
- **Relationships**: Consistency checks for related data
- **Organizations**: Multi-tenant error isolation
- **Universal APIs**: Standardized error responses

## Future Enhancements

1. **Machine Learning**: Predictive error prevention
2. **Advanced Analytics**: Error pattern analysis
3. **Real-time Monitoring**: Live error tracking dashboard
4. **Automated Recovery**: Self-healing system capabilities
5. **User Behavior Analysis**: Error impact on user workflows