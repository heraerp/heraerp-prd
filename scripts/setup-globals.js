/**
 * Setup global polyfills for server-side rendering
 * This ensures browser globals are available during Next.js build
 */

// Polyfill for 'self' which is used by some libraries but not available in Node.js
if (typeof self === 'undefined') {
  global.self = global;
}

// Polyfill for window (used by some libraries during SSR)
if (typeof window === 'undefined') {
  global.window = global.window || {
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

console.log('✅ Global polyfills applied for SSR');