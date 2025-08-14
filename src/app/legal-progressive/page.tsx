import ComingSoon from '@/components/shared/ComingSoon'

export default function LegalPage() {
  return (
    <ComingSoon
      title="Legal Practice Management"
      description="Complete law firm management with case tracking, time billing, and document management"
      estimatedDate="Q2 2025"
      gradient="from-amber-500 to-yellow-600"
      features={[
        'Case & matter management',
        'Time tracking & billing',
        'Document management & automation',
        'Client portal & communication',
        'Court calendar integration',
        'Trust accounting compliance',
        'Conflict checking system',
        'Legal research integration'
      ]}
    />
  )
}