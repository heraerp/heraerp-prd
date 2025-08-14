import ComingSoon from '@/components/shared/ComingSoon'

export default function ManufacturingPage() {
  return (
    <ComingSoon
      title="Manufacturing ERP"
      description="Complete manufacturing operations with production planning, quality control, and supply chain management"
      estimatedDate="Q2 2025"
      gradient="from-gray-500 to-slate-600"
      features={[
        'Production planning & scheduling',
        'Bill of Materials (BOM) management',
        'Quality control & inspection',
        'Supply chain optimization',
        'Equipment maintenance scheduling',
        'Real-time production tracking',
        'Cost analysis & reporting',
        'Inventory & warehouse management'
      ]}
    />
  )
}