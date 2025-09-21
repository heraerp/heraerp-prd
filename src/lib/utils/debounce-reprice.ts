/**
 * Debounced reprice utility to coalesce UI calls
 * Prevents spam when users rapidly add/remove items
 */

let repriceTimeout: NodeJS.Timeout | null = null
const REPRICE_DEBOUNCE_MS = 150

export function debouncedReprice(cartId: string, repriceFunction: () => Promise<void>) {
  // Clear any pending reprice
  if (repriceTimeout) {
    clearTimeout(repriceTimeout)
  }

  // Schedule new reprice after debounce delay
  repriceTimeout = setTimeout(async () => {
    try {
      await repriceFunction()
      repriceTimeout = null
    } catch (error) {
      console.error('Debounced reprice failed:', error)
      repriceTimeout = null
    }
  }, REPRICE_DEBOUNCE_MS)
}

export function cancelPendingReprice() {
  if (repriceTimeout) {
    clearTimeout(repriceTimeout)
    repriceTimeout = null
  }
}
