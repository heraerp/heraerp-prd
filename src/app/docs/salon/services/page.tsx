export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-300 mb-8">
          <a href="/docs" className="hover:text-emerald-600">Docs</a>
          <span>/</span>
          <a href="/docs/salon" className="hover:text-emerald-600">Salon</a>
          <span>/</span>
          <span className="text-gray-800 dark:text-gray-200">Service Catalog</span>
        </nav>

        {/* Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-4xl font-bold mb-6 text-gray-800 dark:text-gray-100">Service Catalog</h1>
          <p className="text-gray-500 dark:text-gray-300 mb-8">
            Dynamic service configuration and pricing management
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Overview</h2>
              <p className="text-gray-500 dark:text-gray-300">
                The service catalog allows you to define and manage all salon services with flexible pricing, 
                duration settings, and staff assignments. Services can be customized per branch with specific 
                pricing and availability.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Service Categories</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-500 dark:text-gray-300">
                <li>Hair Services - Cuts, colors, treatments, styling</li>
                <li>Nail Services - Manicures, pedicures, nail art</li>
                <li>Spa Services - Facials, massages, body treatments</li>
                <li>Beauty Services - Makeup, eyebrows, lashes</li>
                <li>Package Deals - Bundled services with discounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Features</h2>
              <ul className="list-disc pl-6 space-y-2 text-gray-500 dark:text-gray-300">
                <li>Flexible pricing with seasonal adjustments</li>
                <li>Service duration and resource requirements</li>
                <li>Staff skill mapping and assignments</li>
                <li>Commission structure per service</li>
                <li>Branch-specific availability</li>
                <li>Online booking enablement</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4 text-gray-800 dark:text-gray-100">Documentation Coming Soon</h2>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                <p className="text-emerald-800 dark:text-emerald-200">
                  Complete service catalog documentation is being prepared. 
                  This will include setup guides, pricing strategies, and best practices.
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}