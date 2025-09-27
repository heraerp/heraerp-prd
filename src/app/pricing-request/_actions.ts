"use server";

import { z } from "zod";

export const PricingRequestSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  workEmail: z.string().email("Enter a valid work email"),
  company: z.string().min(2, "Enter your company name"),
  role: z.string().min(2, "Enter your role"),
  country: z.string().min(2, "Enter your country"),
  employees: z.string().optional(),
  currentErp: z.string().optional(),
  timeline: z.string().min(2, "Select your timeline"),
  partnerModel: z.enum(["accountant", "platinum", "unsure"]),
  notes: z.string().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Consent is required to submit" }),
  }),
});

type FormDataInput = z.infer<typeof PricingRequestSchema>;

export async function submitPricingRequest(data: FormDataInput) {
  // Basic logging for audit; replace with DB insert if needed
  console.log("[PRICING_REQUEST]", {
    ...data,
    receivedAt: new Date().toISOString(),
  });

  // Optional: Resend email (guarded so build won't fail if not installed/configured)
  try {
    if (process.env['RESEND_API_KEY']) {
      // Dynamic import so build doesn't error when package is absent
      const { Resend } = await import("resend").catch(() => ({ Resend: null }));
      if (Resend) {
        const resend = new Resend(process.env['RESEND_API_KEY']);
        await resend.emails.send({
          from: "HERA ERP <no-reply@heraerp.com>",
          to: ["sales@heraerp.com"],
          subject: "New Pricing Request",
          text: JSON.stringify(data, null, 2),
        });
      }
    }
  } catch (err) {
    console.warn("Resend not configured or failed:", err);
  }

  return { ok: true };
}