export default function JewelryPage() {
  return (
    <div className="min-h-screen jewelry-gradient-bg flex items-center justify-center">
      <div className="jewelry-glass-card p-8 max-w-4xl mx-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 bg-gold-500 rounded-lg flex items-center justify-center">
            <span className="text-2xl">💎</span>
          </div>
          <h1 className="text-4xl font-bold jewelry-text-luxury mb-4">
            HERA Jewelry ERP
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Complete jewelry business management solution
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="jewelry-glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Inventory</h3>
              <p className="text-gray-600 text-sm">Track diamonds, gemstones, and precious metals with precision</p>
            </div>
            <div className="jewelry-glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Sales</h3>
              <p className="text-gray-600 text-sm">Streamlined point-of-sale for jewelry retail</p>
            </div>
            <div className="jewelry-glass-card p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Certification</h3>
              <p className="text-gray-600 text-sm">Manage appraisals and certificates</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="/jewelry/demo" 
              className="px-6 py-3 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
            >
              View Demo
            </a>
            <a 
              href="/jewelry/dashboard" 
              className="px-6 py-3 border border-gold-500 text-gold-600 rounded-lg hover:bg-gold-50 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
