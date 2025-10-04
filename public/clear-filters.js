// Utility script to clear all stuck filters
// Run this in the browser console if you're experiencing filter issues

(function clearAllFilters() {
  let cleared = 0;
  
  // Clear branch filters
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('branch-filter-') || key.includes('filter-'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    console.log('🗑️ Removing:', key, '=', localStorage.getItem(key));
    localStorage.removeItem(key);
    cleared++;
  });
  
  // Also clear any other known filter keys
  const knownFilterKeys = [
    'selected-branch',
    'salon-appointments-list-branch',
    'salon-selected-branch',
    'appointment-filters'
  ];
  
  knownFilterKeys.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log('🗑️ Removing:', key, '=', localStorage.getItem(key));
      localStorage.removeItem(key);
      cleared++;
    }
  });
  
  console.log(`✅ Cleared ${cleared} filter entries from localStorage`);
  console.log('🔄 Please refresh the page to see the changes');
  
  return cleared;
})();