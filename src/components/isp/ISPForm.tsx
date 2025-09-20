// ISP Form Components
import React from 'react'

export function ISPInput(props: any) {
  return <input {...props} className="border rounded px-2 py-1" />
}

export function ISPSelect(props: any) {
  return <select {...props} className="border rounded px-2 py-1" />
}

export function ISPButton(props: any) {
  return <button {...props} className="bg-blue-500 text-white px-4 py-2 rounded" />
}

export function ISPForm({
  onSubmit,
  children
}: {
  onSubmit?: (data: any) => void
  children?: React.ReactNode
}) {
  return <form onSubmit={onSubmit}>{children}</form>
}
