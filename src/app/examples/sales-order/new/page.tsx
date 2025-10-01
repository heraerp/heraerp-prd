// app/examples/sales-order/new/page.tsx
'use client';
import React from 'react';
import { WizardForm } from '@/ui';
import { useRouter } from 'next/navigation';

export default function NewSalesOrderPage() {
  const router = useRouter();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="text-sm text-gray-600 hover:text-gray-900 flex items-center gap-1"
        >
          ← Back
        </button>
      </div>

      <h1 className="mb-4 text-2xl font-bold">New Sales Order</h1>
      
      <div className="bg-white rounded-xl border p-6">
        <WizardForm smartCode="HERA.RETAIL.SALES.TXN.SORDER.V1" />
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Smart Code Configuration</h3>
        <p className="text-sm text-blue-700 mb-2">
          The wizard automatically loads form configuration based on the Smart Code:
        </p>
        <code className="block bg-white px-3 py-2 rounded text-xs font-mono">
          HERA.RETAIL.SALES.TXN.SORDER.V1
        </code>
        <p className="text-sm text-blue-700 mt-2">
          If no UCR form spec exists, it uses sensible defaults. The form posts to your
          existing transaction API with full Finance DNA support.
        </p>
      </div>
    </div>
  );
}