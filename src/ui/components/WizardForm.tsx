// src/ui/components/WizardForm.tsx
'use client';
import React from 'react';
import { useFormSpec, HeraField } from '../hooks/useFormSpec';
import { useCreateTransaction } from '../hooks/useHera';
import { LinesEditor, TxnLine } from './LinesEditor';

type WizardState = {
  header: Record<string, any>;
  meta: Record<string, any>;
  lines: TxnLine[];
};

export function WizardForm({ smartCode, transactionType }: { smartCode: string; transactionType?: string }) {
  const { data: spec, isLoading } = useFormSpec(smartCode);
  const { mutateAsync: createTxn, isPending } = useCreateTransaction();
  const [stepIdx, setStepIdx] = React.useState(0);

  const [state, setState] = React.useState<WizardState>({
    header: spec?.defaults ?? {
      p_transaction_date: new Date().toISOString(),
    },
    meta: {},
    lines: [],
  });

  React.useEffect(() => {
    if (spec?.defaults) {
      setState((s) => ({ ...s, header: { ...spec.defaults, ...s.header } }));
    }
  }, [spec?.defaults]);

  if (isLoading || !spec) return <div className="p-6">Loading form…</div>;

  const step = spec.steps[stepIdx];

  const next = () => setStepIdx((i) => Math.min(i + 1, spec.steps.length - 1));
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));

  async function submit() {
    const body = buildTransactionBody({
      smartCode: spec.smart_code,
      transactionType: transactionType ?? spec.transaction_type ?? inferTxnTypeFromSmartCode(spec.smart_code),
      header: state.header,
      lines: state.lines,
    });

    await createTxn(body); // posts to /transactions (your existing hook)
  }

  return (
    <div className="space-y-4">
      {/* Stepper */}
      <div className="flex items-center gap-2">
        {spec.steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                i === stepIdx ? 'bg-black text-white' : 'bg-gray-200 text-gray-800'
              }`}
            >
              {i + 1}
            </div>
            {i < spec.steps.length - 1 && <div className="mx-2 h-px w-10 bg-gray-300" />}
          </div>
        ))}
      </div>

      <div>
        <div className="mb-1 text-lg font-medium">{step.title}</div>
        {step.description && <div className="mb-3 text-sm text-gray-600">{step.description}</div>}
        <StepFields
          fields={step.fields}
          header={state.header}
          setHeader={(patch) => setState((s) => ({ ...s, header: { ...s.header, ...patch } }))}
          meta={state.meta}
          setMeta={(patch) => setState((s) => ({ ...s, meta: { ...s.meta, ...patch } }))}
        />
        {step.fields.some((f) => f.section === 'line') && (
          <div className="mt-4">
            <LinesEditor
              value={state.lines}
              onChange={(lines) => setState((s) => ({ ...s, lines }))}
              headerSmartCode={spec.smart_code}
            />
          </div>
        )}
      </div>

      {/* Nav / Submit */}
      <div className="flex justify-between">
        <button type="button" onClick={prev} disabled={stepIdx === 0} className="rounded-xl border px-4 py-2 text-sm">
          Back
        </button>
        {stepIdx < spec.steps.length - 1 ? (
          <button type="button" onClick={next} className="rounded-xl border px-4 py-2 text-sm">
            Next
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={isPending}
            className="rounded-xl bg-black px-4 py-2 text-sm text-white"
          >
            {isPending ? 'Submitting…' : 'Submit'}
          </button>
        )}
      </div>
    </div>
  );
}

function StepFields({
  fields,
  header,
  setHeader,
  meta,
  setMeta,
}: {
  fields: HeraField[];
  header: Record<string, any>;
  setHeader: (patch: Record<string, any>) => void;
  meta: Record<string, any>;
  setMeta: (patch: Record<string, any>) => void;
}) {
  const hdrFields = fields.filter((f) => (f as any).section !== 'line'); // render all non-line inputs here

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {hdrFields.map((f) => {
        const value = f.section === 'meta' ? meta[f.name] : header[f.name];
        const set = (v: any) =>
          f.section === 'meta' ? setMeta({ [f.name]: v }) : setHeader({ [f.name]: v });

        switch (f.type) {
          case 'text':
            return <Field key={f.name} label={f.label} required={f.required}>
              <input
                className="w-full rounded-lg border px-3 py-2"
                placeholder={f.placeholder}
                value={value ?? ''}
                onChange={(e) => set(e.target.value)}
              />
            </Field>;
          case 'textarea':
            return <Field key={f.name} label={f.label} required={f.required}>
              <textarea
                className="w-full rounded-lg border px-3 py-2"
                placeholder={f.placeholder}
                value={value ?? ''}
                onChange={(e) => set(e.target.value)}
              />
            </Field>;
          case 'number':
            return <Field key={f.name} label={f.label} required={f.required}>
              <input
                type="number"
                className="w-full rounded-lg border px-3 py-2"
                value={value ?? ''}
                onChange={(e) => set(parseFloat(e.target.value || '0'))}
              />
            </Field>;
          case 'date':
            return <Field key={f.name} label={f.label} required={f.required}>
              <input
                type="date"
                className="w-full rounded-lg border px-3 py-2"
                value={value ? String(value).slice(0, 10) : ''}
                onChange={(e) => set(e.target.value ? new Date(e.target.value).toISOString() : undefined)}
              />
            </Field>;
          case 'boolean':
            return <Field key={f.name} label={f.label} required={f.required}>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={value ?? ''}
                onChange={(e) => set(e.target.value === '' ? undefined : e.target.value === 'true')}
              >
                <option value="">—</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </Field>;
          case 'select':
            return <Field key={f.name} label={f.label} required={f.required}>
              <select
                className="w-full rounded-lg border px-3 py-2"
                value={value ?? ''}
                onChange={(e) => set(e.target.value || undefined)}
              >
                <option value="">—</option>
                {f.options?.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>;
          case 'currency':
            return <Field key={f.name} label={f.label} required={f.required}>
              <input
                className="w-full rounded-lg border px-3 py-2 uppercase"
                maxLength={3}
                value={(value ?? '').toString().toUpperCase()}
                onChange={(e) => set(e.target.value.toUpperCase())}
                placeholder="USD"
              />
            </Field>;
          default:
            return null;
        }
      })}
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="mb-1 text-xs text-gray-600">
        {label} {required && <span className="text-red-500">*</span>}
      </div>
      {children}
    </label>
  );
}

// —— payload builder (maps wizard state → TransactionCreateBody)
function buildTransactionBody({
  smartCode,
  transactionType,
  header,
  lines,
}: {
  smartCode: string;
  transactionType: string;
  header: Record<string, any>;
  lines: TxnLine[];
}) {
  const total = (lines ?? []).reduce((sum, l) => sum + (Number(l.line_amount) || 0), 0);

  return {
    transaction_type: transactionType,
    smart_code: smartCode,
    transaction_date: header.p_transaction_date ?? new Date().toISOString(),
    total_amount: total,
    reference_number: header.p_reference_number ?? undefined,
    transaction_currency_code: header.p_transaction_currency_code ?? 'USD',
    // Optional Finance DNA extras if present in header
    base_currency_code: header.p_base_currency_code,
    exchange_rate: header.p_exchange_rate,
    exchange_rate_date: header.p_exchange_rate_date,
    exchange_rate_type: header.p_exchange_rate_type,
    status: 'pending',
    metadata: header.p_metadata ?? {},
    line_items: (lines ?? []).map((l) => ({
      line_number: l.line_number,
      line_type: l.line_type,
      smart_code: l.smart_code ?? smartCode, // safe default
      description: l.description,
      quantity: l.quantity,
      unit_amount: l.unit_amount,
      line_amount: l.line_amount,
      entity_id: l.entity_id,
      account_id: l.account_id,
      tax_code: l.tax_code,
      tax_amount: l.tax_amount,
      discount_amount: l.discount_amount,
    })),
  };
}

function inferTxnTypeFromSmartCode(smartCode: string) {
  // e.g. HERA.RETAIL.SALES.TXN.SORDER.V1 -> TXN.SORDER
  const parts = smartCode.split('.');
  const i = parts.findIndex((p) => p === 'TXN');
  return i >= 0 && parts[i + 1] ? parts[i + 1].toLowerCase() : 'generic';
}