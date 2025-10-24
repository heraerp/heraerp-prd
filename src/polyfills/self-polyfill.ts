/**
 * SSR Self Polyfill
 *
 * Provides a temporary polyfill for `self` in server-side rendering contexts.
 * This prevents build failures when dependencies reference `self` at module scope.
 *
 * TODO: Remove this polyfill once all browser-only code is properly isolated
 * behind client components or dynamic imports with { ssr: false }
 */

if (typeof globalThis.self === 'undefined') {
  // @ts-ignore - Temporary SSR compatibility
  globalThis.self = globalThis
}
