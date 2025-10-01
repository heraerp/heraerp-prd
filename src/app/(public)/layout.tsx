import { ReactNode } from 'react'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Force dark mode for public pages */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // Force dark mode immediately
              document.documentElement.classList.add('dark');
              // Prevent theme changes
              if (typeof window !== 'undefined') {
                Object.defineProperty(window, '__theme', {
                  get: function() { return 'dark'; },
                  set: function() { return 'dark'; }
                });
              }
            })();
          `
        }}
      />
      {children}
    </>
  )
}
