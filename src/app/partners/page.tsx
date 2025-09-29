"use client";

import { useState, useMemo } from 'react';
import { PARTNERS, type PartnerRegion } from '@/data/partners';
import PartnerCard from '@/components/partners/PartnerCard';
import PartnersFilterBar from '@/components/partners/PartnersFilterBar';
import PartnerApplyCta from '@/components/partners/PartnerApplyCta';

// Statistics component
function PartnerStatistics() {
  const stats = [
    { value: "2", label: "Founding Partners", color: "from-indigo-500 to-indigo-600" },
    { value: "3", label: "Countries", color: "from-purple-500 to-purple-600" },
    { value: "15+", label: "Active Discussions", color: "from-cyan-500 to-cyan-600" },
    { value: "Q1 2025", label: "Launch Date", color: "from-emerald-500 to-emerald-600" }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {stats.map((stat, idx) => (
        <div key={idx} className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-10 rounded-2xl blur-xl group-hover:opacity-20 transition-opacity`} />
          <div className="relative card-glass p-6 rounded-2xl border border-border text-center">
            <div className="ink text-3xl font-bold mb-1">{stat.value}</div>
            <div className="ink-muted text-sm">{stat.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Benefits section
function PartnerBenefits() {
  const benefits = [
    {
      icon: "🎯",
      title: "Lead Generation",
      description: "Receive qualified leads from HERA's global sales team"
    },
    {
      icon: "🚀",
      title: "Training & Support",
      description: "Comprehensive onboarding and continuous training programs"
    },
    {
      icon: "💼",
      title: "Co-Marketing",
      description: "Joint marketing initiatives and brand exposure"
    },
    {
      icon: "🛠️",
      title: "Technical Support",
      description: "Direct access to HERA's engineering and support teams"
    },
    {
      icon: "💰",
      title: "Revenue Sharing",
      description: "Attractive commission structure and incentives"
    },
    {
      icon: "🌍",
      title: "Global Network",
      description: "Connect with partners worldwide for collaboration"
    }
  ];

  return (
    <div className="mb-12">
      <h2 className="ink text-2xl font-semibold text-center mb-8">Why Partner with HERA?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, idx) => (
          <div key={idx} className="group">
            <div className="card-glass p-6 rounded-2xl border border-border hover:border-indigo-500/30 transition-all duration-300">
              <div className="text-3xl mb-3">{benefit.icon}</div>
              <h3 className="ink text-lg font-semibold mb-2">{benefit.title}</h3>
              <p className="ink-muted text-sm">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function PartnersPage() {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<PartnerRegion | "All">("All");

  const filtered = useMemo(() => {
    return PARTNERS.filter(partner => {
      // Search filter
      if (query) {
        const searchLower = query.toLowerCase();
        const matchesSearch =
          partner.name.toLowerCase().includes(searchLower) ||
          partner.summary.toLowerCase().includes(searchLower) ||
          partner.tags.some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Region filter
      if (region !== "All" && partner.region !== region) return false;

      return true;
    });
  }, [query, region]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "itemListElement": filtered.map((partner, index) => ({
      "@type": "ProfessionalService",
      "position": index + 1,
      "name": partner.name,
      "url": `https://heraerp.com/partners/${partner.slug}`,
      "areaServed": partner.region
    }))
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="w-full">
        {/* Hero Section with Gradient */}
        <section className="relative overflow-hidden py-20 px-6">
          {/* Background gradients */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-emerald-500/20 rounded-full blur-3xl" />

          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 mb-6">
                <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">
                  🌍 Global Partner Network
                </span>
              </div>

              <h1 className="ink text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                HERA Accounting Partner
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                  Excellence Program
                </span>
              </h1>

              <p className="ink-muted text-lg md:text-xl max-w-3xl mx-auto mb-8">
                Be among the first accounting firms to join HERA's revolutionary partner network.
                Early partners shape the future of ERP implementation and gain first-mover
                advantages in their markets.
              </p>

              <div className="flex flex-wrap justify-center gap-4">
                <a href="/partners/apply" className="btn-gradient px-8 py-3 text-lg border border-border">
                  Become a Partner
                </a>
                <a href="/book-a-meeting" className="btn-quiet px-8 py-3 text-lg border border-border">
                  Partner Demo
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <section className="section py-12 space-y-12 max-w-7xl mx-auto">
          {/* Statistics */}
          <PartnerStatistics />

          {/* Benefits */}
          <PartnerBenefits />

          {/* Partners Section */}
          <div className="relative">
            {/* Section Header with Enhanced Design */}
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-4">
                <span className="text-emerald-600 dark:text-emerald-400 text-xs font-medium uppercase tracking-wider">
                  Exclusive Network
                </span>
              </div>
              <h2 className="ink text-3xl md:text-4xl font-bold mb-4">
                Our Founding Partners
              </h2>
              <p className="ink-muted text-lg max-w-2xl mx-auto">
                Connect with pioneering accounting professionals who are transforming
                how businesses implement and manage ERP systems globally
              </p>
            </div>

            {/* Featured Partner Highlight */}
            {PARTNERS.length > 0 && (
              <div className="mb-8">
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 p-[1px]">
                  <div className="relative card-glass rounded-2xl p-8">
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium">
                        Featured Partner
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 items-center">
                      <div>
                        <h3 className="ink text-2xl font-bold mb-3">Strategic Partnership Opportunity</h3>
                        <p className="ink-muted mb-4">
                          As a founding partner, you'll have exclusive access to HERA's revolutionary platform,
                          priority support, and the opportunity to shape our product roadmap. Join us in
                          building the future of accounting technology.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm">
                            Territory Rights
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm">
                            Revenue Share
                          </span>
                          <span className="px-3 py-1 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-sm">
                            White Label Options
                          </span>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20" />
                          <div className="relative bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white text-center">
                            <div className="text-5xl font-bold mb-2">2025</div>
                            <div className="text-sm uppercase tracking-wider">Launch Year</div>
                            <div className="mt-4 text-lg font-semibold">Be Part of History</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filter Bar with Enhanced Styling */}
            <div className="mb-8">
              <PartnersFilterBar
                query={query}
                setQuery={setQuery}
                region={region}
                setRegion={setRegion}
                count={filtered.length}
              />
            </div>

            {/* Partner Cards Grid with Better Layout */}
            {filtered.length > 0 ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filtered.map(p => (
                    <div key={p.slug} className="transform hover:scale-[1.02] transition-transform duration-200">
                      <PartnerCard partner={p} />
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="max-w-md mx-auto">
                  <div className="card-glass p-12 rounded-2xl border border-border">
                    <div className="text-5xl mb-4">🤝</div>
                    <h3 className="ink text-xl font-semibold mb-3">No Partners Match Your Search</h3>
                    <p className="ink-muted text-sm mb-6">
                      We're actively expanding our partner network. Adjust your filters or
                      explore becoming a founding partner yourself.
                    </p>
                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => { setQuery(''); setRegion('All'); }}
                        className="btn-quiet border border-border"
                      >
                        Clear all filters
                      </button>
                      <a href="/partners/apply" className="btn-gradient border border-border">
                        Become a Partner
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Enhanced CTA Section */}
          <div className="mt-16">
            <PartnerApplyCta />
          </div>

          {/* Partnership Timeline */}
          <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-border">
            <h3 className="ink text-2xl font-semibold text-center mb-8">Partnership Journey</h3>
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { step: "1", title: "Apply", desc: "Submit your application", time: "2 mins" },
                { step: "2", title: "Review", desc: "We evaluate your firm", time: "1-2 days" },
                { step: "3", title: "Onboard", desc: "Training & setup", time: "1 week" },
                { step: "4", title: "Launch", desc: "Start implementing", time: "Ready to go" }
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  {idx < 3 && (
                    <div className="hidden md:block absolute top-8 left-[60%] w-full h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500 opacity-30" />
                  )}
                  <div className="relative text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xl mb-3">
                      {item.step}
                    </div>
                    <h4 className="ink font-semibold mb-1">{item.title}</h4>
                    <p className="ink-muted text-sm mb-1">{item.desc}</p>
                    <p className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Indicators and Final CTA */}
          <div className="mt-16 border-t border-border pt-12">
            <div className="text-center mb-8">
              <p className="ink-muted text-sm mb-6">Join the accounting firms revolutionizing ERP implementation</p>

              {/* Partner Benefits Summary */}
              <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
                <div className="card-glass p-4 rounded-xl border border-border">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="ink text-sm font-semibold">Exclusive Territories</div>
                  <div className="ink-muted text-xs">First partners get regional exclusivity</div>
                </div>
                <div className="card-glass p-4 rounded-xl border border-border">
                  <div className="text-2xl mb-2">💎</div>
                  <div className="ink text-sm font-semibold">Premium Support</div>
                  <div className="ink-muted text-xs">Direct access to HERA leadership</div>
                </div>
                <div className="card-glass p-4 rounded-xl border border-border">
                  <div className="text-2xl mb-2">🚀</div>
                  <div className="ink text-sm font-semibold">Market Advantage</div>
                  <div className="ink-muted text-xs">Be first to market with HERA ERP</div>
                </div>
              </div>

              {/* Final Early Partner CTA */}
              <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-500/20">
                <div className="flex items-center gap-2">
                  <span className="text-3xl">⏰</span>
                  <div className="text-left">
                    <div className="ink text-lg font-bold">Limited Founding Partner Positions</div>
                    <div className="ink-muted text-sm">Only accepting select firms for Q1 2025 launch</div>
                  </div>
                </div>
                <a href="/partners/apply" className="btn-gradient px-8 py-3 border border-border">
                  Apply for Founding Partnership
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}