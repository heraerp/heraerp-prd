import React from "react";

export const DetailPanel: React.FC = () => {
  return (
    <div className="p-4">
      <h3 className="text-base font-semibold mb-2">Account Details</h3>
      <div className="space-y-2 text-sm text-[var(--text-secondary)]">
        <div><span className="text-[var(--text-muted)]">Account #:</span> —</div>
        <div><span className="text-[var(--text-muted)]">Normal Balance:</span> —</div>
        <div><span className="text-[var(--text-muted)]">IFRS Tags:</span> —</div>
      </div>
      <h4 className="mt-4 text-sm font-medium">Audit Trail</h4>
      <div className="mt-2 rounded-lg border border-[var(--border)] p-2 bg-[var(--surface-alt)] text-xs text-[var(--text-secondary)]">
        No history yet.
      </div>
    </div>
  );
};
