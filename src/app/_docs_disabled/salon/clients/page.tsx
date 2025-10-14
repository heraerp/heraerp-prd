export default function ClientsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-300 mb-8">
          <a href="/docs" className="hover:text-emerald-600">
            Docs
          </a>
          <span>/</span>
          <a href="/docs/salon" className="hover:text-emerald-600">
            Salon
          </a>
          <span>/</span>
          <span className="text-gray-800 dark:text-gray-200">Client Management</span>
        </nav>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">
            Client Management
          </h1>
          <p className="text-gray-500 dark:text-gray-300 mb-8">
            Comprehensive client relationship management for salons
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Overview
              </h2>
              <p className="text-gray-500 dark:text-gray-300">
                The HERA Salon client management system provides a complete 360° view of your
                customers, including visit history, preferences, loyalty points, and communication
                tracking.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Key Features
              </h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-500 dark:text-gray-300">
                <li>Client profile with photo and contact details</li>
                <li>Service history and preferences</li>
                <li>Product purchase tracking</li>
                <li>Loyalty points and rewards</li>
                <li>Appointment history and no-show tracking</li>
                <li>Communication log (SMS, email, calls)</li>
                <li>Notes and special requirements</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Documentation Coming Soon
              </h2>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <p className="text-emerald-800 dark:text-emerald-200">
                  Full documentation for client management is currently being prepared. Check back
                  soon for detailed guides and best practices.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
