

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  useOrgProfile,
  useOrgOverview,
  useOrgContacts,
  useOrgFunding,
  useOrgEvents
} from '@/hooks/use-organizations'
import { format } from 'date-fns'
import { Building2, Globe, Mail, Phone, MapPin, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function OrganizationPrintPage() {
  const params = useParams()
  const orgId = params.id as string

  const { data: profile } = useOrgProfile(orgId)
  const { data: overview } = useOrgOverview(orgId)
  const { data: contacts } = useOrgContacts(orgId)
  const { data: funding } = useOrgFunding(orgId)
  const { data: events } = useOrgEvents(orgId)

  useEffect(() => {
    // Auto-print when page loads
    const timer = setTimeout(() => {
      window.print()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading organization profile...</p>
      </div>
    )
  }

  return (
    <div className="print:m-0 p-8 max-w-[210mm] mx-auto">
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 15mm;
          }
          .no-print {
            display: none !important;
          }
          .page-break {
            page-break-before: always;
          }
        }
      `}</style>

      {/* Header */}
      <div className="border-b-2 border-gray-200 pb-4 mb-6">
        <h1 className="text-3xl font-bold mb-2">{profile.entity_name}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Organization Profile</span>
          <span>{'\u2022'}</span>
          <span>{format(new Date(), 'MMMM d, yyyy')}</span>
        </div>
      </div>

      {/* Basic Information */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Entity Code</p>
            <p className="font-medium">{profile.entity_code}</p>
          </div>
          <div>
            <p className="text-gray-600">Type</p>
            <p className="font-medium capitalize">{profile.type || 'Organization'}</p>
          </div>
          <div>
            <p className="text-gray-600">Status</p>
            <p className="font-medium capitalize">{profile.status || 'Active'}</p>
          </div>
          {profile.manager && (
            <div>
              <p className="text-gray-600">Relationship Manager</p>
              <p className="font-medium">{profile.manager.user_name}</p>
            </div>
          )}
          {profile.engagement && (
            <>
              <div>
                <p className="text-gray-600">Engagement Stage</p>
                <p className="font-medium">{profile.engagement.stage}</p>
              </div>
              <div>
                <p className="text-gray-600">Engagement Score</p>
                <p className="font-medium">{profile.engagement.score}/100</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Contact Information */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 border-b pb-2">Contact Information</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          {profile.website && (
            <div>
              <p className="text-gray-600">Website</p>
              <p className="font-medium">{profile.website}</p>
            </div>
          )}
          {profile.primary_contact?.email && (
            <div>
              <p className="text-gray-600">Primary Email</p>
              <p className="font-medium">{profile.primary_contact.email}</p>
            </div>
          )}
          {profile.primary_contact?.phone && (
            <div>
              <p className="text-gray-600">Primary Phone</p>
              <p className="font-medium">{profile.primary_contact.phone}</p>
            </div>
          )}
          {profile.address && (
            <div className="col-span-2">
              <p className="text-gray-600">Address</p>
              <p className="font-medium">{profile.address}</p>
            </div>
          )}
        </div>
      </section>

      {/* Key Metrics */}
      {overview?.kpis && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Key Metrics</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded p-3">
              <p className="text-gray-600 text-sm">Programs Enrolled</p>
              <p className="text-2xl font-bold">{overview.kpis.programs_enrolled}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-gray-600 text-sm">Events Attended</p>
              <p className="text-2xl font-bold">{overview.kpis.total_events_attended}</p>
            </div>
            <div className="border rounded p-3">
              <p className="text-gray-600 text-sm">Total Funding</p>
              <p className="text-2xl font-bold">
                ${overview.kpis.total_funding_received.toLocaleString()}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Contacts */}
      {contacts && contacts.data.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Organization Contacts</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Phone</th>
              </tr>
            </thead>
            <tbody>
              {contacts.data.map(contact => (
                <tr key={contact.id} className="border-b">
                  <td className="py-2">
                    {contact.constituent_name}
                    {contact.is_primary && ' \u2605'}
                  </td>
                  <td className="py-2">{contact.role}</td>
                  <td className="py-2">{contact.email || '-'}</td>
                  <td className="py-2">{contact.phone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Active Funding */}
      {funding && funding.data.filter(g => g.status === 'active').length > 0 && (
        <section className="mb-8 page-break">
          <h2 className="text-xl font-semibold mb-4 border-b pb-2">Active Funding</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Grant Name</th>
                <th className="text-left py-2">Funder</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Period</th>
              </tr>
            </thead>
            <tbody>
              {funding.data
                .filter(g => g.status === 'active')
                .map(grant => (
                  <tr key={grant.id} className="border-b">
                    <td className="py-2">{grant.grant_name}</td>
                    <td className="py-2">{grant.funder_name}</td>
                    <td className="py-2">${grant.amount_awarded.toLocaleString()}</td>
                    <td className="py-2">
                      {format(new Date(grant.start_date), 'MMM yyyy')} -
                      {format(new Date(grant.end_date), 'MMM yyyy')}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Footer */}
      <div className="mt-12 pt-4 border-t text-xs text-gray-600 text-center">
        <p>This document was generated from CivicFlow CRM</p>
        <p>Printed on {format(new Date(), 'MMMM d, yyyy h:mm a')}</p>
      </div>
    </div>
  )
}
