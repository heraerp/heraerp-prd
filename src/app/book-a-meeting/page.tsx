import { Metadata } from 'next'
import { Calendar, Check, Phone, Clock, Star, Zap, ArrowRight, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Book a Demo | HERA ERP',
  description:
    'Schedule a personalized demo to see how HERA can transform your business operations. No obligations, just insights.'
}

export default function BookMeetingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/20">
      {/* Background elements */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-20">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-950/30 rounded-full border border-blue-800 mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wide">
              Personalized Demo
            </span>
          </div>
          <h1 className="mb-4 text-5xl font-bold ink">Book Your Personalized Demo</h1>
          <p className="text-xl ink-muted max-w-2xl mx-auto">
            See how HERA can transform your specific business in just 30 minutes. No obligations,
            just insights tailored to your needs.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Benefits */}
          <div className="card-glass rounded-2xl p-8">
            <h2 className="mb-6 text-2xl font-bold ink">What to Expect</h2>

            <div className="space-y-5">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <Check className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold ink mb-1">Tailored to Your Business</h3>
                  <p className="text-sm ink-muted">
                    See HERA configured for your specific industry and workflows
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold ink mb-1">ROI Calculator</h3>
                  <p className="text-sm ink-muted">
                    Get a custom report showing your potential time and cost savings
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold ink mb-1">Implementation Roadmap</h3>
                  <p className="text-sm ink-muted">
                    Clear 30-day plan to go from demo to fully operational
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold ink mb-1">No Pressure</h3>
                  <p className="text-sm ink-muted">
                    Educational consultation with zero sales pressure
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-800/30 p-4">
              <p className="text-sm font-semibold ink">Limited Time Offer</p>
              <p className="mt-1 text-sm ink-muted">
                Book this month and receive free data migration (£2,000 value)
              </p>
            </div>
          </div>

          {/* Calendar Embed */}
          <div className="card-glass rounded-2xl p-8">
            <h2 className="mb-4 text-xl font-semibold ink">Choose a Time That Works for You</h2>

            {/* Microsoft Bookings Link */}
            <div className="rounded-lg bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-800/30 p-8 text-center">
              <div className="mx-auto mb-6 h-16 w-16 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold ink mb-3">Schedule Your Demo</h3>
              <p className="text-sm ink-muted mb-6 max-w-md mx-auto">
                Click below to view available time slots and book a meeting that works for you. You'll be redirected to our Microsoft Bookings page.
              </p>

              {/* Primary Booking Button */}
              <a
                href="https://outlook.office.com/bookwithme/user/368475775c5749b7af8023252bf81f62%40hanaset.com/meetingtype/DVZ72zcUlUGu53YRkUrU7g2?anonymous&ismsaljsauthenabled"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                <Calendar className="w-5 h-5" />
                View Available Times & Book Now
                <ArrowRight className="w-5 h-5" />
              </a>

              <p className="text-xs ink-muted mt-4">
                <Clock className="w-3 h-3 inline mr-1" />
                Most appointments within 24-48 hours
              </p>
            </div>

            <div className="mt-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <p className="text-sm ink-muted">Prefer to talk now?</p>
              </div>
              <p className="font-semibold ink">Call us: 0800 HERA ERP</p>
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          <div className="card-glass rounded-xl p-6">
            <div className="mb-3 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="mb-3 text-sm ink-muted leading-relaxed">
              "The demo was perfectly tailored to our restaurant operations. Saw exactly how it
              would work for us."
            </p>
            <p className="text-sm font-semibold ink">Sarah M., Bristol</p>
          </div>

          <div className="card-glass rounded-xl p-6">
            <div className="mb-3 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="mb-3 text-sm ink-muted leading-relaxed">
              "No pushy sales tactics. Just honest advice about improving our operations.
              Refreshing!"
            </p>
            <p className="text-sm font-semibold ink">James T., Manchester</p>
          </div>

          <div className="card-glass rounded-xl p-6">
            <div className="mb-3 flex gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="mb-3 text-sm ink-muted leading-relaxed">
              "The ROI calculator showed we'd save £3,200/month. We were live in 4 weeks and hit
              those numbers."
            </p>
            <p className="text-sm font-semibold ink">Emma R., Leeds</p>
          </div>
        </div>
      </div>
    </main>
  )
}
