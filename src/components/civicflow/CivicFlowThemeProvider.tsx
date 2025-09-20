'use client';

import { createContext, useContext, useEffect, useState } from 'react';

export type CivicFlowTheme = 'civic-navy' | 'civic-light' | 'civic-indigo' | 'emerald-slate' | 'royal-iris';

interface CivicFlowThemeContextType {
  theme: CivicFlowTheme;
  setTheme: (theme: CivicFlowTheme) => void;
}

const CivicFlowThemeContext = createContext<CivicFlowThemeContextType | undefined>(undefined);

export function CivicFlowThemeProvider({ 
  children,
  defaultTheme = 'civic-navy'
}: { 
  children: React.ReactNode;
  defaultTheme?: CivicFlowTheme;
}) {
  const [theme, setTheme] = useState<CivicFlowTheme>(defaultTheme);

  useEffect(() => {
    // Load theme from localStorage on mount
    const savedTheme = localStorage.getItem('civicflow-theme') as CivicFlowTheme;
    if (savedTheme && ['civic-navy', 'civic-light', 'civic-indigo', 'emerald-slate', 'royal-iris'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.setAttribute('data-theme', theme);
    // Save to localStorage
    localStorage.setItem('civicflow-theme', theme);
  }, [theme]);

  return (
    <CivicFlowThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </CivicFlowThemeContext.Provider>
  );
}

export function useCivicFlowTheme() {
  const context = useContext(CivicFlowThemeContext);
  if (context === undefined) {
    throw new Error('useCivicFlowTheme must be used within a CivicFlowThemeProvider');
  }
  return context;
}