// src/ui/components/CardKpi.tsx
import React from 'react';

export function CardKpi({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl border p-4 shadow-sm ${onClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
    >
      <div className="text-xs uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
      {hint && <div className="mt-1 text-xs text-gray-500">{hint}</div>}
    </div>
  );
}