/**
 * Icon Import Utilities
 * Bulletproof deduplication for Lucide React imports
 */

/**
 * Deduplicate and sort icon imports deterministically
 * @param input Array of icon names (may contain duplicates)
 * @returns Sorted, unique array of icon names
 */
export function dedupeIcons(input: string[]): string[] {
  return Array.from(new Set(input)).sort((a, b) => a.localeCompare(b))
}

/**
 * Validate that no duplicate icons exist in import string
 * @param importString Generated import statement
 * @throws Error if duplicates detected
 */
export function validateImportString(importString: string): void {
  // Extract icon names from import string
  const importMatch = importString.match(/import\s*{\s*([^}]+)\s*}\s*from/)
  if (!importMatch) return

  const iconNames = importMatch[1]
    .split(',')
    .map(name => name.trim())
    .filter(Boolean)

  const uniqueNames = new Set(iconNames)
  
  if (iconNames.length !== uniqueNames.size) {
    const duplicates = iconNames.filter((name, index, arr) => arr.indexOf(name) !== index)
    throw new Error(`Duplicate icon imports detected: ${duplicates.join(', ')}`)
  }
}

/**
 * Render imports with guaranteed deduplication
 * @param configIcon Primary icon from entity config
 * @param additionalIcons Other required icons
 * @returns Clean import statement
 */
export function renderImports(configIcon: string, additionalIcons: string[] = []): string {
  const defaultIcons = [
    'TrendingUp', 
    'Plus', 
    'Edit',
    'Trash2',
    'X',
    'Save',
    'Eye',
    'Download',
    'Upload',
    'Search',
    'Filter',
    'MoreVertical',
    'AlertCircle',
    'CheckCircle',
    'Clock'
  ]
  
  const allIcons = [configIcon, ...defaultIcons, ...additionalIcons]
  const uniqueIcons = dedupeIcons(allIcons)
  const importString = `import { 
  ${uniqueIcons.join(',\n  ')}
} from 'lucide-react'`

  // Self-validation
  validateImportString(importString)
  
  return importString
}