'use client'

import React from 'react'

interface MenuManagementProps {
  organizationId: string
  smartCodes: Record<string, string>
  isDemoMode?: boolean
}

export function MenuManagement({ 
  organizationId, 
  smartCodes,
  isDemoMode = false 
}: MenuManagementProps) {
  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Menu Management</h2>
      <p className="text-muted-foreground">Manage menu items, categories, and pricing</p>
    </div>
  )
}