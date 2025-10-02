'use client'

import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useUniversalEntity } from '@/hooks/useUniversalEntity'
import { CERTIFICATE_PRESET, GRADING_JOB_PRESET } from '@/hooks/entityPresets'
import { useToast } from '@/components/ui/use-toast'
import '@/styles/jewelry-glassmorphism.css'

const schema = z.object({
  cert_number: z.string().min(1),
  issuer: z.string().min(1),
  issue_date: z.coerce.date(),
  pdf_url: z.string().url().optional()
})

export default function IssueCertificateModal({
  open,
  onClose,
  jobId
}: {
  open: boolean
  onClose: () => void
  jobId: string
}) {
  const { toast } = useToast()
  const certHook = useUniversalEntity({
    entity_type: CERTIFICATE_PRESET.entity_type,
    dynamicFields: CERTIFICATE_PRESET.dynamicFields,
    relationships: CERTIFICATE_PRESET.relationships,
    filters: { include_dynamic: true, limit: 1 }
  })
  const jobHook = useUniversalEntity({
    entity_type: GRADING_JOB_PRESET.entity_type,
    dynamicFields: GRADING_JOB_PRESET.dynamicFields,
    relationships: GRADING_JOB_PRESET.relationships,
    filters: { include_dynamic: true, limit: 1 }
  })

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { issue_date: new Date() as any }
  })

  const onSubmit = async (v: z.infer<typeof schema>) => {
    try {
      const res: any = await certHook.create({
        entity_type: CERTIFICATE_PRESET.entity_type,
        entity_name: `CERT ${v.cert_number}`,
        smart_code: 'HERA.JEWELRY.CERT.ENTITY.DOCUMENT.v1',
        dynamic_fields: {
          cert_number: {
            value: v.cert_number,
            type: 'text',
            smart_code: 'HERA.JEWELRY.CERT.DYN.NUMBER.v1'
          },
          issuer: { value: v.issuer, type: 'text', smart_code: 'HERA.JEWELRY.CERT.DYN.ISSUER.v1' },
          issue_date: {
            value: v.issue_date.toISOString(),
            type: 'date',
            smart_code: 'HERA.JEWELRY.CERT.DYN.ISSUE_DATE.v1'
          },
          ...(v.pdf_url
            ? {
                pdf_url: {
                  value: v.pdf_url,
                  type: 'text',
                  smart_code: 'HERA.JEWELRY.CERT.DYN.PDF_URL.v1'
                }
              }
            : {})
        }
      })
      const certId: string | undefined = res?.id || res?.data?.id
      if (certId) {
        await jobHook.link(jobId, 'ISSUES_CERT', [certId])
        await certHook.link(certId, 'FOR_JOB', [jobId])
      }
      toast({ title: 'Certificate issued', description: `Certificate ${v.cert_number} linked` })
      onClose()
    } catch (e: any) {
      toast({
        title: 'Issue failed',
        description: e?.message || 'Unable to issue certificate',
        variant: 'destructive'
      })
    }
  }

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
      <div className="w-full max-w-lg rounded-2xl p-6 jewelry-glass-panel">
        <h3 className="text-lg font-semibold mb-4">Issue Certificate</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label>Certificate #</label>
            <input {...register('cert_number')} className="w-full rounded-xl p-2 bg-white/10" />
            {errors.cert_number && (
              <p className="text-red-400 text-sm">{errors.cert_number.message}</p>
            )}
          </div>
          <div>
            <label>Issuer</label>
            <input {...register('issuer')} className="w-full rounded-xl p-2 bg-white/10" />
            {errors.issuer && <p className="text-red-400 text-sm">{errors.issuer.message}</p>}
          </div>
          <div>
            <label>Issue Date</label>
            <input
              type="date"
              {...register('issue_date')}
              className="w-full rounded-xl p-2 bg-white/10"
            />
            {errors.issue_date && (
              <p className="text-red-400 text-sm">{errors.issue_date.message as any}</p>
            )}
          </div>
          <div>
            <label>PDF URL (optional)</label>
            <input {...register('pdf_url')} className="w-full rounded-xl p-2 bg-white/10" />
            {errors.pdf_url && <p className="text-red-400 text-sm">{errors.pdf_url.message}</p>}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="px-3 py-2 rounded-xl bg-white/10">
              Cancel
            </button>
            <button
              disabled={certHook.isCreating}
              className="px-4 py-2 rounded-xl jewelry-btn-primary"
            >
              Issue
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
