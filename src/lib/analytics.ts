/**
 * Lightweight analytics tracking for HERA ERP
 * Dispatches custom events that can be captured by analytics providers
 */

export const track = (name: string, payload?: Record<string, any>) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(name, { detail: payload }))
  }
}