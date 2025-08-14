/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  env: {
    EDUCATION_PLATFORM_NAME: 'Test CA Platform',
    EDUCATION_DOMAIN: 'accounting',
  }
}

module.exports = nextConfig
