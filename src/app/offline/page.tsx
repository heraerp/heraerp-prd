'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
          </div>
          
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            You&apos;re Offline
          </h1>
          
          <p className="text-gray-400 text-lg">
            HERA is currently unavailable without an internet connection.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-900 rounded-lg p-6 border border-gray-800">
            <h2 className="text-xl font-semibold text-white mb-2">
              What you can do:
            </h2>
            <ul className="text-left text-gray-400 space-y-2">
              <li className="flex items-start">
                <span className="text-cyan-500 mr-2">•</span>
                Check your internet connection
              </li>
              <li className="flex items-start">
                <span className="text-cyan-500 mr-2">•</span>
                Try refreshing the page when connected
              </li>
              <li className="flex items-start">
                <span className="text-cyan-500 mr-2">•</span>
                Previously cached pages may still work
              </li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full hera-button py-3 px-6 rounded-lg font-medium transition-all duration-200"
          >
            Try Again
          </button>
        </div>

        <p className="text-sm text-gray-500">
          HERA Universal ERP • Offline Mode
        </p>
      </div>
    </div>
  );
}