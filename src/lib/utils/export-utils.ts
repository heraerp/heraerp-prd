/**
 * Export utility functions
 */

export function generateCSV(data: any[], headers: string[]): string {
  if (!data || data.length === 0) {
    return headers.join(',')
  }

  // Create CSV header
  const csvHeader = headers.join(',')

  // Create CSV rows
  const csvRows = data.map(row => {
    return headers
      .map(header => {
        const value = row[header]

        // Handle null/undefined
        if (value === null || value === undefined) {
          return ''
        }

        // Handle arrays
        if (Array.isArray(value)) {
          return `"${value.join('; ')}"`
        }

        // Handle strings with commas or quotes
        const stringValue = String(value)
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }

        return stringValue
      })
      .join(',')
  })

  return [csvHeader, ...csvRows].join('\n')
}

export function generateExcelBuffer(data: any[], headers: string[]): ArrayBuffer {
  // For now, just return CSV as Excel can open it
  // In production, you'd use a library like xlsx
  const csv = generateCSV(data, headers)
  const encoder = new TextEncoder()
  return encoder.encode(csv).buffer
}
