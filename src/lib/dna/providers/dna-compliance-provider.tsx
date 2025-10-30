/**
 * HERA DNA Compliance Provider Component
 * Smart Code: HERA.DNA.PROVIDER.COMPLIANCE.V1
 */

import React, { createContext, useContext, ReactNode } from 'react'
import { useDnaCompliance, type DnaComplianceContextType } from '../hooks/use-dna-compliance'

const DnaComplianceContext = createContext<DnaComplianceContextType | undefined>(undefined)

export function DnaComplianceProvider({ 
  children, 
  componentSmartCode 
}: { 
  children: ReactNode
  componentSmartCode?: string 
}) {
  const {
    dnaStatus,
    violations,
    complianceScore,
    checkDnaCompliance,
    isCompliant
  } = useDnaCompliance(componentSmartCode)

  const contextValue: DnaComplianceContextType = {
    dnaStatus,
    complianceScore,
    violations,
    isCompliant,
    checkCompliance: checkDnaCompliance
  }

  return (
    <DnaComplianceContext.Provider value={contextValue}>
      {children}
    </DnaComplianceContext.Provider>
  )
}

export function useDnaComplianceContext(): DnaComplianceContextType {
  const context = useContext(DnaComplianceContext)
  if (context === undefined) {
    throw new Error('useDnaComplianceContext must be used within a DnaComplianceProvider')
  }
  return context
}