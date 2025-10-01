// app/examples/entities/page.tsx - Entity list with type filter
'use client';
import React, { Suspense } from 'react';
import { DataTable, useEntities } from '@/ui';
import { useRouter, useSearchParams } from 'next/navigation';

function EntityList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const type = searchParams.get('type') || 'customer';
  
  const { data, isLoading } = useEntities(type);

  const entityTypes = [
    { value: 'customer', label: 'Customers' },
    { value: 'vendor', label: 'Vendors' },
    { value: 'product', label: 'Products' },
    { value: 'employee', label: 'Employees' },
    { value: 'gl_account', label: 'GL Accounts' },
    { value: 'location', label: 'Locations' },
    { value: 'project', label: 'Projects' },
  ];

  const handleTypeChange = (newType: string) => {
    router.push(`/examples/entities?type=${newType}`);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold capitalize">{type} List</h2>
        <p className="text-gray-600 mt-1">Manage your {type} entities</p>
      </div>

      <div className="mb-4">
        <select
          value={type}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="rounded-lg border px-4 py-2"
        >
          {entityTypes.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <DataTable
        rows={data ?? []}
        loading={isLoading}
        onRowClick={(row: any) => router.push(`/examples/entities/${row.id}`)}
        columns={[
          { 
            header: 'Code', 
            key: 'entity_code',
            width: '120px',
            render: (row) => row.entity_code || '-'
          },
          { 
            header: 'Name', 
            key: 'entity_name',
            render: (row) => (
              <div>
                <div className="font-medium">{row.entity_name}</div>
                {row.entity_description && (
                  <div className="text-xs text-gray-500 truncate max-w-md">
                    {row.entity_description}
                  </div>
                )}
              </div>
            )
          },
          { 
            header: 'Smart Code', 
            key: 'smart_code',
            render: (row) => row.smart_code ? (
              <code className="text-xs bg-gray-100 px-2 py-0.5 rounded">
                {row.smart_code}
              </code>
            ) : '-'
          },
          { 
            header: 'Created', 
            key: 'created_at',
            width: '150px',
            render: (row) => new Date(row.created_at).toLocaleDateString()
          },
        ]}
      />
    </div>
  );
}

function EntitiesContent() {

  
return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <EntityList />
    </Suspense>
  );

}

export default function EntitiesPage() {
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
      <EntitiesContent />
    </Suspense>
  )
}