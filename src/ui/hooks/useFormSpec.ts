// src/ui/hooks/useFormSpec.ts
import { useQuery } from '@tanstack/react-query';
import { useHeraContext } from '../HeraProvider';

export type HeraField =
  | { name: string; label: string; type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'textarea'; required?: boolean; placeholder?: string; options?: { value: string; label: string }[]; section?: 'header' | 'line' | 'meta' }
  | { name: string; label: string; type: 'currency'; required?: boolean; section?: 'header' };

export type HeraFormStep = { id: string; title: string; description?: string; fields: HeraField[] };

export type HeraFormSpec = {
  smart_code: string;
  transaction_type?: string;     // optional – server can infer from smart_code
  title: string;
  steps: HeraFormStep[];
  defaults?: Record<string, any>;
};

export function useFormSpec(smartCode: string) {
  const { orgId, apiBase } = useHeraContext();

  return useQuery({
    queryKey: ['form-spec', orgId, smartCode],
    queryFn: async (): Promise<HeraFormSpec> => {
      // 1) Try UCR-backed endpoint
      const res = await fetch(`${apiBase}/ucr/form-spec?smart_code=${encodeURIComponent(smartCode)}`, {
        headers: { 'x-hera-org': orgId },
      });

      // 2) Fallback: generate a pragmatic default if backend hasn't shipped spec yet
      if (!res.ok) {
        return {
          smart_code: smartCode,
          title: 'Create Transaction',
          steps: [
            {
              id: 'header',
              title: 'Header',
              fields: [
                { name: 'p_transaction_date', label: 'Date', type: 'date', required: true, section: 'header' },
                { name: 'p_reference_number', label: 'Reference', type: 'text', section: 'header' },
                { name: 'p_transaction_currency_code', label: 'Currency', type: 'currency', required: true, section: 'header' },
              ],
            },
            {
              id: 'lines',
              title: 'Lines',
              description: 'Add one or more line items',
              fields: [
                { name: 'line_type', label: 'Line Type', type: 'text', required: true, section: 'line' },
                { name: 'description', label: 'Description', type: 'textarea', required: true, section: 'line' },
                { name: 'quantity', label: 'Quantity', type: 'number', required: true, section: 'line' },
                { name: 'unit_amount', label: 'Unit Amount', type: 'number', required: true, section: 'line' },
              ],
            },
          ],
          defaults: {
            p_transaction_date: new Date().toISOString(),
          },
        };
      }

      return res.json();
    },
    staleTime: 5 * 60_000,
  });
}