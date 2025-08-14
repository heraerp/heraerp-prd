/**
 * Universal HERA Components
 * 
 * A collection of battle-tested components and patterns learned from
 * building the restaurant management system. These components avoid
 * common pitfalls and provide consistent, high-quality implementations.
 */

// Authentication
export {
  UniversalAuthProvider,
  useUniversalAuth,
  UniversalAuthContext,
  type UniversalAuthConfig,
  type UniversalAuthContextType,
  type User,
  type Organization,
  type HeraContext
} from './auth/UniversalAuthProvider'

// API Client
export {
  UniversalAPIClient,
  createUniversalAPIClient,
  useUniversalAPI,
  type APIResponse,
  type APIError,
  type UniversalAPIConfig,
  type RetryConfig,
  type CacheConfig
} from './api/UniversalAPIClient'

// Form Components
export {
  UniversalForm,
  UniversalInput,
  UniversalTextarea,
  UniversalSelect,
  UniversalButton,
  UniversalFieldGroup,
  UniversalModal,
  FormValidation,
  useFormState
} from './forms/UniversalForm'

// Loading States & Error Handling
export {
  UniversalSpinner,
  UniversalFullPageLoading,
  UniversalInlineLoading,
  UniversalSkeleton,
  UniversalCardSkeleton,
  UniversalErrorBoundary,
  UniversalErrorDisplay,
  useLoadingState,
  useNetworkStatus
} from './ui/UniversalLoadingStates'

/**
 * Common Usage Patterns:
 * 
 * 1. Wrap your app with Universal Auth Provider:
 * ```tsx
 * <UniversalAuthProvider config={{
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *   heraApiBaseUrl: '/api/v1'
 * }}>
 *   <YourApp />
 * </UniversalAuthProvider>
 * ```
 * 
 * 2. Create API client with retry and caching:
 * ```tsx
 * const api = createUniversalAPIClient({
 *   baseUrl: '/api/v1',
 *   retries: { maxRetries: 3 },
 *   cache: { ttl: 30000 }
 * })
 * ```
 * 
 * 3. Build forms with consistent styling:
 * ```tsx
 * <UniversalForm onSubmit={handleSubmit}>
 *   <UniversalInput
 *     name="name"
 *     label="Name"
 *     required
 *     value={values.name}
 *     onChange={(value) => setValue('name', value)}
 *     error={errors.name}
 *   />
 *   <UniversalButton type="submit" loading={isSubmitting}>
 *     Submit
 *   </UniversalButton>
 * </UniversalForm>
 * ```
 * 
 * 4. Add error boundaries and loading states:
 * ```tsx
 * <UniversalErrorBoundary>
 *   {isLoading ? (
 *     <UniversalCardSkeleton count={3} />
 *   ) : (
 *     <YourContent />
 *   )}
 * </UniversalErrorBoundary>
 * ```
 */