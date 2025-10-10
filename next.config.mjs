/** @type {import('next').NextConfig} */
const nextConfig = {
  // Produce a self-contained server for Railway
  output: 'standalone',

  // ESLint/TS relaxed for builds
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // Security headers
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ];
  },

  // Images
  images: {
    domains: ['localhost'],
    formats: ['image/avif', 'image/webp'],
  },

  reactStrictMode: true,

  // No health rewrites; we use plain /healthz now
  async rewrites() {
    return { beforeFiles: [], afterFiles: [], fallback: [] };
  },
};

export default nextConfig;
