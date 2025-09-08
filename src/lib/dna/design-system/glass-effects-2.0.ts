/**
 * HERA DNA Glass Effects 2.0
 * Enterprise-grade glassmorphism system with SAP Fiori integration
 * Provides multi-layer glass effects with performance optimization
 */

import { CSSProperties } from 'react';

export type GlassIntensity = 'subtle' | 'medium' | 'strong' | 'ultra';
export type GlassVariant = 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'premium';

/**
 * Advanced glass effect configuration
 */
export interface GlassConfig {
  intensity: GlassIntensity;
  variant: GlassVariant;
  enableShine?: boolean;
  enableParticles?: boolean;
  enableDepth?: boolean;
  customColor?: string;
}

/**
 * Glass effect properties for CSS-in-JS
 */
export interface GlassStyle extends CSSProperties {
  backdropFilter: string;
  background: string;
  border: string;
  boxShadow: string;
  position?: 'relative' | 'absolute' | 'fixed' | 'sticky';
  overflow?: string;
}

/**
 * Enterprise glass effects with multiple layers
 */
export const GlassEffects2 = {
  /**
   * Base glass configurations by intensity
   */
  base: {
    subtle: {
      backdropFilter: 'blur(8px) saturate(150%)',
      background: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: `
        0 2px 8px rgba(0, 0, 0, 0.04),
        inset 0 0 0 1px rgba(255, 255, 255, 0.05)
      `.trim(),
    },
    medium: {
      backdropFilter: 'blur(20px) saturate(180%)',
      background: 'rgba(255, 255, 255, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
      boxShadow: `
        0 8px 32px rgba(0, 0, 0, 0.08),
        inset 0 0 0 1px rgba(255, 255, 255, 0.08),
        inset 0 -1px 0 rgba(0, 0, 0, 0.1)
      `.trim(),
    },
    strong: {
      backdropFilter: 'blur(40px) saturate(200%)',
      background: 'rgba(255, 255, 255, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
      boxShadow: `
        0 12px 48px rgba(0, 0, 0, 0.12),
        0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 0 0 1px rgba(255, 255, 255, 0.1),
        inset 0 -2px 0 rgba(0, 0, 0, 0.15)
      `.trim(),
    },
    ultra: {
      backdropFilter: 'blur(60px) saturate(250%) brightness(1.1)',
      background: 'rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.25)',
      boxShadow: `
        0 20px 60px rgba(0, 0, 0, 0.15),
        0 0 0 1px rgba(255, 255, 255, 0.2),
        inset 0 0 20px rgba(255, 255, 255, 0.05),
        inset 0 -3px 0 rgba(0, 0, 0, 0.2)
      `.trim(),
    },
  },

  /**
   * Colored glass variants
   */
  variants: {
    default: {
      background: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    primary: {
      background: 'rgba(59, 130, 246, 0.1)',
      borderColor: 'rgba(59, 130, 246, 0.2)',
      boxShadow: '0 8px 32px rgba(59, 130, 246, 0.15)',
    },
    success: {
      background: 'rgba(34, 197, 94, 0.1)',
      borderColor: 'rgba(34, 197, 94, 0.2)',
      boxShadow: '0 8px 32px rgba(34, 197, 94, 0.15)',
    },
    warning: {
      background: 'rgba(251, 146, 60, 0.1)',
      borderColor: 'rgba(251, 146, 60, 0.2)',
      boxShadow: '0 8px 32px rgba(251, 146, 60, 0.15)',
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.1)',
      borderColor: 'rgba(239, 68, 68, 0.2)',
      boxShadow: '0 8px 32px rgba(239, 68, 68, 0.15)',
    },
    premium: {
      background: `linear-gradient(
        135deg,
        rgba(168, 85, 247, 0.1) 0%,
        rgba(59, 130, 246, 0.1) 50%,
        rgba(34, 197, 94, 0.1) 100%
      )`,
      borderColor: 'rgba(168, 85, 247, 0.2)',
      boxShadow: `
        0 20px 60px rgba(168, 85, 247, 0.2),
        inset 0 0 40px rgba(255, 255, 255, 0.1)
      `.trim(),
    },
  },

  /**
   * Interactive states
   */
  states: {
    hover: {
      transform: 'translateY(-2px) scale(1.005)',
      boxShadow: `
        0 12px 40px rgba(0, 0, 0, 0.15),
        inset 0 0 0 1px rgba(255, 255, 255, 0.2)
      `.trim(),
      background: 'rgba(255, 255, 255, 0.15)',
    },
    active: {
      transform: 'translateY(0) scale(0.995)',
      boxShadow: `
        inset 0 2px 4px rgba(0, 0, 0, 0.2),
        0 1px 2px rgba(0, 0, 0, 0.1)
      `.trim(),
      background: 'rgba(255, 255, 255, 0.05)',
    },
    focus: {
      outline: '2px solid rgba(59, 130, 246, 0.5)',
      outlineOffset: '2px',
      boxShadow: `
        0 0 0 4px rgba(59, 130, 246, 0.1),
        0 8px 32px rgba(0, 0, 0, 0.1)
      `.trim(),
    },
    disabled: {
      opacity: 0.5,
      filter: 'grayscale(50%)',
      cursor: 'not-allowed',
      pointerEvents: 'none',
    },
  },

  /**
   * Special effects
   */
  effects: {
    shine: {
      position: 'relative',
      overflow: 'hidden',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: `linear-gradient(
          45deg,
          transparent 30%,
          rgba(255, 255, 255, 0.1) 50%,
          transparent 70%
        )`,
        transform: 'rotate(45deg) translateX(-100%)',
        animation: 'shine 3s ease-in-out infinite',
      },
    },
    particles: {
      position: 'relative',
      '&::after': {
        content: '""',
        position: 'absolute',
        inset: 0,
        backgroundImage: `radial-gradient(
          circle at 20% 50%,
          rgba(255, 255, 255, 0.1) 0%,
          transparent 50%
        )`,
        opacity: 0.5,
        animation: 'float 20s ease-in-out infinite',
      },
    },
    depth: {
      transformStyle: 'preserve-3d',
      transform: 'perspective(1000px) rotateX(1deg)',
      boxShadow: `
        0 50px 100px rgba(0, 0, 0, 0.2),
        0 20px 40px rgba(0, 0, 0, 0.15),
        0 10px 20px rgba(0, 0, 0, 0.1)
      `.trim(),
    },
  },

  /**
   * Dark mode adjustments
   */
  darkMode: {
    subtle: {
      background: 'rgba(0, 0, 0, 0.1)',
      border: '1px solid rgba(255, 255, 255, 0.05)',
    },
    medium: {
      background: 'rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
    },
    strong: {
      background: 'rgba(0, 0, 0, 0.3)',
      border: '1px solid rgba(255, 255, 255, 0.15)',
    },
    ultra: {
      background: 'rgba(0, 0, 0, 0.4)',
      border: '1px solid rgba(255, 255, 255, 0.2)',
    },
  },
};

/**
 * Get glass effect styles based on configuration
 */
export function getGlassEffect(config: GlassConfig): GlassStyle {
  const baseEffect = GlassEffects2.base[config.intensity];
  const variantStyles = config.variant !== 'default' 
    ? GlassEffects2.variants[config.variant] 
    : {};

  let style: GlassStyle = {
    ...baseEffect,
    position: 'relative',
    overflow: 'hidden',
  };

  // Apply variant styles
  if (variantStyles.background) {
    style.background = variantStyles.background;
  }
  if (variantStyles.borderColor) {
    style.border = `1px solid ${variantStyles.borderColor}`;
  }
  if (variantStyles.boxShadow) {
    style.boxShadow = `${baseEffect.boxShadow}, ${variantStyles.boxShadow}`;
  }

  // Apply custom color if provided
  if (config.customColor) {
    style.background = config.customColor;
  }

  return style;
}

/**
 * Glass effect CSS classes for Tailwind
 */
export const glassClasses = {
  base: 'backdrop-blur-xl bg-white/10 border border-white/20 shadow-xl',
  hover: 'hover:-translate-y-0.5 hover:shadow-2xl hover:bg-white/15',
  active: 'active:translate-y-0 active:shadow-inner',
  focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2',
  transition: 'transition-all duration-700 ease-out',
  
  // Intensity variants
  subtle: 'backdrop-blur bg-white/5 border-white/10',
  medium: 'backdrop-blur-xl bg-white/10 border-white/15',
  strong: 'backdrop-blur-2xl bg-white/15 border-white/20',
  ultra: 'backdrop-blur-3xl bg-white/20 border-white/25',
  
  // Color variants
  primary: 'bg-blue-500/10 border-blue-500/20',
  success: 'bg-green-500/10 border-green-500/20',
  warning: 'bg-amber-500/10 border-amber-500/20',
  danger: 'bg-red-500/10 border-red-500/20',
  
  // Special effects
  shine: 'relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:-translate-x-full hover:before:translate-x-full before:transition-transform before:duration-1000',
  glow: 'shadow-[0_0_40px_rgba(59,130,246,0.3)]',
  premium: 'bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-emerald-500/10',
};

/**
 * Animation keyframes for glass effects
 */
export const glassAnimations = `
  @keyframes shine {
    0% { transform: rotate(45deg) translateX(-100%); }
    100% { transform: rotate(45deg) translateX(100%); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0) scale(1); }
    50% { transform: translateY(-10px) scale(1.05); }
  }
  
  @keyframes pulse-glow {
    0%, 100% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); }
    50% { box-shadow: 0 0 40px rgba(59, 130, 246, 0.4); }
  }
`;

/**
 * Performance-optimized glass effect hook
 */
export function useGlassEffect(config: GlassConfig) {
  const styles = getGlassEffect(config);
  
  // Add will-change for performance
  if (config.enableShine || config.enableParticles) {
    styles.willChange = 'transform, opacity';
  }
  
  return {
    styles,
    className: `
      ${glassClasses.base}
      ${glassClasses[config.intensity]}
      ${config.variant !== 'default' ? glassClasses[config.variant] : ''}
      ${glassClasses.transition}
      ${glassClasses.hover}
      ${glassClasses.active}
      ${glassClasses.focus}
      ${config.enableShine ? glassClasses.shine : ''}
      ${config.variant === 'premium' ? glassClasses.premium : ''}
    `.trim().replace(/\s+/g, ' '),
  };
}