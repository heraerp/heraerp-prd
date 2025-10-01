// app/examples/themed-layout.tsx - Example showing full provider setup
import { HeraProvider, HeraThemeProvider } from '@/ui';

export default function ThemedExampleLayout({ children }: { children: React.ReactNode }) {
  // In production, get orgId from session/auth context
  const orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID || 'demo-org-id';
  
  return (
    <HeraProvider orgId={orgId}>
      <HeraThemeProvider orgId={orgId}>
        <div className="min-h-screen bg-[color:rgb(var(--hera-bg)/1)] text-[color:rgb(var(--hera-text)/1)]">
          {children}
        </div>
      </HeraThemeProvider>
    </HeraProvider>
  );
}