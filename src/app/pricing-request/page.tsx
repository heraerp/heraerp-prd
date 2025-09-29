"use client";

import { useState, useTransition, useRef } from "react";
import { PricingRequestSchema, submitPricingRequest } from "./_actions";
import { AlertCircle, CheckCircle, Loader2, X } from "lucide-react";

const countries = ["United Kingdom", "Ireland", "United Arab Emirates", "United States", "India", "Other"];
const employeeBands = ["1-10", "11-50", "51-200", "201-1000", "1000+"];
const timelines = ["ASAP (0-3 months)", "3-6 months", "6-12 months", "12+ months"];
const erpModules = [
  "Finance & Accounting",
  "Human Resources (HR)",
  "Supply Chain Management",
  "Customer Relationship Management (CRM)",
  "Manufacturing",
  "Inventory Management",
  "Project Management",
  "Business Intelligence & Analytics",
  "E-commerce",
  "Point of Sale (POS)",
  "Custom Solution Required",
  "Not Sure - Need Consultation"
];

export default function PricingRequestPage() {
  const [pending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showModal, setShowModal] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState<"error" | "success">("error");
  const formRef = useRef<HTMLFormElement>(null);

  function showValidationModal(message: string, type: "error" | "success" = "error") {
    setModalMessage(message);
    setModalType(type);
    setShowModal(true);
  }

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
      erpModules: String(formData.get("erpModules") || ""),
      partnerModel: String(formData.get("partnerModel") || "unsure"),
      notes: String(formData.get("notes") || ""),
      consent: formData.get("consent") === "on",
    };

    const result = PricingRequestSchema.safeParse(payload);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      const missingFields: string[] = [];

      for (const issue of result.error.issues) {
        const key = issue.path[0] as string;
        fieldErrors[key] = issue.message;

        // Collect field names for modal
        const fieldLabel = key === 'fullName' ? 'Full Name' :
                          key === 'workEmail' ? 'Work Email' :
                          key === 'company' ? 'Company' :
                          key === 'role' ? 'Role' :
                          key === 'country' ? 'Country' :
                          key === 'timeline' ? 'Timeline' :
                          key === 'erpModules' ? 'ERP Modules' :
                          key === 'consent' ? 'Privacy Policy Consent' :
                          key;
        missingFields.push(`• ${fieldLabel}: ${issue.message}`);
      }

      setErrors(fieldErrors);

      // Show modal with all validation errors
      showValidationModal(
        `Please complete the following required fields:\n\n${missingFields.join('\n')}`
      );

      // Scroll to first error field
      const firstErrorField = Object.keys(fieldErrors)[0];
      const errorElement = document.getElementsByName(firstErrorField)[0];
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (errorElement as HTMLInputElement).focus();
      }

      return;
    }

    setErrors({});
    startTransition(async () => {
      try {
        const res = await submitPricingRequest(result.data);
        if (res.ok) {
          if (res.fallback || res.error) {
            // Show warning if email service wasn't available
            showValidationModal(
              "Your request has been received! Our team will contact you within 24 hours.\n\nNote: Email notification service is temporarily unavailable, but we have logged your request.",
              "success"
            );
          }
          setSuccess(true);
        } else {
          showValidationModal("An error occurred. Please try again or contact us directly.");
        }
      } catch (error) {
        console.error("Form submission error:", error);
        showValidationModal("An unexpected error occurred. Please try again or contact us directly.");
      }
    });
  }

  if (success) {
    return (
      <main className="mx-auto my-16 w-[92%] max-w-3xl">
        <div className="rounded-3xl bg-card border border-border shadow-xl p-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 dark:text-white">Thank you — we're on it.</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Our team will review your requirements and send a custom quote. You can speed things up by booking a quick
            discovery call.
          </p>
          <div className="mt-6 flex gap-2">
            <a href="/book-a-meeting" className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 via-fuchsia-600 to-cyan-500 text-white px-4 py-2 text-sm font-medium shadow hover:opacity-95 transition">
              Book a Discovery Call
            </a>
            <a href="/" className="inline-flex items-center justify-center rounded-xl border border-border bg-secondary px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-secondary/80 transition">
              Back to Home
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto my-16 w-[92%] max-w-3xl">
        <div className="mx-auto mb-6 h-20 w-full max-w-3xl bg-gradient-to-r from-indigo-500/20 via-fuchsia-400/15 to-cyan-400/20 blur-2xl rounded-3xl" aria-hidden="true" />
        <div className="rounded-3xl bg-card border border-border shadow-xl p-6 md:p-8">
        <h1 className="text-2xl md:text-3xl font-semibold ink">Request a Custom Quote</h1>
        <p className="mt-2 ink-muted">
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
          <SelectField name="erpModules" label="Required ERP Modules" options={erpModules} error={errors.erpModules} required />

          <fieldset className="mt-2">
            <legend className="text-sm font-medium ink">Preferred Implementation Model</legend>
            <div className="mt-2 grid gap-2 md:grid-cols-3">
              <RadioCard name="partnerModel" value="accountant" defaultChecked label="Your Accountant" />
              <RadioCard name="partnerModel" value="platinum" label="Platinum Partner" />
              <RadioCard name="partnerModel" value="unsure" label="Not Sure" />
            </div>
          </fieldset>

          <div>
            <label className="text-sm text-gray-900 dark:text-white">Goals / Notes (optional)</label>
            <textarea name="notes" rows={4} className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="Briefly describe your key goals, challenges, or integrations you care about." />
          </div>

          <label className="inline-flex items-start gap-3 text-sm">
            <input type="checkbox" name="consent" className="mt-1 h-4 w-4 rounded border-input bg-background" />
            <span className="ink-muted">
              I agree to be contacted about my request and to the{" "}
              <a href="/policy" className="underline text-blue-500 dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300">Privacy & Cookie Policy</a>.
            </span>
          </label>
          {errors.consent ? <p className="text-sm text-red-600">{errors.consent}</p> : null}

          <div className="mt-2 flex gap-2">
            <button
              type="submit"
              disabled={pending}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary px-4 py-2 text-sm ink hover:bg-secondary/80 transition disabled:opacity-50"
            >
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              {pending ? "Submitting…" : "Request Pricing"}
            </button>
            <a
              href="/book-a-meeting"
              className="inline-flex items-center justify-center rounded-xl border border-border bg-secondary px-4 py-2 text-sm ink hover:bg-secondary/80 transition"
            >
              Book a Discovery Call
            </a>
          </div>
        </form>
      </div>
    </main>

    {/* Enterprise Modal Dialog */}
    {showModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        />

        {/* Modal Content */}
        <div className="relative w-full max-w-md transform rounded-2xl bg-white dark:bg-slate-900 shadow-2xl transition-all">
          {/* Modal Header */}
          <div className={`flex items-center justify-between px-6 py-4 border-b ${
            modalType === 'error'
              ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30'
              : 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30'
          }`}>
            <div className="flex items-center gap-3">
              {modalType === 'error' ? (
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              ) : (
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              )}
              <h3 className="text-lg font-semibold ink">
                {modalType === 'error' ? 'Validation Required' : 'Success'}
              </h3>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="rounded-lg p-1.5 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 ink" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-6">
            <div className="whitespace-pre-wrap ink-muted text-sm leading-relaxed">
              {modalMessage}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end px-6 pb-6">
            <button
              onClick={() => setShowModal(false)}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-medium transition-all ${
                modalType === 'error'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {modalType === 'error' ? 'Review Form' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
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
      <label htmlFor={name} className="text-sm text-gray-900 dark:text-white">{label}{required ? " *" : ""}</label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
      <label htmlFor={name} className="text-sm ink">{label}{required ? " *" : ""}</label>
      <select
        id={name}
        name={name}
        required={required}
        className="mt-1 w-full rounded-xl border border-input bg-background p-3 text-sm ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-input bg-card p-3 text-sm ink hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-blue-500 transition-all">
      <input type="radio" name={name} value={value} defaultChecked={defaultChecked} className="h-4 w-4" />
      <span>{label}</span>
    </label>
  );
}