// ISP Modal Component
import React from 'react'

interface ISPModalProps {
  isOpen?: boolean
  onClose?: () => void
  title?: string
  children?: React.ReactNode
}

export function ISPModal({ isOpen = false, onClose, title = 'ISP Modal', children }: ISPModalProps) {
  return (
    <div>{children}</div>
  )
}