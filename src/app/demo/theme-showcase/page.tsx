'use client'

import { ThemeProviderDNA, ThemeToggle, useTheme, useIsDarkMode } from '@/lib/dna/theme/theme-provider-dna'
import { StatCardDNA, StatCardGrid } from '@/lib/dna/components/ui/stat-card-dna'
import { iceCreamComponentStyles, iceCreamTailwindClasses } from '@/lib/dna/theme/themes/ice-cream-enterprise'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DollarSign,
  TrendingUp,
  Package,
  Users,
  AlertCircle,
  Calendar,
  Store,
  Snowflake,
  Factory,
  BarChart3
} from 'lucide-react'

function ThemeShowcaseContent() {
  const { theme } = useTheme()
  const isDark = useIsDarkMode()
  const styles = iceCreamComponentStyles
  
  return (
    <div className="min-h-screen bg-background p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            HERA Theme System Showcase
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Ice Cream Enterprise Theme - Professional & Delightful
          </p>
        </div>
        <ThemeToggle showLabel />
      </div>
      
      {/* Color Palette Display */}
      <Card className={iceCreamTailwindClasses.card[isDark ? 'dark' : 'light']}>
        <CardHeader>
          <CardTitle>Theme Colors</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['primary', 'secondary', 'accent', 'success', 'warning', 'danger'].map((color) => (
              <div key={color} className="space-y-2">
                <p className="text-sm font-medium capitalize">{color}</p>
                <div 
                  className={`h-20 rounded-lg shadow-md ${iceCreamTailwindClasses.gradient[color as keyof typeof iceCreamTailwindClasses.gradient]}`}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Stat Cards Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Statistics Cards</h2>
        <p className="text-muted-foreground">
          Notice how the text remains visible in both light and dark modes
        </p>
        
        <StatCardGrid columns={4}>
          <StatCardDNA
            title="Total Revenue"
            value="₹12,45,678"
            change="+12.5% from last month"
            changeType="positive"
            icon={DollarSign}
            iconGradient="from-green-500 to-emerald-500"
          />
          
          <StatCardDNA
            title="Total Products"
            value={248}
            change="24 active SKUs"
            changeType="neutral"
            icon={Package}
            iconGradient="from-blue-500 to-purple-500"
          />
          
          <StatCardDNA
            title="Low Stock Alerts"
            value={12}
            change="Requires attention"
            changeType="negative"
            icon={AlertCircle}
            iconGradient="from-yellow-500 to-orange-500"
          />
          
          <StatCardDNA
            title="Production Today"
            value="2,845 L"
            change="95% efficiency"
            changeType="positive"
            icon={Factory}
            iconGradient="from-pink-500 to-purple-500"
          />
        </StatCardGrid>
      </div>
      
      {/* Buttons Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Buttons</h2>
        <div className="flex flex-wrap gap-4">
          <Button className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white">
            Primary Action
          </Button>
          <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white">
            Secondary Action
          </Button>
          <Button variant="outline">
            Outline Button
          </Button>
          <Button variant="ghost">
            Ghost Button
          </Button>
        </div>
      </div>
      
      {/* Badges Section */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Badges & Status</h2>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
            Active
          </Badge>
          <Badge className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
            Warning
          </Badge>
          <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800">
            Critical
          </Badge>
          <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Information
          </Badge>
          <Badge className="bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
            Premium
          </Badge>
        </div>
      </div>
      
      {/* Table Section */}
      <Card className={styles.table.container}>
        <CardHeader>
          <CardTitle>Data Table Example</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={styles.table.header}>
                <tr>
                  <th className={styles.table.headerCell}>Product</th>
                  <th className={styles.table.headerCell}>Category</th>
                  <th className={styles.table.headerCell}>Stock</th>
                  <th className={styles.table.headerCell}>Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { product: 'Vanilla Ice Cream 500ml', category: 'Classic', stock: 450, status: 'active' },
                  { product: 'Strawberry Delight 1L', category: 'Premium', stock: 23, status: 'low' },
                  { product: 'Chocolate Fudge 250ml', category: 'Classic', stock: 0, status: 'out' },
                  { product: 'Mint Chocolate Chip', category: 'Premium', stock: 189, status: 'active' },
                ].map((item, index) => (
                  <tr 
                    key={index} 
                    className={`
                      ${styles.table.row}
                      ${index % 2 === 1 ? styles.table.rowAlt : ''}
                      ${styles.table.rowHover}
                    `}
                  >
                    <td className={styles.table.cell}>{item.product}</td>
                    <td className={styles.table.cell}>{item.category}</td>
                    <td className={styles.table.cell}>{item.stock}</td>
                    <td className={styles.table.cell}>
                      <Badge 
                        className={
                          item.status === 'active' 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                            : item.status === 'low'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }
                      >
                        {item.status === 'active' ? 'In Stock' : item.status === 'low' ? 'Low Stock' : 'Out of Stock'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Cards with Different Styles */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Card Variants</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 border-pink-200/50 dark:border-pink-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-pink-500" />
                Default Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Standard card with theme colors and proper contrast in both modes.
              </p>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-xl bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-950/20 dark:to-purple-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="w-5 h-5 text-purple-500" />
                Gradient Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Card with subtle gradient background that adapts to theme mode.
              </p>
            </CardContent>
          </Card>
          
          <Card className="backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-2 border-cyan-400 dark:border-cyan-600 shadow-lg shadow-cyan-500/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-cyan-500" />
                Accent Card
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Card with accent border and shadow for emphasis.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Theme Information */}
      <Card className={iceCreamTailwindClasses.card[isDark ? 'dark' : 'light']}>
        <CardHeader>
          <CardTitle>Theme System Benefits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">🎨 Consistent Design Language</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Semantic color tokens for meaning</li>
                <li>• Automatic contrast adjustments</li>
                <li>• Unified spacing and sizing</li>
                <li>• Smooth theme transitions</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">⚡ Performance Optimized</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• CSS variables for instant theming</li>
                <li>• No JS re-renders for theme changes</li>
                <li>• Minimal bundle size impact</li>
                <li>• LocalStorage persistence</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">♿ Accessibility First</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• WCAG AAA contrast ratios</li>
                <li>• Respects system preferences</li>
                <li>• Reduced motion support</li>
                <li>• Semantic HTML structure</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">🔧 Developer Experience</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• TypeScript for type safety</li>
                <li>• Tailwind utility classes</li>
                <li>• Component style helpers</li>
                <li>• Easy theme customization</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function ThemeShowcasePage() {
  return (
    <ThemeProviderDNA defaultTheme="ice-cream-enterprise" defaultMode="system">
      <ThemeShowcaseContent />
    </ThemeProviderDNA>
  )
}