// src/ui/components/DataTable.tsx
import React from 'react';

type Col<T> = { key: keyof T | string; header: string; width?: string; render?: (row: T) => React.ReactNode };
export function DataTable<T extends { id?: string | number }>({
  rows,
  columns,
  loading,
  onRowClick,
  empty = 'No data',
}: {
  rows: T[] | undefined;
  columns: Col<T>[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  empty?: string;
}) {
  if (loading) return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  if (!rows || rows.length === 0) return <div className="p-6 text-sm text-gray-500">{empty}</div>;

  return (
    <div className="overflow-auto rounded-xl border border-gray-200">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((c, i) => (
              <th key={i} className="px-4 py-3 text-left font-medium text-gray-600" style={{ width: c.width }}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((r, i) => (
            <tr
              key={(r.id as any) ?? i}
              className={onRowClick ? 'hover:bg-gray-50 cursor-pointer' : undefined}
              onClick={() => onRowClick?.(r)}
            >
              {columns.map((c, j) => (
                <td key={j} className="px-4 py-3 text-gray-900">
                  {c.render ? c.render(r) : (r as any)[c.key as any]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}