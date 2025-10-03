#!/usr/bin/env node

/**
 * HERA Industry Theme Generator
 * Creates enterprise-grade themes for different industries
 */

const fs = require('fs');
const path = require('path');

// Color utilities
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function generateColorPalette(baseColor, industryName) {
  const [h, s, l] = hexToHsl(baseColor);
  
  // Generate enterprise-grade color scale
  const palette = {
    50: hslToHex(h, Math.max(s - 40, 10), Math.min(l + 45, 95)),
    100: hslToHex(h, Math.max(s - 30, 15), Math.min(l + 35, 90)),
    200: hslToHex(h, Math.max(s - 20, 20), Math.min(l + 25, 85)),
    300: hslToHex(h, Math.max(s - 10, 25), Math.min(l + 15, 75)),
    400: hslToHex(h, s, Math.min(l + 5, 65)),
    500: baseColor, // Base color
    600: hslToHex(h, Math.min(s + 10, 90), Math.max(l - 10, 35)),
    700: hslToHex(h, Math.min(s + 15, 95), Math.max(l - 20, 25)),
    800: hslToHex(h, Math.min(s + 20, 100), Math.max(l - 30, 15)),
    900: hslToHex(h, Math.min(s + 25, 100), Math.max(l - 40, 8))
  };

  return palette;
}

// Industry theme configurations
const INDUSTRY_THEMES = {
  jewelry: {
    name: 'Luxury Jewelry',
    primary: '#D4AF00',    // Royal Gold
    secondary: '#2B3A67',  // Royal Blue
    description: 'Elegant gold and royal blue theme for luxury jewelry businesses',
    personality: ['luxury', 'elegant', 'premium', 'sophisticated']
  },
  
  furniture: {
    name: 'Fine Furniture',
    primary: '#8B4513',    // Rich Brown (Saddle Brown)
    secondary: '#D2691E',  // Warm Orange
    description: 'Warm wood tones for furniture and home decor businesses',
    personality: ['warm', 'natural', 'crafted', 'timeless']
  },
  
  healthcare: {
    name: 'Medical & Healthcare',
    primary: '#0066CC',    // Medical Blue
    secondary: '#00A86B',  // Medical Green
    description: 'Trust-inspiring blue and green for healthcare providers',
    personality: ['trustworthy', 'clean', 'professional', 'caring']
  },
  
  automotive: {
    name: 'Automotive Services',
    primary: '#FF6B35',    // Racing Orange
    secondary: '#2C3E50',  // Charcoal
    description: 'Dynamic orange and charcoal for automotive businesses',
    personality: ['dynamic', 'powerful', 'reliable', 'modern']
  },
  
  restaurant: {
    name: 'Fine Dining',
    primary: '#C41E3A',    // Culinary Red
    secondary: '#228B22',  // Fresh Green
    description: 'Appetizing red and fresh green for restaurants',
    personality: ['appetizing', 'fresh', 'inviting', 'vibrant']
  },
  
  salon: {
    name: 'Beauty & Salon',
    primary: '#E91E63',    // Beauty Pink
    secondary: '#9C27B0',  // Elegant Purple
    description: 'Stylish pink and purple for beauty and salon services',
    personality: ['stylish', 'elegant', 'modern', 'glamorous']
  },
  
  fitness: {
    name: 'Fitness & Wellness',
    primary: '#4CAF50',    // Energy Green
    secondary: '#FF9800',  // Motivation Orange
    description: 'Energetic green and orange for fitness businesses',
    personality: ['energetic', 'motivating', 'healthy', 'active']
  },
  
  legal: {
    name: 'Legal Services',
    primary: '#1565C0',    // Professional Blue
    secondary: '#424242',  // Sophisticated Gray
    description: 'Professional blue and gray for law firms',
    personality: ['professional', 'trustworthy', 'authoritative', 'sophisticated']
  },
  
  real_estate: {
    name: 'Real Estate',
    primary: '#2E7D32',    // Property Green
    secondary: '#F57C00',  // Luxury Gold
    description: 'Stable green and luxury gold for real estate',
    personality: ['stable', 'prosperous', 'luxurious', 'trustworthy']
  },
  
  consulting: {
    name: 'Business Consulting',
    primary: '#5E35B1',    // Strategic Purple
    secondary: '#00BCD4',  // Innovation Cyan
    description: 'Strategic purple and cyan for consulting firms',
    personality: ['strategic', 'innovative', 'intelligent', 'forward-thinking']
  }
};

class IndustryThemeGenerator {
  constructor() {
    this.outputDir = path.join(process.cwd(), 'src', 'styles', 'themes');
  }

  generateTheme(industryKey, config) {
    const primaryPalette = generateColorPalette(config.primary, config.name);
    const secondaryPalette = generateColorPalette(config.secondary, config.name);
    
    // Generate CSS variables
    const cssContent = this.generateCSSVariables(industryKey, config, primaryPalette, secondaryPalette);
    
    // Generate TypeScript theme object
    const tsContent = this.generateTypeScriptTheme(industryKey, config, primaryPalette, secondaryPalette);
    
    // Generate Tailwind config
    const tailwindContent = this.generateTailwindConfig(industryKey, primaryPalette, secondaryPalette);
    
    return {
      css: cssContent,
      typescript: tsContent,
      tailwind: tailwindContent,
      config
    };
  }

  generateCSSVariables(industryKey, config, primary, secondary) {
    return `/**
 * ${config.name} Theme - Enterprise Grade
 * ${config.description}
 * Personality: ${config.personality.join(', ')}
 */

:root {
  /* Primary Color Palette */
  --${industryKey}-primary-50: ${primary[50]};
  --${industryKey}-primary-100: ${primary[100]};
  --${industryKey}-primary-200: ${primary[200]};
  --${industryKey}-primary-300: ${primary[300]};
  --${industryKey}-primary-400: ${primary[400]};
  --${industryKey}-primary-500: ${primary[500]};
  --${industryKey}-primary-600: ${primary[600]};
  --${industryKey}-primary-700: ${primary[700]};
  --${industryKey}-primary-800: ${primary[800]};
  --${industryKey}-primary-900: ${primary[900]};

  /* Secondary Color Palette */
  --${industryKey}-secondary-50: ${secondary[50]};
  --${industryKey}-secondary-100: ${secondary[100]};
  --${industryKey}-secondary-200: ${secondary[200]};
  --${industryKey}-secondary-300: ${secondary[300]};
  --${industryKey}-secondary-400: ${secondary[400]};
  --${industryKey}-secondary-500: ${secondary[500]};
  --${industryKey}-secondary-600: ${secondary[600]};
  --${industryKey}-secondary-700: ${secondary[700]};
  --${industryKey}-secondary-800: ${secondary[800]};
  --${industryKey}-secondary-900: ${secondary[900]};

  /* Enterprise Text Colors (WCAG AA Compliant) */
  --${industryKey}-text-high-contrast: #1F2937;
  --${industryKey}-text-medium-contrast: #374151;
  --${industryKey}-text-low-contrast: #6B7280;
  --${industryKey}-text-accent: var(--${industryKey}-primary-600);

  /* Glassmorphism Variables */
  --${industryKey}-glass-backdrop: rgba(255, 255, 255, 0.95);
  --${industryKey}-glass-surface: rgba(255, 255, 255, 0.85);
  --${industryKey}-glass-border: rgba(${this.hexToRgb(primary[500])}, 0.15);
  --${industryKey}-glass-shadow: 0 4px 16px 0 rgba(${this.hexToRgb(secondary[900])}, 0.15);
  --${industryKey}-glass-shadow-large: 0 8px 32px 0 rgba(${this.hexToRgb(secondary[900])}, 0.25);
  --${industryKey}-glass-blur: 8px;
}

/* Dark mode adjustments */
.dark {
  --${industryKey}-text-high-contrast: #F9FAFB;
  --${industryKey}-text-medium-contrast: #F3F4F6;
  --${industryKey}-text-low-contrast: #D1D5DB;
  --${industryKey}-glass-backdrop: rgba(${this.hexToRgb(secondary[900])}, 0.95);
  --${industryKey}-glass-surface: rgba(${this.hexToRgb(secondary[800])}, 0.3);
  --${industryKey}-glass-border: rgba(${this.hexToRgb(primary[400])}, 0.2);
}

/* Enterprise Component Classes */
.${industryKey}-glass-card {
  background: var(--${industryKey}-glass-surface);
  backdrop-filter: blur(var(--${industryKey}-glass-blur));
  -webkit-backdrop-filter: blur(var(--${industryKey}-glass-blur));
  border: 1px solid var(--${industryKey}-glass-border);
  border-radius: 0.75rem;
  box-shadow: var(--${industryKey}-glass-shadow);
  transition: all 0.2s ease;
}

.${industryKey}-glass-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--${industryKey}-glass-shadow-large);
  border-color: var(--${industryKey}-primary-400);
}

.${industryKey}-text-primary {
  color: var(--${industryKey}-text-high-contrast) !important;
}

.${industryKey}-text-secondary {
  color: var(--${industryKey}-text-medium-contrast) !important;
}

.${industryKey}-text-muted {
  color: var(--${industryKey}-text-low-contrast) !important;
}

.${industryKey}-text-accent {
  color: var(--${industryKey}-text-accent) !important;
}

.${industryKey}-btn-primary {
  background: var(--${industryKey}-primary-600);
  color: white;
  border: 2px solid var(--${industryKey}-primary-600);
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.${industryKey}-btn-primary:hover {
  background: var(--${industryKey}-primary-700);
  border-color: var(--${industryKey}-primary-700);
  transform: translateY(-1px);
}

.${industryKey}-btn-secondary {
  background: transparent;
  color: var(--${industryKey}-primary-600);
  border: 2px solid var(--${industryKey}-primary-400);
  border-radius: 0.5rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  transition: all 0.2s ease;
}

.${industryKey}-btn-secondary:hover {
  background: var(--${industryKey}-primary-50);
  border-color: var(--${industryKey}-primary-600);
}

/* Gradient backgrounds */
.${industryKey}-gradient-primary {
  background: linear-gradient(135deg, 
    var(--${industryKey}-primary-500) 0%, 
    var(--${industryKey}-secondary-500) 100%);
}

.${industryKey}-gradient-subtle {
  background: linear-gradient(135deg, 
    var(--${industryKey}-primary-50) 0%, 
    var(--${industryKey}-secondary-50) 100%);
}`;
  }

  hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  }

  generateTypeScriptTheme(industryKey, config, primary, secondary) {
    return `/**
 * ${config.name} Theme Configuration
 * Generated automatically - do not edit manually
 */

export interface IndustryTheme {
  name: string;
  key: string;
  description: string;
  personality: string[];
  colors: {
    primary: ColorPalette;
    secondary: ColorPalette;
  };
  cssVars: {
    textHighContrast: string;
    textMediumContrast: string;
    textLowContrast: string;
    textAccent: string;
  };
  components: {
    glassmorphism: boolean;
    enterpriseSpacing: boolean;
    roleBasedUI: boolean;
  };
}

interface ColorPalette {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

export const ${industryKey}Theme: IndustryTheme = {
  name: '${config.name}',
  key: '${industryKey}',
  description: '${config.description}',
  personality: ${JSON.stringify(config.personality, null, 2)},
  colors: {
    primary: ${JSON.stringify(primary, null, 4)},
    secondary: ${JSON.stringify(secondary, null, 4)}
  },
  cssVars: {
    textHighContrast: 'var(--${industryKey}-text-high-contrast)',
    textMediumContrast: 'var(--${industryKey}-text-medium-contrast)',
    textLowContrast: 'var(--${industryKey}-text-low-contrast)',
    textAccent: 'var(--${industryKey}-text-accent)'
  },
  components: {
    glassmorphism: true,
    enterpriseSpacing: true,
    roleBasedUI: true
  }
};

export default ${industryKey}Theme;`;
  }

  generateTailwindConfig(industryKey, primary, secondary) {
    return `/**
 * Tailwind CSS configuration for ${industryKey} theme
 * Add this to your tailwind.config.js
 */

module.exports = {
  theme: {
    extend: {
      colors: {
        '${industryKey}-primary': ${JSON.stringify(primary, null, 8)},
        '${industryKey}-secondary': ${JSON.stringify(secondary, null, 8)}
      },
      spacing: {
        'enterprise-xs': '0.25rem',  // 4px
        'enterprise-sm': '0.5rem',   // 8px
        'enterprise-md': '0.75rem',  // 12px
        'enterprise-lg': '1rem',     // 16px
        'enterprise-xl': '1.5rem',   // 24px (standard)
        'enterprise-2xl': '2rem',    // 32px
        'enterprise-3xl': '3rem'     // 48px
      },
      backdropBlur: {
        'enterprise': '8px',
        'enterprise-strong': '12px'
      }
    }
  }
};`;
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  writeThemeFiles(industryKey, themeData) {
    this.ensureOutputDirectory();
    
    // Write CSS file
    const cssPath = path.join(this.outputDir, `${industryKey}-theme.css`);
    fs.writeFileSync(cssPath, themeData.css);
    
    // Write TypeScript file
    const tsPath = path.join(this.outputDir, `${industryKey}-theme.ts`);
    fs.writeFileSync(tsPath, themeData.typescript);
    
    // Write Tailwind config
    const tailwindPath = path.join(this.outputDir, `${industryKey}-tailwind.js`);
    fs.writeFileSync(tailwindPath, themeData.tailwind);
    
    return {
      cssPath,
      tsPath,
      tailwindPath
    };
  }

  generateAllThemes() {
    console.log('🎨 Generating enterprise themes for all industries...\n');
    
    const results = {};
    
    for (const [industryKey, config] of Object.entries(INDUSTRY_THEMES)) {
      console.log(`🎯 Generating theme: ${config.name}`);
      
      const themeData = this.generateTheme(industryKey, config);
      const paths = this.writeThemeFiles(industryKey, themeData);
      
      results[industryKey] = {
        config,
        paths,
        palette: {
          primary: generateColorPalette(config.primary, config.name),
          secondary: generateColorPalette(config.secondary, config.name)
        }
      };
      
      console.log(`   ✅ CSS: ${path.basename(paths.cssPath)}`);
      console.log(`   ✅ TypeScript: ${path.basename(paths.tsPath)}`);
      console.log(`   ✅ Tailwind: ${path.basename(paths.tailwindPath)}`);
      console.log('');
    }
    
    // Generate index file
    this.generateIndexFile(results);
    
    console.log('🏆 All enterprise themes generated successfully!');
    console.log(`📁 Output directory: ${this.outputDir}`);
    
    return results;
  }

  generateIndexFile(results) {
    const indexContent = `/**
 * HERA Enterprise Theme Registry
 * All industry themes with enterprise-grade quality
 */

${Object.keys(results).map(key => 
  `import ${key}Theme from './${key}-theme';`
).join('\n')}

export const AVAILABLE_THEMES = {
${Object.keys(results).map(key => 
  `  ${key}: ${key}Theme`
).join(',\n')}
};

export const THEME_REGISTRY = [
${Object.entries(results).map(([key, data]) => 
  `  {
    key: '${key}',
    name: '${data.config.name}',
    description: '${data.config.description}',
    personality: ${JSON.stringify(data.config.personality)},
    primary: '${data.config.primary}',
    secondary: '${data.config.secondary}',
    theme: ${key}Theme
  }`
).join(',\n')}
];

export function getTheme(industryKey: string) {
  return AVAILABLE_THEMES[industryKey as keyof typeof AVAILABLE_THEMES];
}

export function getThemeList() {
  return THEME_REGISTRY;
}

export default AVAILABLE_THEMES;`;

    const indexPath = path.join(this.outputDir, 'index.ts');
    fs.writeFileSync(indexPath, indexContent);
    
    console.log(`✅ Theme registry: ${path.basename(indexPath)}`);
  }
}

// CLI interface
function main() {
  const args = process.argv.slice(2);
  const generator = new IndustryThemeGenerator();
  
  if (args.length === 0) {
    // Generate all themes
    generator.generateAllThemes();
  } else if (args[0] === 'list') {
    // List available themes
    console.log('🎨 Available Industry Themes:\n');
    Object.entries(INDUSTRY_THEMES).forEach(([key, config]) => {
      console.log(`🎯 ${key}`);
      console.log(`   Name: ${config.name}`);
      console.log(`   Primary: ${config.primary}`);
      console.log(`   Secondary: ${config.secondary}`);
      console.log(`   Description: ${config.description}`);
      console.log(`   Personality: ${config.personality.join(', ')}`);
      console.log('');
    });
  } else {
    // Generate specific theme
    const industryKey = args[0];
    if (INDUSTRY_THEMES[industryKey]) {
      console.log(`🎨 Generating theme for: ${INDUSTRY_THEMES[industryKey].name}`);
      
      const themeData = generator.generateTheme(industryKey, INDUSTRY_THEMES[industryKey]);
      const paths = generator.writeThemeFiles(industryKey, themeData);
      
      console.log('✅ Theme generated successfully!');
      console.log(`📁 Files created:`);
      console.log(`   ${paths.cssPath}`);
      console.log(`   ${paths.tsPath}`);
      console.log(`   ${paths.tailwindPath}`);
    } else {
      console.error(`❌ Unknown industry: ${industryKey}`);
      console.log(`Available: ${Object.keys(INDUSTRY_THEMES).join(', ')}`);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = { IndustryThemeGenerator, INDUSTRY_THEMES };