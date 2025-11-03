import { Metadata } from 'next'

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
          
          <a 
            href="/finance-new" 
            className="block w-full bg-amber-600 text-white py-2 px-4 rounded-md hover:bg-amber-700 transition-colors"
          >
            Finance Module (New)
          </a>
          
          <a 
            href="/crud-demo" 
            className="block w-full bg-emerald-600 text-white py-2 px-4 rounded-md hover:bg-emerald-700 transition-colors"
          >
            🚀 CRUD Operations Demo
          </a>
          
          <a 
            href="/cashew" 
            className="block w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 transition-colors"
          >
            🥜 Cashew Manufacturing ERP
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
}