'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/MultiOrgAuthProvider'
import { EnterpriseRetailSolutionSidebar } from '@/components/enterprise-retail-progressive/EnterpriseRetailSolutionSidebar'
import { UniversalTourProvider, TourElement } from '@/components/tours/SimpleTourProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Search, Filter } from 'lucide-react'

export default function AnalyticsPage() {
  const { user, workspace } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Load data using HERA Progressive Auth pattern
    const loadData = () => {
      if (organization?.organization_id) {
        const storedData = localStorage.getItem(`hera_data_${organization?.organization_id}`)
        const data = storedData ? JSON.parse(storedData) : {}
        setItems(data.analytics || [])
      }
      setLoading(false)
    }
    
    loadData()
  }, [workspace])

  if (loading) {
    return <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p>Loading analytics...</p>
      </div>
    </div>
  }

  return (


    <UniversalTourProvider industryKey="retail-analytics" autoStart={true}>

    <div className="min-h-screen bg-white flex">
      <EnterpriseRetailSolutionSidebar />
      
      <div className="flex-1 flex flex-col">
        <TourElement tourId="header">
          <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8">
          <div>
            <h1 className="text-2xl font-light text-gray-900 capitalize">{"analytics"}</h1>
            <p className="text-sm text-gray-500">{user?.organizationName || 'Sample Business'}</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
            <Button size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              Add analytic
            </Button>
          </div>
        </header>
        </TourElement>

        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto">
            {items.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No analytics yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Get started by adding your first analytic
                </p>
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add analytic
                </Button>
              </div>



            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {items.map((item, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {item.name || `${module.slice(0, -1)} ${index + 1}`}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600">
                        Generated using HERA DNA from jewelry-progressive
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
    </UniversalTourProvider>
  )
}