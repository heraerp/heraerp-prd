// ================================================================================
// HERA DNA UI - SCROLL AREA COMPONENT
// Smart Code: HERA.DNA.UI.SCROLL.AREA.V1
// ScrollArea with enhanced visible scrollbars for dark mode
// ================================================================================

import React from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface ScrollAreaDNAProps {
  children: React.ReactNode
  className?: string
  height?: string | number
  width?: string | number
}

export function ScrollAreaDNA({
  children,
  className,
  height = "h-96",
  width = "w-full"
}: ScrollAreaDNAProps) {
  const heightClass = typeof height === 'number' ? `h-[${height}px]` : height
  const widthClass = typeof width === 'number' ? `w-[${width}px]` : width

  return (
    <ScrollArea 
      className={cn(
        heightClass,
        widthClass,
        "pr-2",
        "enhanced-scrollbar",
        className
      )}
    >
      {children}
    </ScrollArea>
  )
}

// Add this CSS to globals.css or create a separate CSS module
export const scrollAreaStyles = `
/* Enhanced scrollbar for HERA DNA ScrollArea */
.enhanced-scrollbar::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.enhanced-scrollbar::-webkit-scrollbar-track {
  background: #f1f5f9;
  border-radius: 6px;
  margin: 4px 0;
}

.enhanced-scrollbar::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border-radius: 6px;
  border: 2px solid #f1f5f9;
  transition: background 0.2s;
}

.enhanced-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #64748b;
}

.dark .enhanced-scrollbar::-webkit-scrollbar-track {
  background: #1e293b;
  border: 1px solid #334155;
}

.dark .enhanced-scrollbar::-webkit-scrollbar-thumb {
  background: #64748b;
  border: 2px solid #1e293b;
}

.dark .enhanced-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}

/* Firefox scrollbar support */
.enhanced-scrollbar {
  scrollbar-width: thin;
  scrollbar-color: #94a3b8 #f1f5f9;
}

.dark .enhanced-scrollbar {
  scrollbar-color: #64748b #1e293b;
}
`