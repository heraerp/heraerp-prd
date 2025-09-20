'use client'

import { TestHERADNAHooks } from '@/lib/dna/hooks/test-hera-dna-hooks'

export default function TestDNAHooksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          HERA DNA Hooks Test Suite
        </h1>

        <div className="max-w-4xl mx-auto">
          <TestHERADNAHooks />
        </div>

        <div className="mt-8 p-4 bg-white/10 backdrop-blur-md rounded-lg">
          <h2 className="text-xl font-semibold text-white mb-4">Hook Registry Location</h2>
          <p className="text-white/80">
            All hooks are available from:{' '}
            <code className="bg-black/30 px-2 py-1 rounded">
              @/src/lib/dna/hooks/hera-dna-hook-registry
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}
