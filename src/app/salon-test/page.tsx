/**
 * Basic Salon Test Page
 * Tests if salon dashboard loads without auth
 */

'use client'

export default function SalonTestPage() {
  const goToSalon = () => {
    // Set organization data first
    localStorage.setItem('organizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
    localStorage.setItem('safeOrganizationId', '378f24fb-d496-4ff7-8afa-ea34895a0eb8')
    localStorage.setItem('salonRole', 'owner')
    
    // Go to salon
    window.location.href = '/salon/dashboard'
  }

  return (
    <div className="min-h-screen bg-gray-800 flex items-center justify-center">
      <div className="text-center text-white p-8">
        <h1 className="text-4xl font-bold mb-8">🧪 Salon Test Page</h1>
        <p className="text-xl mb-8">This page has NO auth providers</p>
        
        <button
          onClick={goToSalon}
          className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-xl font-bold"
        >
          🎯 Go to Salon Dashboard
        </button>
        
        <div className="mt-8 text-gray-300">
          <p>Organization ID: 378f24fb-d496-4ff7-8afa-ea34895a0eb8</p>
        </div>
      </div>
    </div>
  )
}