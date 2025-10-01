import { MILESTONES } from '@/data/about'

export default function Timeline() {
  return (
    <div className="space-y-6">
      {MILESTONES.map((milestone, index) => (
        <div key={index} className="card-glass p-5 rounded-2xl">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-shrink-0">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                {milestone.year}
              </span>
            </div>
            <div className="flex-grow">
              <h3 className="ink font-semibold text-lg mb-2">{milestone.title}</h3>
              <p className="ink-muted text-sm leading-relaxed">{milestone.desc}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
