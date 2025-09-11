// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { BusinessSetupWizard } from '@/components/wizard/BusinessSetupWizard'

export default function BusinessSetupWizardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
      <BusinessSetupWizard />
    </div>
  )
}

export const metadata = {
  title: 'HERA Business Setup Wizard',
  description: 'Configure your organization using HERA\'s Universal Configuration Rules'
}