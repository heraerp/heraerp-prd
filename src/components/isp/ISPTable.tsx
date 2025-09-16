// ISP Table Component
import React from 'react'

interface ISPTableProps {
  data?: any[]
  columns?: any[]
}

export function ISPTable({ data = [], columns = [] }: ISPTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <tbody>
          {data.map((row, i) => (
            <tr key={i}>
              <td>ISP Table Row</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}