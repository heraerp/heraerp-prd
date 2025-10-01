'use client'

// src/ui/HeraProvider.tsx
import React, { createContext, useContext, useMemo } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

type HeraContextValue = {
  orgId: string;
  apiBase?: string; // default: /api/v1
};

const HeraContext = createContext<HeraContextValue | null>(null);

export function useHeraContext() {
  const ctx = useContext(HeraContext);
  if (!ctx) throw new Error('useHeraContext must be used within <HeraProvider>');
  return ctx;
}

export function HeraProvider({
  orgId,
  apiBase = '/api/v1',
  children,
}: React.PropsWithChildren<{ orgId: string; apiBase?: string }>) {
  const [client] = React.useState(() => new QueryClient());
  const value = useMemo(() => ({ orgId, apiBase }), [orgId, apiBase]);

  return (
    <HeraContext.Provider value={value}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </HeraContext.Provider>
  );
}