'use client'

export default function SalonLanding() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-4">
        <h1 className="text-3xl font-bold">Salon vNext</h1>
        <p className="text-muted-foreground">
          This module is being rebuilt using the new HERA playbook. The previous implementation has
          been archived under <code>backups/</code>.
        </p>
        <p className="text-sm text-muted-foreground">
          Track progress in <code>hera/playbook/playbook.md</code>. This placeholder keeps routes
          clean and build stable.
        </p>
      </div>
    </div>
  )
}
