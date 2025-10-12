import React from "react";
import { ThemeProvider } from "../../ui/theme/ThemeProvider";
import { salonLuxe } from "../../ui/theme/presets/salonLuxe";
import ChartOfAccounts from "../../features/accounts/ChartOfAccounts";

export default function SalonAccountsPage() {
  return (
    <ThemeProvider tokens={salonLuxe}>
      <ChartOfAccounts />
    </ThemeProvider>
  );
}
