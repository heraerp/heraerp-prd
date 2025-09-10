import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'HERA Universal ERP',
    short_name: 'HERA',
    description: 'Revolutionary ERP platform with universal 6-table architecture',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A0A0B',
    theme_color: '#3B82F6',
    orientation: 'portrait-primary',
    scope: '/',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-72x72.svg',
        sizes: '72x72',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/icon-96x96.svg',
        sizes: '96x96',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/icon-128x128.svg',
        sizes: '128x128',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/icon-144x144.svg',
        sizes: '144x144',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/icon-152x152.svg',
        sizes: '152x152',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/icon-192x192.svg',
        sizes: '192x192',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/icon-384x384.svg',
        sizes: '384x384',
        type: 'image/svg+xml',
        purpose: 'any'
      },
      {
        src: '/icons/icon-512x512.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'any'
      }
    ],
    screenshots: [
      {
        src: '/screenshots/desktop-home.png',
        sizes: '1280x720',
        type: 'image/png',
        form_factor: 'wide'
      },
      {
        src: '/screenshots/mobile-home.png',
        sizes: '390x844',
        type: 'image/png',
        form_factor: 'narrow'
      }
    ],
    shortcuts: [
      {
        name: 'Dashboard',
        short_name: 'Dashboard',
        description: 'View your HERA dashboard',
        url: '/dashboard',
        icons: [{ src: '/icons/dashboard.svg', sizes: '96x96', type: 'image/svg+xml' }]
      },
      {
        name: 'Entities',
        short_name: 'Entities',
        description: 'Manage business entities',
        url: '/entities',
        icons: [{ src: '/icons/entities.svg', sizes: '96x96', type: 'image/svg+xml' }]
      },
      {
        name: 'Transactions',
        short_name: 'Transactions',
        description: 'View transactions',
        url: '/transactions',
        icons: [{ src: '/icons/transactions.svg', sizes: '96x96', type: 'image/svg+xml' }]
      }
    ],
    prefer_related_applications: false,
    related_applications: []
  }
}