import Link from 'next/link';

export default function PartnerApplyCta() {
  return (
    <div className="relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-cyan-500/5 rounded-2xl" />

      <div className="relative card-glass p-10 rounded-2xl border border-border shadow-xl text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 mb-6">
          <span className="text-indigo-600 dark:text-indigo-400 text-sm font-medium">
            🎯 Partner Program Open
          </span>
        </div>

        <h2 className="ink text-3xl font-bold mb-4">
          Become a HERA Founding Partner
        </h2>
        <p className="ink-muted text-lg mb-8 max-w-2xl mx-auto">
          Join the exclusive network of accounting firms pioneering the future of ERP implementation.
          Early partners receive territory rights, premium support, and shape our product roadmap.
        </p>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-4 mb-10 max-w-3xl mx-auto">
          <div className="card-glass p-4 rounded-xl border border-border">
            <span className="text-2xl mb-2 block">💰</span>
            <span className="ink font-semibold text-sm">Revenue Sharing</span>
            <p className="ink-muted text-xs mt-1">Attractive commission structure</p>
          </div>
          <div className="card-glass p-4 rounded-xl border border-border">
            <span className="text-2xl mb-2 block">🚀</span>
            <span className="ink font-semibold text-sm">Priority Support</span>
            <p className="ink-muted text-xs mt-1">Direct engineering access</p>
          </div>
          <div className="card-glass p-4 rounded-xl border border-border">
            <span className="text-2xl mb-2 block">🌍</span>
            <span className="ink font-semibold text-sm">Territory Rights</span>
            <p className="ink-muted text-xs mt-1">Exclusive regional access</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/partners/apply"
            className="px-8 py-3 rounded-xl text-base font-medium bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:from-indigo-600 hover:to-purple-700 border border-border shadow-lg hover:shadow-xl transition-all"
          >
            Apply for Partnership
          </Link>
          <a
            href="/book-a-meeting"
            className="px-8 py-3 rounded-xl text-base font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border transition-all"
          >
            Schedule Discussion
          </a>
        </div>
      </div>
    </div>
  );
}