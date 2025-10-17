/**
 * Icon Deduplication Tests
 * Regression shield for lucide import duplicates
 */

import { describe, it, expect } from 'vitest'
import { dedupeIcons, validateImportString, renderImports } from '@/tools/generator/icon-utils'

describe('dedupeIcons', () => {
  it('dedupes lucide imports deterministically', () => {
    const input = ['TrendingUp', 'Plus', 'TrendingUp', 'Trash2', 'Plus']
    const output = dedupeIcons(input)
    
    expect(output).toEqual(['Plus', 'Trash2', 'TrendingUp']) // sorted + unique
  })

  it('maintains order when no duplicates exist', () => {
    const input = ['AlertCircle', 'Building2', 'Calendar']
    const output = dedupeIcons(input)
    
    expect(output).toEqual(['AlertCircle', 'Building2', 'Calendar'])
  })

  it('handles empty array', () => {
    const output = dedupeIcons([])
    expect(output).toEqual([])
  })

  it('handles single item', () => {
    const output = dedupeIcons(['TrendingUp'])
    expect(output).toEqual(['TrendingUp'])
  })

  it('sorts alphabetically', () => {
    const input = ['Zap', 'Apple', 'Building', 'Calendar']
    const output = dedupeIcons(input)
    
    expect(output).toEqual(['Apple', 'Building', 'Calendar', 'Zap'])
  })
})

describe('validateImportString', () => {
  it('passes valid import statements', () => {
    const validImport = 'import { Plus, TrendingUp, Edit } from "lucide-react"'
    expect(() => validateImportString(validImport)).not.toThrow()
  })

  it('catches duplicate imports', () => {
    const duplicateImport = 'import { TrendingUp, Plus, TrendingUp } from "lucide-react"'
    expect(() => validateImportString(duplicateImport)).toThrow('Duplicate icon imports detected: TrendingUp')
  })

  it('catches multiple duplicates', () => {
    const multiDuplicateImport = 'import { Plus, Edit, Plus, Edit, Save } from "lucide-react"'
    expect(() => validateImportString(multiDuplicateImport)).toThrow('Duplicate icon imports detected: Plus, Edit')
  })

  it('handles malformed import strings gracefully', () => {
    const malformedImport = 'not an import statement'
    expect(() => validateImportString(malformedImport)).not.toThrow()
  })

  it('validates multiline imports', () => {
    const multilineImport = `import { 
      TrendingUp,
      Plus,
      Edit,
      TrendingUp
    } from "lucide-react"`
    
    expect(() => validateImportString(multilineImport)).toThrow()
  })
})

describe('renderImports', () => {
  it('generates clean import with config icon', () => {
    const result = renderImports('Building2')
    
    expect(result).toContain('Building2')
    expect(result).toContain('TrendingUp')
    expect(result).toContain('Plus')
    expect(result).toMatch(/import\s*{\s*[\w\s,\n]+\s*}\s*from\s*['"]lucide-react['"]/)
  })

  it('deduplicates config icon if it matches default', () => {
    const result = renderImports('TrendingUp')
    
    // Should only appear once
    const trendingUpMatches = (result.match(/TrendingUp/g) || []).length
    expect(trendingUpMatches).toBe(1)
  })

  it('includes additional icons', () => {
    const result = renderImports('Building2', ['Settings', 'User'])
    
    expect(result).toContain('Building2')
    expect(result).toContain('Settings')
    expect(result).toContain('User')
  })

  it('handles duplicate additional icons', () => {
    const result = renderImports('TrendingUp', ['Plus', 'Plus', 'Settings'])
    
    const plusMatches = (result.match(/Plus/g) || []).length
    expect(plusMatches).toBe(1)
    expect(result).toContain('Settings')
  })

  it('sorts all icons alphabetically', () => {
    const result = renderImports('Zap', ['Alpha'])
    
    // Check that icons are in alphabetical order
    const iconMatch = result.match(/import\s*{\s*([\w\s,\n]+)\s*}/)
    if (iconMatch) {
      const icons = iconMatch[1]
        .split(',')
        .map(icon => icon.trim())
        .filter(Boolean)
      
      const sortedIcons = [...icons].sort()
      expect(icons).toEqual(sortedIcons)
    }
  })

  it('throws if duplicates somehow slip through', () => {
    // This should never happen with proper implementation,
    // but we test the self-validation
    const mockRenderWithBug = (configIcon: string) => {
      return `import { ${configIcon}, TrendingUp, ${configIcon} } from 'lucide-react'`
    }
    
    expect(() => {
      const buggyImport = mockRenderWithBug('Plus')
      validateImportString(buggyImport)
    }).toThrow('Duplicate icon imports detected')
  })
})

describe('Enterprise Entity Icon Tests', () => {
  it('handles all preset entity icons without duplicates', () => {
    const presetIcons = [
      'Building2', // ACCOUNT
      'Users',     // CONTACT
      'Target',    // LEAD
      'TrendingUp', // OPPORTUNITY
      'Calendar',  // ACTIVITY
      'Package',   // PRODUCT
      'UserCheck', // CUSTOMER
      'Building',  // VENDOR
      'User',      // EMPLOYEE
      'FolderOpen', // PROJECT
      'Megaphone'  // CAMPAIGN
    ]
    
    for (const icon of presetIcons) {
      expect(() => {
        const result = renderImports(icon)
        validateImportString(result)
        
        // Ensure the specific icon appears exactly once
        const iconMatches = (result.match(new RegExp(icon, 'g')) || []).length
        expect(iconMatches).toBe(1)
      }).not.toThrow()
    }
  })
})