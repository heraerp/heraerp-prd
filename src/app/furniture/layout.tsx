// Force dynamic rendering for all furniture pages - skip SSG
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store' import React from 'react'
import FurnitureDarkLayout from '@/components/furniture/FurnitureDarkLayout'
import { FurnitureOrgProvider } from '@/components/furniture/FurnitureOrgContext'
import { FurnitureDarkThemeProvider } from '@/components/furniture/FurnitureDarkThemeProvider' export default function FurnitureLayout({ children }: { children: React.ReactNode }) { return ( <FurnitureDarkThemeProvider> <FurnitureDarkLayout> <FurnitureOrgProvider>{children}</FurnitureOrgProvider> </FurnitureDarkLayout> </FurnitureDarkThemeProvider> )
}
