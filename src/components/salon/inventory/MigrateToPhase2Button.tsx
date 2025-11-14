/**
 * Migration Button: Phase 1 → Phase 2
 *
 * One-click migration to enterprise stock management
 */

'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { migrateToPhase2, type MigrationResult } from '@/lib/inventory/migrate-to-phase2'
import { RefreshCw, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react'

interface MigrateToPhase2ButtonProps {
  organizationId: string
  onMigrationComplete?: () => void
}

export function MigrateToPhase2Button({ organizationId, onMigrationComplete }: MigrateToPhase2ButtonProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<MigrationResult | null>(null)

  const handleMigrate = async () => {
    setIsRunning(true)
    setResult(null)

    try {
      const migrationResult = await migrateToPhase2(organizationId)
      setResult(migrationResult)

      if (migrationResult.success && onMigrationComplete) {
        onMigrationComplete()
      }
    } catch (error: any) {
      setResult({
        success: false,
        stockLevelsCreated: 0,
        products: 0,
        locations: 0,
        errors: [error.message]
      })
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          onClick={handleMigrate}
          disabled={isRunning}
          className="gap-2"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: 'white'
          }}
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Migrating...
            </>
          ) : (
            <>
              <TrendingUp className="w-4 h-4" />
              Migrate to Phase 2
            </>
          )}
        </Button>

        <div className="text-sm text-gray-600">
          Creates STOCK_LEVEL entities for enterprise inventory tracking
        </div>
      </div>

      {result && (
        <Alert variant={result.success ? 'default' : 'destructive'}>
          {result.success ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertTriangle className="h-4 w-4" />
          )}
          <AlertDescription>
            {result.success ? (
              <div>
                <p className="font-semibold">Migration completed successfully!</p>
                <p className="text-sm mt-1">
                  Created {result.stockLevelsCreated} stock levels for {result.products} products across {result.locations} locations.
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold">Migration encountered errors:</p>
                <ul className="text-sm mt-1 list-disc list-inside">
                  {result.errors.map((error, i) => (
                    <li key={i}>{error}</li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
