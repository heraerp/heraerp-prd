"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

interface CTAProps {
  city?: string;
  variants?: string[];
  className?: string;
}

export default function CTA({ city, variants = [], className = "" }: CTAProps) {
  const searchParams = useSearchParams();
  const [isVisible, setIsVisible] = useState(false);
  
  // Show CTA after scrolling 30% of the page
  useEffect(() => {
    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / document.documentElement.scrollHeight) * 100;
      setIsVisible(scrollPercentage > 30);
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const utm = new URLSearchParams({
    utm_source: "blog",
    utm_medium: "cta",
    utm_campaign: `local-${city?.toLowerCase().replace(/\s+/g, "-") || "generic"}`,
    utm_content: searchParams.get("utm_content") || "sticky-cta"
  }).toString();
  
  const defaultVariants = [
    "Book Your Free Demo",
    "Get the Free SMB Guide"
  ];
  
  const ctaOptions = variants.length > 0 ? variants : defaultVariants;
  
  return (
    <aside 
      className={`
        fixed bottom-0 left-0 right-0 z-40 
        transform transition-transform duration-500
        ${isVisible ? "translate-y-0" : "translate-y-full"}
        ${className}
      `}
    >
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-t border-gray-200 dark:border-gray-700 shadow-2xl">
        <div className="mx-auto max-w-7xl px-4 py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-center sm:text-left">
              <strong className="block text-lg font-bold text-gray-900 dark:text-gray-100">
                Ready to transform your {city} business?
              </strong>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Join 500+ UK businesses already saving 15+ hours per week
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link 
                href={`/free-guide?${utm}`}
                className="
                  rounded-xl border-2 border-gray-200 dark:border-gray-600 
                  bg-white dark:bg-gray-800 px-6 py-3 
                  text-center font-semibold text-gray-700 dark:text-gray-200
                  transition-all hover:border-gray-300 dark:hover:border-gray-500 
                  hover:bg-gray-50 dark:hover:bg-gray-700
                  hover:shadow-md
                "
              >
                {ctaOptions[1]}
              </Link>
              <Link 
                href={`/book-a-meeting?${utm}`}
                className="
                  rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 
                  px-6 py-3 text-center font-semibold text-white 
                  transition-all hover:from-blue-700 hover:to-indigo-700
                  hover:shadow-lg
                "
              >
                {ctaOptions[0]}
              </Link>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400 sm:justify-start">
            <span>✓ No credit card required</span>
            <span>✓ 14-day free trial</span>
            <span>✓ Cancel anytime</span>
          </div>
        </div>
      </div>
    </aside>
  );
}