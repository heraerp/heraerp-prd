"use client";

import { useState, useTransition } from "react";
import { PricingRequestSchema, submitPricingRequest } from "./_actions";

const countries = ["United Kingdom", "Ireland", "United Arab Emirates", "United States", "India", "Other"];
const employeeBands = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const timelines = ["ASAP (0-3 months)", "3-6 months", "6-12 months", "12+ months"];

export default function PricingRequestPage() {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);

    const payload = {
      fullName: String(formData.get("fullName") || ""),
      workEmail: String(formData.get("workEmail") || ""),
      company: String(formData.get("company") || ""),
      role: String(formData.get("role") || ""),
      country: String(formData.get("country") || ""),
      employees: String(formData.get("employees") || ""),
      currentErp: String(formData.get("currentErp") || ""),
      timeline: String(formData.get("timeline") || ""),
      partnerModel: String(formData.get("partnerModel") || "unsure"),
      notes: String(formData.get("notes") || ""),
      consent: formData.get("consent") === "on",
    };

    const result = PricingRequestSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    startTransition(async () => {
      const res = await submitPricingRequest(result.data);
      if (res.ok) setSuccess(true);
    });
  }

  if (success) {
    return (
      <main className="mx-auto my-16 w-[92%] max-w-3xl">
        <div className="rounded-3xl bg-card border border-border shadow-xl p-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Thank you — we're on it.</h1>
          <p className="mt-2 text-muted-foreground">
            Our team will review your requirements and send a custom quote. You can speed things up by booking a quick
            discovery call.
          </p>
          <div className="mt-6 flex gap-2">
            <a href="/demo" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-500 text-white px-4 py-2 text-sm font-medium shadow hover:opacity-95 transition">
              Book a Discovery Call
            </a>
            <a href="/" className="inline-flex items-center justify-center rounded-xl border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground hover:bg-secondary/80 transition">
              Back to Home
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto my-16 w-[92%] max-w-3xl">
      <div className="mx-auto mb-6 h-20 w-full max-w-3xl bg-gradient-to-r from-indigo-500/20 via-fuchsia-400/15 to-cyan-400/20 blur-2xl rounded-3xl" aria-hidden="true" />
      <div className="rounded-3xl bg-card border border-border shadow-xl p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold text-foreground">Request a Custom Quote</h1>
        <p className="mt-2 text-muted-foreground">
          On average, HERA ERP delivers the same or better capability at roughly one-third the cost of SAP/Oracle, with faster
          implementation and 70% AI-driven automation. Tell us about your business and we'll tailor a proposal.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4">
          <TextField name="fullName" label="Full Name" error={errors.fullName} required />
          <TextField name="workEmail" type="email" label="Work Email" error={errors.workEmail} required />
          <TextField name="company" label="Company" error={errors.company} required />
          <TextField name="role" label="Role/Title" error={errors.role} required />

          <SelectField name="country" label="Country" options={countries} error={errors.country} required />
          <SelectField name="employees" label="Employees" options={employeeBands} placeholder="Select band (optional)" />
          <TextField name="currentErp" label="Current ERP (optional)" placeholder="SAP, Oracle, NetSuite, spreadsheets…" />
          <SelectField name="timeline" label="Implementation Timeline" options={timelines} error={errors.timeline} required />

          <fieldset className="mt-2">
            <legend className="text-sm font-medium text-foreground">Preferred Implementation Model</legend>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <RadioCard name="partnerModel" value="accountant" defaultChecked label="Your Accountant" />
              <RadioCard name="partnerModel" value="platinum" label="Platinum Partner" />
              <RadioCard name="partnerModel" value="unsure" label="Not Sure" />
            </div>
          </fieldset>

          <div>
            <label className="text-sm text-foreground">Goals / Notes (optional)</label>
            <textarea name="notes" rows={4} className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Briefly describe your key goals, challenges, or integrations you care about." />
          </div>

          <label className="inline-flex items-start gap-3 text-sm">
            <input type="checkbox" name="consent" className="mt-1 h-4 w-4 rounded border-input bg-background" />
            <span className="text-muted-foreground">
              I agree to be contacted about my request and to the{" "}
              <a href="/policy" className="underline">Privacy & Cookie Policy</a>.
            </span>
          </label>
          {errors.consent ? <p className="text-sm text-red-600">{errors.consent}</p> : null}

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-500 text-white px-4 py-2 text-sm font-medium shadow hover:opacity-95 transition disabled:opacity-60"
            >
              {pending ? "Submitting…" : "Request Pricing"}
            </button>
            <a
              href="/demo"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-secondary px-4 py-2 text-sm text-secondary-foreground hover:bg-secondary/80 transition"
            >
              Book a Discovery Call
            </a>
          </div>
        </form>
      </div>
    </main>
  );
}

function TextField({
  name, label, placeholder, type = "text", error, required,
}: {
  name: string;
  label: string;
  placeholder?: string;
  type?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm text-foreground">{label}{required ? " *" : ""}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function SelectField({
  name, label, options, placeholder, error, required,
}: {
  name: string;
  label: string;
  options: string[];
  placeholder?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="text-sm text-foreground">{label}{required ? " *" : ""}</label>
      <select
        id={name}
        name={name}
        required={required}
        className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        defaultValue={placeholder ? "" : options[0]}
      >
        {placeholder ? <option value="" disabled>{placeholder}</option> : null}
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function RadioCard({
  name, value, label, defaultChecked,
}: {
  name: string;
  value: "accountant" | "platinum" | "unsure";
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-card p-3 text-sm text-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="h-4 w-4" />
      <span>{label}</span>
    </label>
  );
}