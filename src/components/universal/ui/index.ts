// HERA Universal UI Components
// Standardized components using PWM-inspired design patterns

export { HeraCard, HeraWealthCard, HeraGlassCard, HeraMetricCard } from './HeraCard';
export type { HeraCardProps } from './HeraCard';

export { HeraMetric, HeraWealthMetric, HeraCompactMetric } from './HeraMetric';
export type { HeraMetricProps } from './HeraMetric';

export { 
  HeraProgress, 
  HeraWealthProgress, 
  HeraGoalProgress, 
  HeraRiskProgress 
} from './HeraProgress';
export type { HeraProgressProps } from './HeraProgress';

export {
  HeraLayout,
  HeraGrid,
  HeraStack,
  HeraResponsive,
  HeraDashboardLayout,
  HeraPageHeader,
  HeraSection
} from './HeraLayout';
export type { 
  HeraLayoutProps, 
  HeraGridProps, 
  HeraStackProps, 
  HeraResponsiveProps 
} from './HeraLayout';

export { HeraThemeProvider, HeraThemeToggle, useTheme } from './HeraThemeProvider';

// Re-export existing universal components
export * from './UniversalLoadingStates';

// CSS Classes for direct usage
export const HERA_CLASSES = {
  // Cards
  card: 'hera-card',
  glassCard: 'hera-glass-card',
  wealthCard: 'hera-wealth-card',
  metricCard: 'hera-metric-card',
  
  // Status
  statusPositive: 'hera-status-positive',
  statusNegative: 'hera-status-negative',
  statusNeutral: 'hera-status-neutral',
  
  // Animations
  fadeIn: 'animate-fade-in',
  slideUp: 'animate-slide-up',
  slideDown: 'animate-slide-down',
  slideLeft: 'animate-slide-left',
  slideRight: 'animate-slide-right',
  scaleIn: 'animate-scale-in',
  bounceIn: 'animate-bounce-in',
  glow: 'animate-glow',
  shimmer: 'animate-shimmer',
  float: 'animate-float',
  pulseSlow: 'animate-pulse-slow',
  
  // Interactive
  interactive: 'hera-interactive',
  
  // Layout
  stackVertical: 'hera-stack-vertical',
  stackHorizontal: 'hera-stack-horizontal',
  center: 'hera-center',
  
  // Surfaces
  surface1: 'hera-surface-1',
  surface2: 'hera-surface-2',
  surfaceElevated: 'hera-surface-elevated',
  
  // Progress
  progressBar: 'hera-progress-bar',
  progressFill: 'hera-progress-fill',
  
  // Glow effects
  glowPrimary: 'hera-glow-primary',
  glowSuccess: 'hera-glow-success',
  glowWarning: 'hera-glow-warning'
} as const;

// Animation delays as utilities
export const HERA_DELAYS = {
  75: 'animate-delay-75',
  100: 'animate-delay-100',
  150: 'animate-delay-150',
  200: 'animate-delay-200',
  300: 'animate-delay-300',
  500: 'animate-delay-500',
  700: 'animate-delay-700',
  1000: 'animate-delay-1000'
} as const;