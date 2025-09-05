/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Disable static optimization for faster builds
  experimental: {
    optimizeCss: false,
    optimizePackageImports: ['lucide-react']
  },
  // Skip type checking during build (temporary for debugging)
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  // Reduce build complexity
  webpack: (config, { isServer }) => {
    // Disable source maps in production for faster builds
    if (!isServer) {
      config.devtool = false;
    }
    return config;
  }
}

export default nextConfig