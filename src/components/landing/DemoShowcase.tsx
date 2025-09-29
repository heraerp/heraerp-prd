import Link from 'next/link'
import type { Demo } from '@/data/demos'

interface DemoShowcaseProps {
  demos: Demo[]
}

export default function DemoShowcase({ demos }: DemoShowcaseProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {demos.map((demo) => (
        <article key={demo.slug} className="h-card card h-full" tabIndex={0}>
          <div className="g-shell g-animated h-full">
            <div className="g-inner card-glass p-6 rounded-2xl h-full flex flex-col">
              <div className="flex-grow">
                <h3 className="ink text-xl font-semibold mb-3">{demo.name}</h3>
                <p className="ink-muted text-sm mb-4 min-h-[2.5rem]">{demo.tagline}</p>

                <ul className="space-y-2 mb-5 min-h-[5rem]">
                  {demo.bullets.map((bullet, index) => (
                    <li key={index} className="ink-muted text-sm flex items-start gap-2">
                      <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                      <span className="leading-relaxed">{bullet}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2 mb-5">
                  <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-green-600/10 to-emerald-600/10 text-green-400 rounded-full border border-green-800/30 backdrop-blur">
                    {demo.actives}
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-blue-600/10 to-cyan-600/10 text-blue-400 rounded-full border border-blue-800/30 backdrop-blur">
                    {demo.revenue}
                  </span>
                  <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-amber-600/10 to-orange-600/10 text-amber-400 rounded-full border border-amber-800/30 backdrop-blur">
                    {demo.setup}
                  </span>
                </div>
              </div>

              <div className="pop flex flex-col gap-2 mt-auto">
                <Link
                  href={`${demo.demoHref}&action=try`}
                  className="inline-flex items-center justify-center rounded-lg bg-slate-800/60 backdrop-blur border border-slate-700/50 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700/60 hover:text-white transition w-full"
                  data-event="landing_demo_card_try"
                  data-slug={demo.slug}
                >
                  <span className="relative z-10">Try Demo</span>
                </Link>
                <Link
                  href={`${demo.buildHref}&action=build`}
                  className="inline-flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95 transition w-full"
                  data-event="landing_demo_card_build"
                  data-slug={demo.slug}
                >
                  <span className="relative z-10">Build Your Own</span>
                </Link>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}