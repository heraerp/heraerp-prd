import { jsonLdScript, canonical } from '@/lib/seo'
import PartnerApplyForm from '@/components/partners/PartnerApplyForm'

export const metadata = {
  title: 'Apply to become a HERA Partner | Partner Application',
  description:
    'Join the HERA partner ecosystem. Apply in minutes and our team will review your application for regional and industry fit.',
  alternates: { canonical: canonical('/partners/apply') }
}

export default function ApplyPartnerPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Who can apply to become a HERA partner?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Consultancies, agencies, and integrators with ERP/CRM experience and regional presence.'
        }
      },
      {
        '@type': 'Question',
        name: 'What information do I need to provide?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Company details, regions served, industry focus, and two relevant client references.'
        }
      },
      {
        '@type': 'Question',
        name: 'How long does review take?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Initial screening typically completes within a few business days.'
        }
      },
      {
        '@type': 'Question',
        name: 'Is there a fee to apply?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Approved partners may choose enablement packages based on modules selected.'
        }
      },
      {
        '@type': 'Question',
        name: 'Which regions are you prioritizing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'UK, EU, and GCC regions currently have the highest priority.'
        }
      }
    ]
  }

  return (
    <>
      {jsonLdScript(faqJsonLd)}
      <PartnerApplyForm />
    </>
  )
}
