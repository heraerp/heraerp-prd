import React from "react";

export const Toolbar: React.FC = () => {
  return (
    <div className="flex items-center gap-2 p-3 border-b border-[var(--border)] bg-[var(--surface-raised)]">
      <input
        type="search"
        placeholder="Search accounts…"
        className="w-full rounded-lg px-3 py-2 bg-[var(--surface-bg)] border border-[var(--border)] outline-none focus:ring-2 focus:ring-[var(--focus)]"
        aria-label="Search accounts"
      />
      <button className="px-3 py-2 rounded-lg bg-[var(--accent)] text-[var(--accent-fg)] font-medium hover:opacity-90">
        Add Account
      </button>
      <button className="px-3 py-2 rounded-lg bg-transparent text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-bg)]">
        Import
      </button>
      <button className="px-3 py-2 rounded-lg bg-transparent text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--surface-bg)]">
        Export
      </button>
    </div>
  );
};
