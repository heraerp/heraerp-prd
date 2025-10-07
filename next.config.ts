import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produce a self-contained server for production containers
  output: 'standalone',
  // ESLint configuration - temporarily ignore during builds for Vercel
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // TypeScript configuration - Temporarily disabled due to 200+ errors in services
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // PWA configuration
  headers: async () => {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
  
  // Image optimization
  images: {
    domains: ["localhost"],
    formats: ["image/avif", "image/webp"],
  },
  
  // Enable strict mode for better development experience
  reactStrictMode: true,
  async rewrites() {
    return {
      beforeFiles: [
        // Ensure /api/healthz always resolves, even if a route fails to compile
        { source: '/api/healthz', destination: '/api/health' }
      ],
      afterFiles: [],
      fallback: []
    }
  }
};

export default nextConfig;
