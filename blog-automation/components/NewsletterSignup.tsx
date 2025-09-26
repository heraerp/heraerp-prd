"use client";

import { useState } from "react";

interface NewsletterSignupProps {
  className?: string;
}

export default function NewsletterSignup({ className = "" }: NewsletterSignupProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "blog_sidebar" })
      });
      
      if (response.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch (error) {
      setStatus("error");
    }
  };
  
  return (
    <div className={`rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 p-6 ${className}`}>
      <h3 className="mb-2 text-lg font-semibold text-gray-900">
        Weekly Growth Tips
      </h3>
      <p className="mb-4 text-sm text-gray-600">
        Join 3,000+ UK business owners getting actionable insights.
      </p>
      
      {status === "success" ? (
        <div className="rounded-lg bg-green-100 p-3 text-sm text-green-700">
          ✓ Thanks! Check your inbox to confirm.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            disabled={status === "loading"}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          />
          
          <button
            type="submit"
            disabled={status === "loading"}
            className="w-full rounded-lg bg-blue-600 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-gray-400"
          >
            {status === "loading" ? "Subscribing..." : "Subscribe Free"}
          </button>
          
          {status === "error" && (
            <p className="text-xs text-red-600">
              Something went wrong. Please try again.
            </p>
          )}
          
          <p className="text-xs text-gray-500">
            No spam. Unsubscribe anytime.
          </p>
        </form>
      )}
    </div>
  );
}