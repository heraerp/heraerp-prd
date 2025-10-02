"use client";

import { useState, useMemo } from 'react';
import { type Partner } from '../../../.contentlayer/generated'
import Link from 'next/link'
import Image from 'next/image'

interface PartnersClientProps {
  partners: Partner[]
}

// Define region type based on common regions
type PartnerRegion = "EMEA" | "APAC" | "Americas" | "Global"

// Statistics component
function PartnerStatistics({ partnerCount }: { partnerCount: number }) {
  const stats = [
    { value: partnerCount.toString(), label: "Founding Partners", color: "from-indigo-500 to-indigo-600" },
    { value: "3", label: "Countries", color: "from-purple-500 to-purple-600" },
    { value: "15+", label: "Active Discussions", color: "from-cyan-500 to-cyan-600" },
    { value: "Q1 2025", label: "Launch Date", color: "from-emerald-500 to-emerald-600" }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
      {stats.map((stat, idx) => (
        <div key={idx} className="relative group">
          <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} opacity-10 rounded-2xl blur-xl group-hover:opacity-20 transition-opacity`} />
          <div className="relative bg-card border border-border p-6 rounded-2xl text-center shadow-sm">
            <div className="!text-gray-900 dark:!text-gray-100 text-3xl font-bold mb-1">{stat.value}</div>
            <div className="!text-gray-600 dark:!text-gray-300 text-sm">{stat.label}</div>
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
      <h2 className="!text-gray-900 dark:!text-gray-100 text-2xl font-semibold text-center mb-8">Why Partner with HERA?</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {benefits.map((benefit, idx) => (
          <div key={idx} className="group">
            <div className="bg-card border border-border p-6 rounded-2xl hover:border-indigo-500/30 transition-all duration-300 shadow-sm">
              <div className="text-3xl mb-3">{benefit.icon}</div>
              <h3 className="!text-gray-900 dark:!text-gray-100 text-lg font-semibold mb-2">{benefit.title}</h3>
              <p className="!text-gray-600 dark:!text-gray-300 text-sm leading-relaxed">{benefit.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Partner Card Component
function PartnerCard({ partner }: { partner: Partner }) {
  return (
    <div className="group relative h-full rounded-2xl p-6 bg-card hover:bg-card/80 border border-border backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/10 shadow-sm flex flex-col">
      {/* Logo Section with fixed height */}
      <div className="h-20 mb-6 relative flex items-center">
        {partner.logo ? (
          <Image
            src={partner.logo}
            alt={`${partner.name} logo`}
            fill
            className="object-contain object-left"
            onError={(e) => {
              // Fallback if image fails to load
              (e.target as any).style.display = 'none';
              (e.target as any).parentElement.innerHTML = `
                <div class="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center">
                  <span class="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${partner.name.charAt(0)}</span>
                </div>
              `;
            }}
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600/20 to-purple-600/20 flex items-center justify-center">
            <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {partner.name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content Section - Flex grow to fill space */}
      <div className="flex-grow flex flex-col">
        <h3 className="text-xl font-semibold mb-3 !text-gray-900 dark:!text-gray-100">
          {partner.name}
        </h3>

        {partner.summary && (
          <p className="text-sm !text-gray-600 dark:!text-gray-300 line-clamp-3 mb-4 leading-relaxed">
            {partner.summary}
          </p>
        )}

        {/* Specialties badges */}
        {partner.specialties && partner.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {partner.specialties.slice(0, 3).map((specialty, idx) => (
              <span key={idx} className="inline-block px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 !text-indigo-700 dark:!text-indigo-300 text-xs rounded">
                {specialty}
              </span>
            ))}
            {partner.specialties.length > 3 && (
              <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-800 !text-gray-600 dark:!text-gray-400 text-xs rounded">
                +{partner.specialties.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Location */}
        {partner.locations && (
          <div className="flex items-center gap-2 text-xs !text-gray-500 dark:!text-gray-400 mb-4">
            <svg className="w-3 h-3 !text-gray-500 dark:!text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>
              {(partner.locations as any)?.hq || ((partner.locations as any)?.regions && (partner.locations as any).regions[0]) || 'Global'}
            </span>
          </div>
        )}

        {/* Spacer to push buttons to bottom */}
        <div className="flex-grow" />

        {/* Action Buttons */}
        <div className="flex gap-3 mt-4 pt-4 border-t border-border">
          <Link
            href={partner.url}
            className="flex-1 px-4 py-2 text-center text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
          >
            View Profile
          </Link>
          {partner.website && (
            <a
              href={partner.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-4 py-2 text-center text-sm font-medium rounded-lg border border-border !text-gray-700 dark:!text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Visit Website
            </a>
          )}
        </div>
      </div>

      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-indigo-500/5 group-hover:via-purple-500/5 group-hover:to-cyan-500/5 transition-all duration-300 pointer-events-none" />
    </div>
  );
}

// Filter Bar Component
function PartnersFilterBar({
  query,
  setQuery,
  region,
  setRegion,
  count
}: {
  query: string
  setQuery: (query: string) => void
  region: PartnerRegion | "All"
  setRegion: (region: PartnerRegion | "All") => void
  count: number
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 mb-8 shadow-sm">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search partners..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-background border border-border !text-gray-900 dark:!text-gray-100 placeholder:!text-gray-500 dark:placeholder:!text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select
          value={region}
          onChange={(e) => setRegion(e.target.value as PartnerRegion | "All")}
          className="px-4 py-2 rounded-xl bg-background border border-border !text-gray-900 dark:!text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="All">All Regions</option>
          <option value="EMEA">EMEA</option>
          <option value="APAC">APAC</option>
          <option value="Americas">Americas</option>
          <option value="Global">Global</option>
        </select>
      </div>
      <div className="mt-4 text-sm !text-gray-600 dark:!text-gray-300">
        Showing {count} partner{count !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default function PartnersClient({ partners }: PartnersClientProps) {
  const [query, setQuery] = useState('');
  const [region, setRegion] = useState<PartnerRegion | "All">("All");

  const filtered = useMemo(() => {
    return partners.filter(partner => {
      // Search filter
      if (query) {
        const searchLower = query.toLowerCase();
        const matchesSearch =
          partner.name.toLowerCase().includes(searchLower) ||
          (partner.summary || '').toLowerCase().includes(searchLower) ||
          (partner.tags || []).some(tag => tag.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }

      // Region filter - check in locations object
      if (region !== "All") {
        const partnerLocation = (partner.locations as any);
        const partnerRegion = partnerLocation?.hq || (partnerLocation?.regions && partnerLocation.regions[0]) || 'Global';
        if (partnerRegion !== region) return false;
      }

      return true;
    });
  }, [query, region, partners]);

  // Find featured partner
  const featuredPartner = partners.find(p => p.featured);

  return (
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

            <h1 className="!text-gray-900 dark:!text-gray-100 text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              HERA Accounting Partner
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Excellence Program
              </span>
            </h1>

            <p className="!text-gray-600 dark:!text-gray-300 text-lg md:text-xl max-w-3xl mx-auto mb-8 leading-relaxed">
              Be among the first accounting firms to join HERA's revolutionary partner network.
              Early partners shape the future of ERP implementation and gain first-mover
              advantages in their markets.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/partners/apply" className="px-8 py-3 text-lg rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                Become a Partner
              </Link>
              <Link href="/book-a-meeting" className="px-8 py-3 text-lg rounded-xl border border-border !text-gray-900 dark:!text-gray-100 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300">
                Partner Demo
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Statistics */}
        <PartnerStatistics partnerCount={partners.length} />

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
            <h2 className="!text-gray-900 dark:!text-gray-100 text-3xl md:text-4xl font-bold mb-4">
              Our Founding Partners
            </h2>
            <p className="!text-gray-600 dark:!text-gray-300 text-lg max-w-2xl mx-auto leading-relaxed">
              Connect with pioneering accounting professionals who are transforming
              how businesses implement and manage ERP systems globally
            </p>
          </div>

          {/* Featured Partner Highlight */}
          {featuredPartner && (
            <div className="mb-8">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 p-[1px]">
                <div className="relative bg-card rounded-2xl p-8">
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium">
                      Featured Partner
                    </span>
                  </div>
                  <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="!text-gray-900 dark:!text-gray-100 text-2xl font-bold mb-3">{featuredPartner.name}</h3>
                      <p className="!text-gray-600 dark:!text-gray-300 mb-4 leading-relaxed">
                        {featuredPartner.summary || "As a founding partner, this firm has exclusive access to HERA's revolutionary platform, priority support, and the opportunity to shape our product roadmap."}
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {featuredPartner.specialties?.slice(0, 3).map((specialty, idx) => (
                          <span key={idx} className="px-3 py-1 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 !text-indigo-700 dark:!text-indigo-300 text-sm">
                            {specialty}
                          </span>
                        ))}
                      </div>
                      <Link href={featuredPartner.url} className="inline-flex items-center text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
                        Learn more →
                      </Link>
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

          {/* Filter Bar */}
          <PartnersFilterBar
            query={query}
            setQuery={setQuery}
            region={region}
            setRegion={setRegion}
            count={filtered.length}
          />

          {/* Partner Cards Grid */}
          {filtered.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-fr">
              {filtered.map(p => (
                <div key={p.slug} className="h-full">
                  <PartnerCard partner={p} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <div className="bg-card p-12 rounded-2xl border border-border shadow-sm">
                  <div className="text-5xl mb-4">🤝</div>
                  <h3 className="!text-gray-900 dark:!text-gray-100 text-xl font-semibold mb-3">No Partners Match Your Search</h3>
                  <p className="!text-gray-600 dark:!text-gray-300 text-sm mb-6 leading-relaxed">
                    We're actively expanding our partner network. Adjust your filters or
                    explore becoming a founding partner yourself.
                  </p>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => { setQuery(''); setRegion('All'); }}
                      className="px-6 py-3 rounded-xl border border-border !text-gray-900 dark:!text-gray-100 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all duration-300"
                    >
                      Clear all filters
                    </button>
                    <Link href="/partners/apply" className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                      Become a Partner
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Partnership Timeline */}
        <div className="mt-16 p-8 rounded-2xl bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/50 dark:to-gray-900/50 border border-border shadow-sm">
          <h3 className="!text-gray-900 dark:!text-gray-100 text-2xl font-semibold text-center mb-8">Partnership Journey</h3>
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
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-xl mb-3 shadow-lg">
                    {item.step}
                  </div>
                  <h4 className="!text-gray-900 dark:!text-gray-100 font-semibold mb-1">{item.title}</h4>
                  <p className="!text-gray-600 dark:!text-gray-300 text-sm mb-1">{item.desc}</p>
                  <p className="text-indigo-600 dark:text-indigo-400 text-xs font-medium">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Trust Indicators and Final CTA */}
        <div className="mt-16 border-t border-border pt-12">
          <div className="text-center mb-8">
            <p className="!text-gray-600 dark:!text-gray-300 text-sm mb-6">Join the accounting firms revolutionizing ERP implementation</p>

            {/* Partner Benefits Summary */}
            <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto mb-8">
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="text-2xl mb-2">🎯</div>
                <div className="!text-gray-900 dark:!text-gray-100 text-sm font-semibold">Exclusive Territories</div>
                <div className="!text-gray-600 dark:!text-gray-300 text-xs">First partners get regional exclusivity</div>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="text-2xl mb-2">💎</div>
                <div className="!text-gray-900 dark:!text-gray-100 text-sm font-semibold">Premium Support</div>
                <div className="!text-gray-600 dark:!text-gray-300 text-xs">Direct access to HERA leadership</div>
              </div>
              <div className="bg-card p-4 rounded-xl border border-border shadow-sm">
                <div className="text-2xl mb-2">🚀</div>
                <div className="!text-gray-900 dark:!text-gray-100 text-sm font-semibold">Market Advantage</div>
                <div className="!text-gray-600 dark:!text-gray-300 text-xs">Be first to market with HERA ERP</div>
              </div>
            </div>

            {/* Final Early Partner CTA */}
            <div className="inline-flex flex-col items-center gap-4 px-8 py-6 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-cyan-500/10 border border-indigo-500/20 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="text-3xl">⏰</span>
                <div className="text-left">
                  <div className="!text-gray-900 dark:!text-gray-100 text-lg font-bold">Limited Founding Partner Positions</div>
                  <div className="!text-gray-600 dark:!text-gray-300 text-sm">Only accepting select firms for Q1 2025 launch</div>
                </div>
              </div>
              <Link href="/partners/apply" className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl">
                Apply for Founding Partnership
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}