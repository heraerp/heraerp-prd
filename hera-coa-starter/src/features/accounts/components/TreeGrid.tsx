import React from "react";

/**
 * Skeleton TreeGrid (theme-agnostic). Replace data layer with real hooks.
 * ARIA roles prepared for accessibility.
 */
export const TreeGrid: React.FC = () => {
  const rows = [
    { id: "1", depth: 0, title: "Assets", number: "1", balance: "Dr", status: "Active" },
    { id: "1.1", depth: 1, title: "Property, plant and equipment", number: "1.1", balance: "Dr", status: "Active" },
    { id: "1.1.1", depth: 2, title: "Land and land improvements", number: "1.1.1", balance: "Dr", status: "Active" },
  ];

  return (
    <div role="treegrid" aria-label="Chart of Accounts" className="max-h-[70vh] overflow-auto">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-[var(--surface-raised)]">
          <tr className="text-left">
            <th className="px-3 py-2">Account Title</th>
            <th className="px-3 py-2 w-36">Account #</th>
            <th className="px-3 py-2 w-20">Depth</th>
            <th className="px-3 py-2 w-28">Balance</th>
            <th className="px-3 py-2 w-28">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, idx) => (
            <tr key={r.id} role="row" className={idx % 2 ? "bg-[var(--surface-bg)]" : "bg-[var(--surface-alt)]"}>
              <td className="px-3 py-2">
                <div style={{ paddingLeft: r.depth * 16 }} className="flex items-center gap-2">
                  <button aria-label="Toggle" className="w-5 h-5 rounded border border-[var(--border)] bg-transparent" />
                  <span>{r.title}</span>
                </div>
              </td>
              <td className="px-3 py-2 tabular-nums">{r.number}</td>
              <td className="px-3 py-2">{r.depth}</td>
              <td className="px-3 py-2">
                <span className="text-[var(--debit)] font-medium">{r.balance}</span>
              </td>
              <td className="px-3 py-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-[var(--surface-bg)] border border-[var(--border)] text-[var(--text-secondary)]">
                  {r.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
