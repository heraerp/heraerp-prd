/**
 * Polyfills for server-side rendering
 * Provides browser globals for Next.js build process
 */

// Polyfill for 'self' which is used by some libraries but not available in Node.js
if (typeof self === 'undefined') {
  (global as any).self = global;
}

// Polyfill for window (used by some libraries during SSR)
if (typeof window === 'undefined') {
  (global as any).window = {
    location: {
      href: '',
      origin: '',
      protocol: 'https:',
      host: '',
      hostname: '',
      port: '',
      pathname: '/',
      search: '',
      hash: ''
    },
    navigator: {
      userAgent: 'node',
    },
    document: {
      createElement: () => ({}),
      createTextNode: () => ({}),
      getElementById: () => null,
    },
  };
}

export {};