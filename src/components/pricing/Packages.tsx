import Link from 'next/link'
import { PACKAGES } from '@/data/pricing'

export default function Packages() {
  const packageColors = [
    'from-blue-500 to-indigo-600', // Essential
    'from-purple-500 to-pink-600', // Growth
    'from-orange-500 to-red-600' // Enterprise
  ]

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {PACKAGES.map((pkg, index) => (
        <article key={pkg.name} className="group relative">
          {/* Gradient glow effect */}
          <div
            className={`absolute inset-0 bg-gradient-to-r ${packageColors[index]} opacity-0 group-hover:opacity-10 rounded-2xl blur-xl transition-all duration-500`}
          />

          {/* Popular badge for Growth package */}
          {pkg.name === 'Growth' && (
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
              <span className="px-4 py-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-sm font-semibold rounded-full shadow-lg">
                Most Popular
              </span>
            </div>
          )}

          <div
            className={`relative card-glass p-8 rounded-2xl h-full flex flex-col border transition-all duration-300 ${pkg.name === 'Growth' ? 'border-purple-500/30 shadow-xl' : 'border-border group-hover:border-indigo-500/30'}`}
          >
            {/* Package icon */}
            <div
              className={`w-14 h-14 rounded-xl bg-gradient-to-br ${packageColors[index]} flex items-center justify-center text-white text-2xl mb-6 shadow-lg`}
            >
              {pkg.name === 'Essential' ? '🎯' : pkg.name === 'Growth' ? '🚀' : '🏢'}
            </div>

            <h3 className="ink text-2xl font-bold mb-3">{pkg.name}</h3>
            <p className="ink-muted text-sm leading-relaxed mb-6">{pkg.summary}</p>

            {/* Features list */}
            <ul className="space-y-3 mb-8 flex-grow">
              {pkg.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-500 text-xs">✓</span>
                  </div>
                  <span className="ink text-sm">{bullet}</span>
                </li>
              ))}
            </ul>

            {/* CTA hint */}
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-6">
              <p className="text-slate-600 dark:text-slate-400 text-xs font-medium text-center">
                {pkg.ctaHint}
              </p>
            </div>

            {/* CTA button */}
            <Link
              href={`/pricing-request?package=${pkg.name}`}
              className="text-center px-6 py-3 rounded-xl font-medium transition-all border bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-border"
            >
              {pkg.name === 'Enterprise' ? 'Contact Sales' : 'Request Pricing'}
            </Link>
          </div>
        </article>
      ))}
    </div>
  )
}
