'use client'

import type { PartnerRegion } from '@/data/partners'

interface PartnersFilterBarProps {
  query: string
  setQuery: (v: string) => void
  region: PartnerRegion | 'All'
  setRegion: (v: PartnerRegion | 'All') => void
  count: number
}

export default function PartnersFilterBar({
  query,
  setQuery,
  region,
  setRegion,
  count
}: PartnersFilterBarProps) {
  const regions: Array<PartnerRegion | 'All'> = ['All', 'EMEA', 'Americas', 'APAC', 'Global']

  return (
    <div className="card-glass p-4 rounded-2xl border border-border shadow-lg space-y-4">
      {/* Search Input with Icon */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <svg className="h-5 w-5 ink-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search by name, location, or specialization..."
          className="w-full pl-11 pr-4 py-3 rounded-xl bg-background border border-border text-sm ink placeholder:ink-muted focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
        />
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Region Select with Enhanced Styling */}
        <div className="flex items-center gap-2">
          <label className="ink text-sm font-medium">Region:</label>
          <select
            value={region}
            onChange={e => setRegion(e.target.value as PartnerRegion | 'All')}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-background border border-border ink hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
          >
            {regions.map(r => (
              <option key={r} value={r}>
                {r === 'All' ? 'All Regions' : r}
              </option>
            ))}
          </select>
        </div>

        {/* Result Count with Better Styling */}
        <div className="ml-auto flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="ink text-sm font-medium">
            {count} {count === 1 ? 'Partner' : 'Partners'}
          </span>
          {count > 0 && <span className="ink-muted text-xs">Available</span>}
        </div>
      </div>
    </div>
  )
}
