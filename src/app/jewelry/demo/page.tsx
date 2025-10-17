export default function JewelryDemoPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          Jewelry Industry Demo
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Experience HERA ERP specifically designed for jewelry businesses
        </p>
        <div className="bg-white shadow-lg rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Demo Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Inventory Management</h3>
              <p className="text-sm text-gray-600">Track diamonds, gemstones, and precious metals</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Point of Sale</h3>
              <p className="text-sm text-gray-600">Streamlined jewelry retail transactions</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Customer Management</h3>
              <p className="text-sm text-gray-600">Track customer preferences and purchase history</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-700">Appraisals & Certificates</h3>
              <p className="text-sm text-gray-600">Manage jewelry appraisals and certifications</p>
            </div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-700 text-lg">
            This demo showcases HERA ERP's jewelry-specific features without requiring authentication.
          </p>
        </div>
      </div>
    </div>
  )
}
