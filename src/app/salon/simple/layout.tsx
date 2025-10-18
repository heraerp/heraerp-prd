/**
 * Simple Layout - No Auth Providers
 * Bypasses all complex authentication
 */

export default function SimpleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}