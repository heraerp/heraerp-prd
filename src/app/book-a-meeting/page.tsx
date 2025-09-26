import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Book a Demo | HERA ERP',
  description:
    'Schedule a personalized demo to see how HERA can transform your business operations. No obligations, just insights.'
}

export default function BookMeetingPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Book Your Personalized Demo</h1>
          <p className="text-xl text-gray-600">
            See how HERA can transform your specific business in just 30 minutes
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Benefits */}
          <div className="rounded-xl bg-white p-8">
            <h2 className="mb-6 text-2xl font-semibold text-gray-900">What to Expect</h2>

            <div className="space-y-4">
              <div className="flex gap-3">
                <svg
                  className="mt-1 h-5 w-5 flex-shrink-0 text-green-500"
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
                <div>
                  <h3 className="font-semibold text-gray-900">Tailored to Your Business</h3>
                  <p className="text-sm text-gray-600">
                    See HERA configured for your specific industry and workflows
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <svg
                  className="mt-1 h-5 w-5 flex-shrink-0 text-green-500"
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
                <div>
                  <h3 className="font-semibold text-gray-900">ROI Calculator</h3>
                  <p className="text-sm text-gray-600">
                    Get a custom report showing your potential time and cost savings
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <svg
                  className="mt-1 h-5 w-5 flex-shrink-0 text-green-500"
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
                <div>
                  <h3 className="font-semibold text-gray-900">Implementation Roadmap</h3>
                  <p className="text-sm text-gray-600">
                    Clear 30-day plan to go from demo to fully operational
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <svg
                  className="mt-1 h-5 w-5 flex-shrink-0 text-green-500"
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
                <div>
                  <h3 className="font-semibold text-gray-900">No Pressure</h3>
                  <p className="text-sm text-gray-600">
                    Educational consultation with zero sales pressure
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-blue-50 p-4">
              <p className="text-sm font-semibold text-blue-900">Limited Time Offer</p>
              <p className="mt-1 text-sm text-blue-700">
                Book this month and receive free data migration (£2,000 value)
              </p>
            </div>
          </div>

          {/* Calendar Embed */}
          <div className="rounded-xl bg-white p-8">
            <h2 className="mb-4 text-xl font-semibold text-gray-900">
              Choose a Time That Works for You
            </h2>

            {/* Placeholder for calendar embed */}
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center">
              <svg
                className="mx-auto mb-4 h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="mb-4 text-gray-600">Calendar widget will appear here</p>
              <p className="text-sm text-gray-500">
                Replace this with your Calendly, Cal.com, or custom booking widget
              </p>

              {/* Temporary booking links */}
              <div className="mt-6 space-y-2">
                <a
                  href="#"
                  className="block rounded-lg bg-blue-600 py-3 text-white hover:bg-blue-700"
                >
                  Schedule for This Week
                </a>
                <a
                  href="#"
                  className="block rounded-lg border border-gray-300 py-3 text-gray-700 hover:bg-gray-50"
                >
                  Schedule for Next Week
                </a>
              </div>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>Prefer to talk now?</p>
              <p className="mt-2 font-semibold text-gray-900">Call us: 0800 HERA ERP</p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="rounded-lg bg-white p-6">
            <div className="mb-2 flex text-yellow-400">
              {'★★★★★'.split('').map((star, i) => (
                <span key={i}>{star}</span>
              ))}
            </div>
            <p className="mb-2 text-sm text-gray-600">
              "The demo was perfectly tailored to our restaurant operations. Saw exactly how it
              would work for us."
            </p>
            <p className="text-sm font-semibold text-gray-900">Sarah M., Bristol</p>
          </div>

          <div className="rounded-lg bg-white p-6">
            <div className="mb-2 flex text-yellow-400">
              {'★★★★★'.split('').map((star, i) => (
                <span key={i}>{star}</span>
              ))}
            </div>
            <p className="mb-2 text-sm text-gray-600">
              "No pushy sales tactics. Just honest advice about improving our operations.
              Refreshing!"
            </p>
            <p className="text-sm font-semibold text-gray-900">James T., Manchester</p>
          </div>

          <div className="rounded-lg bg-white p-6">
            <div className="mb-2 flex text-yellow-400">
              {'★★★★★'.split('').map((star, i) => (
                <span key={i}>{star}</span>
              ))}
            </div>
            <p className="mb-2 text-sm text-gray-600">
              "The ROI calculator showed we'd save £3,200/month. We were live in 4 weeks and hit
              those numbers."
            </p>
            <p className="text-sm font-semibold text-gray-900">Emma R., Leeds</p>
          </div>
        </div>
      </div>
    </main>
  )
}
