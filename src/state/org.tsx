"use client";

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { getOrgId, setOrgId } from '@/lib/api-client';
import type { OrgId } from '@/types/common';

interface OrgState {
  currentOrgId: OrgId | null;
  isHydrated: boolean;
  setCurrentOrgId: (orgId: OrgId | null) => void;
  hydrate: () => void;
}

export const useOrgStore = create<OrgState>()(
  subscribeWithSelector((set, get) => ({
    currentOrgId: null,
    isHydrated: false,

    setCurrentOrgId: (orgId: OrgId | null) => {
      // Update Zustand state
      set({ currentOrgId: orgId });
      
      // Persist to localStorage
      setOrgId(orgId);
    },

    hydrate: () => {
      if (typeof window !== 'undefined') {
        const storedOrgId = getOrgId();
        set({ 
          currentOrgId: storedOrgId,
          isHydrated: true 
        });
      }
    },
  }))
);

// Hydrate on first load
if (typeof window !== 'undefined') {
  useOrgStore.getState().hydrate();
}