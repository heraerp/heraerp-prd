import { Inter } from 'next/font/google'
import './docs.css'
import { DocsThemeToggle } from '@/components/docs/DocsThemeToggle'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'HERA Documentation',
  description: 'Enterprise Resource Planning with Universal Architecture'
}

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`docs-container ${inter.className}`}>
      <DocsThemeToggle />
      {children}
    </div>
  )
}
