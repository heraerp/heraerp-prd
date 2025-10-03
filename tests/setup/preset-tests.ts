// Setup file for preset tests
import { expect } from 'vitest'

// Add custom matchers if needed
expect.extend({
  toHaveValidSmartCode(received: string) {
    const pattern = /^HERA\.[A-Z0-9]{2,15}(?:\.[A-Z0-9_]{1,30}){2,8}\.V[0-9]+$/
    const pass = pattern.test(received)
    
    return {
      pass,
      message: () => 
        pass 
          ? `expected ${received} not to be a valid smart code`
          : `expected ${received} to be a valid smart code (pattern: HERA.{DOMAIN}.{MODULE}.{KIND}...V{n})`,
    }
  },
  
  toHaveValidEntityType(received: string) {
    const pattern = /^[A-Z0-9_]+$/
    const pass = pattern.test(received)
    
    return {
      pass,
      message: () =>
        pass
          ? `expected ${received} not to be a valid entity type`
          : `expected ${received} to be a valid entity type (UPPER_SNAKE_CASE)`,
    }
  }
})

// Declare module augmentation for TypeScript
declare module 'vitest' {
  interface Assertion {
    toHaveValidSmartCode(): void
    toHaveValidEntityType(): void
  }
}