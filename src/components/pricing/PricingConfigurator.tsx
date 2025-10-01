'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { PRICING_MODULES, computeRecommendation, toQuery, type PricingModule } from '@/data/pricing'

export default function PricingConfigurator() {
  const router = useRouter()
  const debounceRef = useRef<NodeJS.Timeout>()

  const [config, setConfig] = useState({
    modules: [] as PricingModule[],
    users: 10,
    locations: '1' as '1' | '2-5' | '6+',
    integrations: '0' as '0' | '1-2' | '3-5' | '6+',
    migration: 'none' as 'none' | 'basic' | 'complex',
    support: 'standard' as 'standard' | 'premium'
  })

  const recommendation = computeRecommendation(config)

  // Track config changes with debounce
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      if (typeof window !== 'undefined' && (window as any).track) {
        ;(window as any).track('pricing_config_change', {
          ...config,
          recommendation: recommendation.pkg,
          timeline: recommendation.timeline
        })
      }
    }, 300)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [config, recommendation])

  const handleModuleToggle = (module: PricingModule) => {
    setConfig(prev => ({
      ...prev,
      modules: prev.modules.includes(module)
        ? prev.modules.filter(m => m !== module)
        : [...prev.modules, module]
    }))
  }

  const handleRequestPricing = () => {
    const payload = {
      ...config,
      modules: config.modules.join(','),
      pkg: recommendation.pkg,
      timeline: recommendation.timeline
    }

    if (typeof window !== 'undefined' && (window as any).track) {
      ;(window as any).track('pricing_request_click', payload)
    }

    router.push(`/pricing-request${toQuery(payload)}`)
  }

  const handleBookDemo = () => {
    const payload = { modules: config.modules.join(',') }

    if (typeof window !== 'undefined' && (window as any).track) {
      ;(window as any).track('pricing_demo_click', payload)
    }

    router.push(`/book-a-meeting${toQuery(payload)}`)
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 rounded-2xl" />

      <div className="relative card-glass p-10 rounded-2xl border border-border shadow-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-4">
            <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">
              🎛️ Smart Configuration
            </span>
          </div>
          <h2 className="ink text-3xl font-bold mb-2">Configure Your Solution</h2>
          <p className="ink-muted">Select your requirements and get instant recommendations</p>
        </div>

        {/* Modules Selection */}
        <div className="mb-10">
          <h3 className="ink text-lg font-semibold mb-4">Business Modules</h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRICING_MODULES.map(module => (
              <label
                key={module.key}
                className={`group relative p-5 rounded-xl border cursor-pointer transition-all duration-300 ${
                  config.modules.includes(module.key)
                    ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/30'
                    : 'border-border bg-background hover:bg-surface-veil hover:border-indigo-500/30'
                }`}
              >
                <input
                  type="checkbox"
                  checked={config.modules.includes(module.key)}
                  onChange={() => handleModuleToggle(module.key)}
                  className="absolute top-4 right-4 h-4 w-4 rounded border-border text-indigo-600 focus:ring-2 focus:ring-ring"
                  aria-describedby={`module-${module.key}-desc`}
                />
                <div className="pr-8">
                  <div className="ink font-semibold mb-1">{module.label}</div>
                  <div id={`module-${module.key}-desc`} className="ink-muted text-sm">
                    {module.desc}
                  </div>
                </div>
                {config.modules.includes(module.key) && (
                  <div className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Users */}
          <div>
            <label htmlFor="users" className="ink text-sm font-semibold mb-2 block">
              Number of Users
            </label>
            <input
              id="users"
              type="number"
              min="1"
              max="1000"
              value={config.users}
              onChange={e =>
                setConfig(prev => ({
                  ...prev,
                  users: Math.max(1, Math.min(1000, parseInt(e.target.value) || 1))
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-background border border-border ink focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Locations */}
          <div>
            <label htmlFor="locations" className="ink text-sm font-semibold mb-2 block">
              Number of Locations
            </label>
            <select
              id="locations"
              value={config.locations}
              onChange={e =>
                setConfig(prev => ({
                  ...prev,
                  locations: e.target.value as typeof config.locations
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-background border border-border ink hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="1">1 location</option>
              <option value="2-5">2-5 locations</option>
              <option value="6+">6+ locations</option>
            </select>
          </div>

          {/* Integrations */}
          <div>
            <label htmlFor="integrations" className="ink text-sm font-semibold mb-2 block">
              Integrations Needed
            </label>
            <select
              id="integrations"
              value={config.integrations}
              onChange={e =>
                setConfig(prev => ({
                  ...prev,
                  integrations: e.target.value as typeof config.integrations
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-background border border-border ink hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="0">None</option>
              <option value="1-2">1-2 integrations</option>
              <option value="3-5">3-5 integrations</option>
              <option value="6+">6+ integrations</option>
            </select>
          </div>

          {/* Migration */}
          <div>
            <label htmlFor="migration" className="ink text-sm font-semibold mb-2 block">
              Data Migration
            </label>
            <select
              id="migration"
              value={config.migration}
              onChange={e =>
                setConfig(prev => ({
                  ...prev,
                  migration: e.target.value as typeof config.migration
                }))
              }
              className="w-full px-4 py-3 rounded-xl bg-background border border-border ink hover:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all cursor-pointer"
            >
              <option value="none">No migration needed</option>
              <option value="basic">Basic data migration</option>
              <option value="complex">Complex migration</option>
            </select>
          </div>
        </div>

        {/* Support Level */}
        <div className="mb-10">
          <h3 className="ink text-lg font-semibold mb-4">Support Level</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                config.support === 'standard'
                  ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'border-border bg-background hover:bg-surface-veil hover:border-indigo-500/30'
              }`}
            >
              <input
                type="radio"
                name="support"
                value="standard"
                checked={config.support === 'standard'}
                onChange={e =>
                  setConfig(prev => ({ ...prev, support: e.target.value as typeof config.support }))
                }
                className="h-4 w-4 border-border text-indigo-600 focus:ring-2 focus:ring-ring mb-2"
              />
              <div className="ml-6">
                <div className="ink font-semibold">Standard Support</div>
                <div className="ink-muted text-sm">Email support during business hours</div>
              </div>
            </label>
            <label
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                config.support === 'premium'
                  ? 'border-indigo-500/50 bg-indigo-50 dark:bg-indigo-950/30'
                  : 'border-border bg-background hover:bg-surface-veil hover:border-indigo-500/30'
              }`}
            >
              <input
                type="radio"
                name="support"
                value="premium"
                checked={config.support === 'premium'}
                onChange={e =>
                  setConfig(prev => ({ ...prev, support: e.target.value as typeof config.support }))
                }
                className="h-4 w-4 border-border text-indigo-600 focus:ring-2 focus:ring-ring mb-2"
              />
              <div className="ml-6">
                <div className="ink font-semibold">Premium Support</div>
                <div className="ink-muted text-sm">
                  24/7 phone & email + dedicated success manager
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Recommendation */}
        <div className="relative overflow-hidden p-8 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 border border-indigo-500/30 mb-10">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                <span className="text-white text-xl">🎯</span>
              </div>
              <div>
                <h4 className="ink text-xl font-bold">Your Recommendation</h4>
                <p className="ink-muted text-sm">Based on your configuration</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <div className="ink text-3xl font-bold mb-1">{recommendation.pkg}</div>
                <div className="ink-muted text-sm">Recommended Package</div>
              </div>
              <div className="text-center">
                <div className="ink text-3xl font-bold mb-1">{recommendation.timeline}</div>
                <div className="ink-muted text-sm">Estimated Timeline</div>
              </div>
              <div className="text-center">
                <div className="ink text-3xl font-bold mb-1">{recommendation.score}</div>
                <div className="ink-muted text-sm">Complexity Score</div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 border border-white/20">
              <p className="ink text-sm text-center">
                💡 Your exact pricing depends on modules, usage and onboarding complexity. Send this
                configuration to our team for a detailed, personalized quote.
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRequestPricing}
            className="px-6 py-3 rounded-xl text-base font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border border-border shadow-lg hover:shadow-xl transition-all"
          >
            Get Your Custom Quote
          </button>
          <button
            onClick={handleBookDemo}
            className="px-6 py-3 rounded-xl text-base font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border transition-all"
          >
            Schedule a Demo
          </button>
        </div>
      </div>
    </div>
  )
}
