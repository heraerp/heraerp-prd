'use client'
import { useEffect, useState } from 'react'
import { isClient } from './env'
export function useOrgId() {
  const [orgId, setOrgId] = useState<string>('')
  useEffect(() => {
    if (isClient) setOrgId(localStorage.getItem('orgId') ?? '')
  }, [])
  return orgId
}
