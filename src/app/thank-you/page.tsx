import Link from 'next/link'

export default function ThankYouPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <div className="mb-6">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-10 w-10 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        <h1 className="mb-4 text-4xl font-bold ink">Thank You!</h1>

        <p className="mb-8 text-xl ink-muted">
          Your free SMB Growth Guide is on its way to your inbox.
        </p>

        <div className="rounded-xl bg-white p-8 shadow-lg">
          <h2 className="mb-4 text-2xl font-semibold ink">What happens next?</h2>

          <div className="space-y-4 text-left">
            <div className="flex gap-4">
              <div className="mt-1 text-blue-600">1.</div>
              <div>
                <h3 className="font-semibold ink">Check your email</h3>
                <p className="ink-muted">
                  You'll receive the guide within 5 minutes. Check spam if needed.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 text-blue-600">2.</div>
              <div>
                <h3 className="font-semibold ink">Read the guide</h3>
                <p className="ink-muted">
                  18 minutes average read time. Includes templates and checklists.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="mt-1 text-blue-600">3.</div>
              <div>
                <h3 className="font-semibold ink">Book a demo</h3>
                <p className="ink-muted">
                  See how HERA can transform your specific business operations.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t pt-8">
            <p className="mb-4 text-sm ink-muted">Ready to see HERA in action?</p>
            <Link
              href="/book-a-meeting"
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white transition-all hover:from-blue-700 hover:to-indigo-700"
            >
              Book Your Free Demo
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/blog" className="text-blue-600 hover:text-blue-700">
            ← Back to Blog
          </Link>
        </div>
      </div>
    </main>
  )
}
