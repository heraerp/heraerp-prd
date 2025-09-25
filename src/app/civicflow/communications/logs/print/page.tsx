'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { format } from 'date-fns';
import { useCommLogs } from '@/hooks/use-communications';

function CommunicationsLogsPrintContent() {

  const searchParams = useSearchParams();
  const filters = Object.fromEntries(searchParams.entries());
  
  const { data: logsData } = useCommLogs(filters);
  
  useEffect(() => {
    // Auto-print when loaded
    if (logsData?.items?.length) {
      window.print();
    }
  }, [logsData]);
  
  
return (
    <div className="print:text-black print:bg-white p-8">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            size: A4;
            margin: 1cm;
          }
        }
      ` }} />
      
      {/* Header */}
      <div className="mb-6 pb-4 border-b">
        <h1 className="text-2xl font-bold mb-2">Communications Audit Log</h1>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Generated: {format(new Date(), 'PPpp')}</p>
          <p>Organization: CivicFlow Demo</p>
          {filters.date_from && <p>From: {format(new Date(filters.date_from), 'PP')}</p>}
          {filters.date_to && <p>To: {format(new Date(filters.date_to), 'PP')}</p>}
        </div>
      </div>
      
      {/* Logs Table */}
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="text-left py-2">Timestamp</th>
            <th className="text-left py-2">Event</th>
            <th className="text-left py-2">Entity</th>
            <th className="text-left py-2">Details</th>
            <th className="text-left py-2">User</th>
          </tr>
        </thead>
        <tbody>
          {logsData?.items?.map((log: any) => (
            <tr key={log.id} className="border-b">
              <td className="py-2">
                {format(new Date(log.created_at), 'MMM d, h:mm a')}
              </td>
              <td className="py-2">{log.transaction_type}</td>
              <td className="py-2">{log.entity_name || log.entity_code}</td>
              <td className="py-2 max-w-xs truncate">
                {JSON.stringify(log.metadata || {})}
              </td>
              <td className="py-2">{log.created_by || 'System'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Footer */}
      <div className="mt-8 pt-4 border-t text-xs text-gray-600">
        <p>Total Records: {logsData?.total || 0}</p>
        <p className="mt-2">
          This is an official audit log generated from CivicFlow Communications.
          All timestamps are in the local timezone.
        </p>
      </div>
    </div>
  );

}

export default function CommunicationsLogsPrintPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <CommunicationsLogsPrintContent />
    </Suspense>
  )
}