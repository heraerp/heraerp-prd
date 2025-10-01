import { FOOTPRINT } from '@/data/about'

export default function Footprint() {
  return (
    <div className="space-y-6">
      {FOOTPRINT.map((region, index) => (
        <div key={index} className="card-glass p-6 rounded-2xl">
          <h3 className="ink font-semibold text-xl mb-4">{region.region}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {region.items.map((location, locationIndex) => (
              <div
                key={locationIndex}
                className="flex items-center space-x-2 p-3 rounded-lg bg-gradient-to-r from-gray-50/50 to-gray-100/30 dark:from-gray-800/30 dark:to-gray-700/20 border border-gray-200/30 dark:border-gray-600/20"
              >
                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"></div>
                <span className="ink text-sm font-medium">{location}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
