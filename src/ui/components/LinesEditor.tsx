// src/ui/components/LinesEditor.tsx
import React from 'react';

export type TxnLine = {
  line_number: number;
  line_type: string;
  description: string;
  quantity: number;
  unit_amount: number;
  line_amount: number;
  smart_code?: string;
  account_id?: string;
  tax_code?: string;
  tax_amount?: number;
  discount_amount?: number;
};

export function LinesEditor({
  value,
  onChange,
  headerSmartCode,
}: {
  value: TxnLine[];
  onChange: (next: TxnLine[]) => void;
  headerSmartCode?: string;
}) {
  const add = () => {
    const next: TxnLine[] = [
      ...value,
      {
        line_number: value.length + 1,
        line_type: 'item',
        description: '',
        quantity: 1,
        unit_amount: 0,
        line_amount: 0,
        smart_code: headerSmartCode, // reasonable default
      },
    ];
    onChange(next);
  };

  const update = (idx: number, patch: Partial<TxnLine>) => {
    const next = value.map((l, i) => (i === idx ? { ...l, ...patch, line_amount: computeAmount({ ...l, ...patch }) } : l));
    onChange(next);
  };

  const remove = (idx: number) => {
    const next = value.filter((_, i) => i !== idx).map((l, i) => ({ ...l, line_number: i + 1 }));
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {value.map((l, i) => (
        <div key={i} className="grid grid-cols-12 items-end gap-2 rounded-xl border p-3">
          <div className="col-span-2">
            <label className="text-xs text-gray-600">Line Type</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2"
              value={l.line_type}
              onChange={(e) => update(i, { line_type: e.target.value })}
            />
          </div>
          <div className="col-span-4">
            <label className="text-xs text-gray-600">Description</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2"
              value={l.description}
              onChange={(e) => update(i, { description: e.target.value })}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-600">Qty</label>
            <input type="number" className="mt-1 w-full rounded-lg border px-3 py-2"
              value={l.quantity}
              onChange={(e) => update(i, { quantity: parseFloat(e.target.value || '0') })}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-600">Unit</label>
            <input type="number" className="mt-1 w-full rounded-lg border px-3 py-2"
              value={l.unit_amount}
              onChange={(e) => update(i, { unit_amount: parseFloat(e.target.value || '0') })}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-600">Amount</label>
            <div className="mt-1 w-full rounded-lg border bg-gray-50 px-3 py-2">{l.line_amount.toFixed(2)}</div>
          </div>

          <div className="col-span-3">
            <label className="text-xs text-gray-600">Line SmartCode (optional)</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2"
              value={l.smart_code ?? ''}
              onChange={(e) => update(i, { smart_code: e.target.value || undefined })}
              placeholder={headerSmartCode}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-600">Account (UUID)</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2"
              value={l.account_id ?? ''}
              onChange={(e) => update(i, { account_id: e.target.value || undefined })}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-600">Tax Code</label>
            <input className="mt-1 w-full rounded-lg border px-3 py-2"
              value={l.tax_code ?? ''}
              onChange={(e) => update(i, { tax_code: e.target.value || undefined })}
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-600">Tax Amount</label>
            <input type="number" className="mt-1 w-full rounded-lg border px-3 py-2"
              value={l.tax_amount ?? 0}
              onChange={(e) => update(i, { tax_amount: parseFloat(e.target.value || '0') || undefined })}
            />
          </div>
          <div className="col-span-3 text-right">
            <button type="button" onClick={() => remove(i)} className="rounded-lg border px-3 py-2 text-sm">
              Remove
            </button>
          </div>
        </div>
      ))}

      <button type="button" onClick={add} className="rounded-xl border px-4 py-2 text-sm">
        + Add Line
      </button>
    </div>
  );
}

function computeAmount(l: Partial<TxnLine>) {
  const q = Number.isFinite(l.quantity as any) ? (l.quantity as number) : 0;
  const u = Number.isFinite(l.unit_amount as any) ? (l.unit_amount as number) : 0;
  return q * u;
}