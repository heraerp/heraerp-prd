#!/usr/bin/env node

/**
 * Emergency Fix for HERA - Page Not Loading
 * 
 * This script creates a minimal working page to get the system running
 */

const fs = require('fs').promises;
const path = require('path');

async function createEmergencyPage() {
  console.log('🚨 EMERGENCY FIX - Creating minimal working page...');
  
  const emergencyPageContent = `import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HERA ERP - System Ready',
  description: 'HERA Emergency Page - System is operational'
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center p-8">
        <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-gray-900 mb-2">HERA ERP</h1>
        <p className="text-gray-600 mb-6">System is ready and operational</p>
        
        <div className="space-y-3">
          <a 
            href="/apps" 
            className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
          >
            View Applications
          </a>
          
          <a 
            href="/inventory" 
            className="block w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors"
          >
            Inventory Module (Generated)
          </a>
          
          <a 
            href="/salon" 
            className="block w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors"
          >
            Salon Demo
          </a>
        </div>
        
        <div className="mt-8 text-sm text-gray-500">
          <p>✅ Claude App Builder System Ready</p>
          <p>✅ HERA Sacred Six Integration</p>
          <p>✅ Mobile-First Design</p>
        </div>
      </div>
    </div>
  )
}`;

  const pagePath = path.join(process.cwd(), 'src/app/page.tsx');
  
  // Backup existing page
  try {
    const existing = await fs.readFile(pagePath, 'utf8');
    await fs.writeFile(pagePath + '.backup', existing);
    console.log('   📁 Backed up existing page.tsx');
  } catch (error) {
    console.log('   ⚠️ No existing page to backup');
  }
  
  // Write emergency page
  await fs.writeFile(pagePath, emergencyPageContent);
  console.log('   ✅ Emergency page created');
}

async function createSimpleLayout() {
  console.log('🔧 Creating simplified layout...');
  
  const layoutContent = `import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals-migration-test.css'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin']
})

export const metadata: Metadata = {
  title: 'HERA Universal ERP',
  description: 'Run your entire business in one beautiful platform'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter antialiased">
        {children}
      </body>
    </html>
  )
}`;

  const layoutPath = path.join(process.cwd(), 'src/app/layout.tsx');
  
  // Backup existing layout
  try {
    const existing = await fs.readFile(layoutPath, 'utf8');
    await fs.writeFile(layoutPath + '.backup', existing);
    console.log('   📁 Backed up existing layout.tsx');
  } catch (error) {
    console.log('   ⚠️ No existing layout to backup');
  }
  
  // Write simplified layout
  await fs.writeFile(layoutPath, layoutContent);
  console.log('   ✅ Simplified layout created');
}

async function main() {
  console.log('🚨 HERA EMERGENCY FIX UTILITY');
  console.log('   Creating minimal working pages to get system running\n');
  
  await createEmergencyPage();
  await createSimpleLayout();
  
  console.log('\n🎯 EMERGENCY FIX COMPLETED:');
  console.log('   ✅ Minimal working page created');
  console.log('   ✅ Simplified layout without complex providers');
  console.log('   ✅ Original files backed up with .backup extension');
  console.log('');
  console.log('💡 NEXT STEPS:');
  console.log('   1. Refresh your browser: http://localhost:3002');
  console.log('   2. Page should load immediately');
  console.log('   3. Navigate to /inventory to see generated module');
  console.log('   4. Navigate to /apps to see application list');
  console.log('');
  console.log('🔧 TO RESTORE:');
  console.log('   • mv src/app/page.tsx.backup src/app/page.tsx');
  console.log('   • mv src/app/layout.tsx.backup src/app/layout.tsx');
}

main().catch(console.error);