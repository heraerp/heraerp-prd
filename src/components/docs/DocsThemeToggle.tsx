'use client';

import { HeraThemeToggle } from '@/components/universal/ui/HeraThemeProvider';

export function DocsThemeToggle() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <HeraThemeToggle className="docs-theme-toggle" />
    </div>
  );
}