import React from "react";
import { Toolbar } from "./components/Toolbar";
import { TreeGrid } from "./components/TreeGrid";
import { DetailPanel } from "./components/DetailPanel";
import { EditModal } from "./components/EditModal";
import { ConfirmModal } from "./components/ConfirmModal";

export default function ChartOfAccounts() {
  return (
    <div className="grid grid-cols-[1fr_360px] gap-4 p-4">
      <section className="rounded-2xl bg-[var(--surface-alt)] shadow-[var(--shadow)] border border-[var(--border)] overflow-hidden">
        <Toolbar />
        <TreeGrid />
      </section>
      <aside className="rounded-2xl bg-[var(--surface-raised)] shadow-[var(--shadow)] border border-[var(--border)]">
        <DetailPanel />
      </aside>
      <EditModal />
      <ConfirmModal />
    </div>
  );
}
