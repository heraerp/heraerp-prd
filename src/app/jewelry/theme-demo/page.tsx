'use client'
import React from 'react'
import { JewelryThemeShowcase } from '@/components/jewelry/JewelryThemeShowcase'

export default function JewelryThemeDemoPage() {
  return (
    <JewelryThemeShowcase 
      title="HERA Jewelry Theme Demo"
      showAllFeatures={true}
    />
  )
}