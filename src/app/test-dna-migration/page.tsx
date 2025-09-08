"use client"

import { Card as OriginalCard, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Card as DNACard } from "@/components/ui/card.dna"

export default function TestDNAMigration() {
  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">HERA DNA Migration Test</h1>
      
      {/* Test both light and dark modes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Light mode section */}
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Light Mode</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Original Card:</p>
              <OriginalCard>
                <CardHeader>
                  <CardTitle>Original Card</CardTitle>
                  <CardDescription>Using standard styling</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This is the original card component without DNA enhancements.</p>
                </CardContent>
              </OriginalCard>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">DNA Card (Subtle Glass):</p>
              <DNACard glassIntensity="subtle">
                <CardHeader>
                  <CardTitle>DNA Card - Subtle</CardTitle>
                  <CardDescription>With subtle glass effects</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This card uses DNA glass effects with subtle intensity.</p>
                </CardContent>
              </DNACard>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">DNA Card (Medium Glass):</p>
              <DNACard glassIntensity="medium">
                <CardHeader>
                  <CardTitle>DNA Card - Medium</CardTitle>
                  <CardDescription>With medium glass effects</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This card uses DNA glass effects with medium intensity.</p>
                </CardContent>
              </DNACard>
            </div>
            
            <div>
              <p className="text-sm text-gray-600 mb-2">DNA Card (Strong Glass):</p>
              <DNACard glassIntensity="strong" variant="primary">
                <CardHeader>
                  <CardTitle>DNA Card - Strong</CardTitle>
                  <CardDescription>With strong glass effects and primary variant</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This card uses DNA glass effects with strong intensity.</p>
                </CardContent>
              </DNACard>
            </div>
          </div>
        </div>
        
        {/* Dark mode section */}
        <div className="space-y-4 p-4 bg-gray-900 rounded-lg dark">
          <h2 className="text-xl font-semibold mb-4 text-white">Dark Mode</h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-400 mb-2">Original Card:</p>
              <OriginalCard>
                <CardHeader>
                  <CardTitle>Original Card</CardTitle>
                  <CardDescription>Using standard styling</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>This is the original card component without DNA enhancements.</p>
                </CardContent>
              </OriginalCard>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">DNA Card (Subtle Glass):</p>
              <DNACard glassIntensity="subtle">
                <CardHeader>
                  <CardTitle>DNA Card - Subtle</CardTitle>
                  <CardDescription>With subtle glass effects</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">This card uses DNA glass effects with subtle intensity.</p>
                </CardContent>
              </DNACard>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">DNA Card (Medium Glass):</p>
              <DNACard glassIntensity="medium">
                <CardHeader>
                  <CardTitle>DNA Card - Medium</CardTitle>
                  <CardDescription>With medium glass effects</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">This card uses DNA glass effects with medium intensity.</p>
                </CardContent>
              </DNACard>
            </div>
            
            <div>
              <p className="text-sm text-gray-400 mb-2">DNA Card (Strong Glass):</p>
              <DNACard glassIntensity="strong" variant="primary">
                <CardHeader>
                  <CardTitle>DNA Card - Strong</CardTitle>
                  <CardDescription>With strong glass effects and primary variant</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">This card uses DNA glass effects with strong intensity.</p>
                </CardContent>
              </DNACard>
            </div>
          </div>
        </div>
      </div>
      
      {/* Migration controls */}
      <div className="mt-8 p-6 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <h3 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Migration Status</h3>
        <p className="text-yellow-700 dark:text-yellow-300 text-sm">
          Currently testing DNA Card component side-by-side with original. 
          The DNA version maintains backward compatibility while adding glass effects.
        </p>
        <div className="mt-4 space-y-2 text-sm">
          <p className="text-yellow-700 dark:text-yellow-300">✓ Original component still works</p>
          <p className="text-yellow-700 dark:text-yellow-300">✓ DNA version adds glass effects</p>
          <p className="text-yellow-700 dark:text-yellow-300">✓ Both can be used during migration</p>
          <p className="text-yellow-700 dark:text-yellow-300">✓ Text visibility improved in dark mode</p>
        </div>
      </div>
    </div>
  )
}