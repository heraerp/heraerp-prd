'use client'

import { useMemo, useState } from 'react'
import { EntityPage } from '@/components/entity/EntityPage'
import { entityPresets, type EntityPreset } from '@/hooks/entityPresets'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RefreshCw, Database, Users, Settings, Zap } from 'lucide-react'

/**
 * Live Preset Explorer - Demonstrates the Universal Framework
 *
 * Pick any preset → instant CRUD page with:
 * - Auto-generated forms
 * - Auto-generated tables
 * - Role-based permissions
 * - Dynamic fields and relationships
 * - Complete CRUD operations
 */
export default function PresetExplorerPage() {
  const { userRole = 'staff' } = useHERAAuth() ?? {}

  const presetKeys = useMemo(
    () => Object.keys(entityPresets) as Array<keyof typeof entityPresets>,
    []
  )
  const [key, setKey] = useState<keyof typeof entityPresets>(presetKeys[0]!)

  const preset: EntityPreset = useMemo(() => entityPresets[key], [key])

  // Get preset stats
  const stats = useMemo(() => {
    const dynamicFieldCount = preset.dynamicFields?.length || 0
    const relationshipCount = preset.relationships?.length || 0
    const hasPermissions = !!preset.permissions

    return {
      fields: dynamicFieldCount,
      relationships: relationshipCount,
      permissions: hasPermissions
    }
  }, [preset])

  // Role badge color
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20'
      case 'manager':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      case 'receptionist':
        return 'bg-green-500/10 text-green-500 border-green-500/20'
      case 'staff':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">🚀 Universal Framework Explorer</h1>
        <p className="text-muted-foreground">
          Pick any preset to see a complete CRUD UI generated instantly from configuration
        </p>
        <Badge variant="outline" className="bg-gradient-to-r from-blue-500/10 to-purple-500/10">
          6 Tables • Infinite Entities • Zero Repetition
        </Badge>
      </div>

      {/* Controls */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration Explorer
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              See how presets drive the entire UI - forms, tables, validation, and permissions
            </p>
          </div>
          <Button variant="ghost" onClick={() => location.reload()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Reload
          </Button>
        </CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-4">
          {/* Preset Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Entity Preset
            </Label>
            <Select
              value={String(key)}
              onValueChange={v => setKey(v as keyof typeof entityPresets)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                {presetKeys.map(k => (
                  <SelectItem key={String(k)} value={String(k)}>
                    {entityPresets[k].labels?.plural ?? String(k)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Entity Type */}
          <div className="space-y-2">
            <Label>Entity Type</Label>
            <div className="rounded-md border p-3 text-sm bg-muted/30 font-mono">
              {preset.entity_type}
            </div>
          </div>

          {/* Current Role */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Your Role
            </Label>
            <div className="flex items-center gap-2">
              <Badge className={getRoleColor(userRole)}>{userRole}</Badge>
              <span className="text-xs text-muted-foreground">(affects visibility)</span>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Preset Stats
            </Label>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span>Fields:</span>
                <Badge variant="secondary" className="h-5 text-xs">
                  {stats.fields}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Relations:</span>
                <Badge variant="secondary" className="h-5 text-xs">
                  {stats.relationships}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span>Permissions:</span>
                <Badge
                  variant={stats.permissions ? 'default' : 'secondary'}
                  className="h-5 text-xs"
                >
                  {stats.permissions ? '✓' : '—'}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Preview Info */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold text-lg">
              ⚡ Live Preview: {preset.labels?.plural || preset.entity_type}
            </h3>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              This complete CRUD interface is generated automatically from the preset configuration.
              Try creating, editing, and viewing entities to see the universal framework in action.
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground mt-4">
              <span>✅ Auto-generated forms</span>
              <span>✅ Auto-generated tables</span>
              <span>✅ Role-based permissions</span>
              <span>✅ Dynamic validation</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Entity Page */}
      <EntityPage
        key={String(key)}
        preset={preset}
        userRole={userRole}
        title={`${preset.labels?.plural || preset.entity_type} (Live Demo)`}
        subtitle={`Generated from ${String(key)}_PRESET configuration • Role: ${userRole}`}
      />

      {/* Technical Details */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="text-lg">🔧 Technical Implementation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="font-semibold mb-2">What You're Seeing:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• EntityPage component reading preset configuration</li>
                <li>• Auto-generated EntityForm with validation</li>
                <li>• Auto-generated EntityTable with formatting</li>
                <li>• Universal API integration for CRUD operations</li>
                <li>• Role-based field and action visibility</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Universal Architecture:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• 6 sacred tables handle all data persistence</li>
                <li>• Dynamic fields stored in core_dynamic_data</li>
                <li>• Relationships in core_relationships</li>
                <li>• Smart codes provide business context</li>
                <li>• Zero schema changes for new entities</li>
              </ul>
            </div>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Implementation:</strong> This entire CRUD interface is generated from a single
              preset configuration. New entity types require only adding a preset - no custom forms,
              tables, or CRUD logic needed.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
