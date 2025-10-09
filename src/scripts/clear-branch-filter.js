// Clear all persisted branch filters from localStorage
// This script helps reset branch filters that might be stuck on a specific branch

if (typeof window !== 'undefined') {
  // Clear all branch filter keys
  const keysToRemove = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.includes('branch-filter-')) {
      keysToRemove.push(key)
    }
  }

  keysToRemove.forEach(key => {
    console.log('Removing localStorage key:', key, 'value:', localStorage.getItem(key))
    localStorage.removeItem(key)
  })

  console.log(`Cleared ${keysToRemove.length} branch filter keys from localStorage`)

  // Also clear any legacy branch selection keys
  localStorage.removeItem('selected-branch')
  localStorage.removeItem('salon-appointments-list-branch')

  console.log('Branch filters cleared. Please refresh the page.')
} else {
  console.log('Run this script in the browser console to clear branch filters')
}
