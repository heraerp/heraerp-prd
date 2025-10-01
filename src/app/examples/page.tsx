// app/examples/page.tsx - Dashboard example with KPI cards
'use client';
import React from 'react';
import { CardKpi, useTransactions } from '@/ui';
import { useRouter } from 'next/navigation';

export default function ExampleDashboard() {
  const router = useRouter();
  
  // Load different transaction types
  const { data: pendingInvoices } = useTransactions({ 
    transaction_type: 'invoice', 
    status: 'pending',
    limit: 100 
  });
  
  const { data: completedOrders } = useTransactions({ 
    transaction_type: 'order', 
    status: 'completed',
    limit: 100 
  });
  
  const { data: allTransactions } = useTransactions({ 
    limit: 500 
  });

  const pendingCount = pendingInvoices?.length ?? 0;
  const completedCount = completedOrders?.length ?? 0;
  const totalCount = allTransactions?.length ?? 0;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CardKpi
          label="Pending Invoices"
          value={pendingCount}
          hint="Click to view"
          onClick={() => router.push('/examples/transactions?transaction_type=invoice&status=pending')}
        />
        
        <CardKpi
          label="Completed Orders"
          value={completedCount}
          hint="Last 30 days"
          onClick={() => router.push('/examples/transactions?transaction_type=order&status=completed')}
        />
        
        <CardKpi
          label="Total Transactions"
          value={totalCount}
          hint="All types"
          onClick={() => router.push('/examples/transactions')}
        />
        
        <CardKpi
          label="Active Entities"
          value="Loading..."
          hint="Customers, Vendors, etc."
          onClick={() => router.push('/examples/entities')}
        />
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">View Examples</h3>
          <ul className="space-y-1 text-sm text-blue-700">
            <li>• <a href="/examples/transactions" className="underline">Transaction Worklist</a></li>
            <li>• <a href="/examples/entities?type=customer" className="underline">Customer List</a></li>
            <li>• <a href="/examples/entities?type=product" className="underline">Product Catalog</a></li>
          </ul>
        </div>
        
        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-green-900 mb-2">Create Examples</h3>
          <ul className="space-y-1 text-sm text-green-700">
            <li>• <a href="/examples/sales-order/new" className="underline">New Sales Order</a></li>
            <li>• <a href="/examples/create-transaction" className="underline">Create Transaction (Any Type)</a></li>
            <li>• <a href="/examples/create-transaction?smart_code=HERA.FIN.AR.TXN.INV.V1" className="underline">New Invoice</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
}