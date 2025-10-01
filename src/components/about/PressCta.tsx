export default function PressCta() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Press & Media */}
      <div className="card-glass p-6 rounded-2xl text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 flex items-center justify-center border border-indigo-500/20">
          <svg
            className="w-6 h-6 text-indigo-600 dark:text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
            />
          </svg>
        </div>
        <h3 className="ink font-semibold text-lg mb-2">Press & Media</h3>
        <p className="ink-muted text-sm mb-4 leading-relaxed">
          Media inquiries, press releases, and partnership announcements.
        </p>
        <a href="/contact" className="btn-quiet text-sm">
          Media Kit
        </a>
      </div>

      {/* Careers */}
      <div className="card-glass p-6 rounded-2xl text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 flex items-center justify-center border border-emerald-500/20">
          <svg
            className="w-6 h-6 text-emerald-600 dark:text-emerald-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m-8 0V6a2 2 0 00-2 2v6.894"
            />
          </svg>
        </div>
        <h3 className="ink font-semibold text-lg mb-2">Join Our Team</h3>
        <p className="ink-muted text-sm mb-4 leading-relaxed">
          Build the future of business software with a distributed team.
        </p>
        <a href="/contact" className="btn-quiet text-sm">
          Open Positions
        </a>
      </div>
    </div>
  )
}
