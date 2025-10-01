// app/examples/transactions/[id]/page.tsx - Transaction detail page
'use client';
import React from 'react';
import { ObjectHeader, LinesTable, RelatedPanel, useTransaction } from '@/ui';
import { useRouter } from 'next/navigation';

export default function TransactionDetail({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data, isLoading } = useTransaction(params.id, true);
  
  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Transaction not found</h3>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <button
        onClick={() => router.back()}
        className="mb-4 text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
      >
        ← Back to list
      </button>

      <ObjectHeader
        title={
          <>
            {data.transaction_type?.charAt(0).toUpperCase() + data.transaction_type?.slice(1)} 
            {' · '}
            {data.reference_number || data.id.slice(0, 8)}
          </>
        }
        subtitle={
          <div className="space-y-1">
            <div>{new Date(data.transaction_date).toLocaleString()}</div>
            {data.smart_code && (
              <div className="font-mono text-xs text-gray-500">{data.smart_code}</div>
            )}
          </div>
        }
        tags={[
          data.status,
          data.transaction_currency_code,
          data.fiscal_year && `FY${data.fiscal_year}`,
          data.fiscal_period && `P${data.fiscal_period}`
        ].filter(Boolean)}
        right={
          <div className="text-right">
            <div className="text-2xl font-bold">
              {formatAmount(data.total_amount, data.transaction_currency_code)}
            </div>
            {data.exchange_rate && (
              <div className="text-sm text-gray-600">
                Rate: {data.exchange_rate}
              </div>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Lines */}
          {data.lines && data.lines.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Line Items</h3>
              <LinesTable rows={data.lines} />
            </div>
          )}

          {/* Metadata */}
          {data.metadata && Object.keys(data.metadata).length > 0 && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Additional Information</h3>
              <dl className="grid grid-cols-2 gap-2 text-sm">
                {Object.entries(data.metadata).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-gray-500">{key}:</dt>
                    <dd className="font-medium">{JSON.stringify(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        <div className="space-y-4">
          {/* Related Entities */}
          {data.source_entity_id && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Source Entity</h3>
              <div className="text-sm text-gray-900">{data.source_entity_id}</div>
            </div>
          )}

          {data.target_entity_id && (
            <div className="bg-white rounded-xl border p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Target Entity</h3>
              <div className="text-sm text-gray-900">{data.target_entity_id}</div>
            </div>
          )}

          {/* Relationships Panel */}
          <RelatedPanel fromId={data.source_entity_id} toId={data.target_entity_id} />
        </div>
      </div>
    </div>
  );
}