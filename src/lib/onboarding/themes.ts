/**
 * HERA Universal Onboarding - Theme System
 * 
 * Provides light, dark, and high-contrast themes for Joyride
 * Follows HERA DNA design principles with oklch colors
 */

import type { Styles as JoyrideStyles } from 'react-joyride';
import type { OnboardingTheme } from './types';

/**
 * HERA brand colors in oklch format
 * Matches the design system from globals.css
 */
const heraColors = {
  // Primary colors
  primaryBlue: 'oklch(0.57 0.192 250)',
  cyanSecondary: 'oklch(0.68 0.12 200)',
  emeraldAccent: 'oklch(0.64 0.12 160)',
  amberGold: 'oklch(0.69 0.12 85)',
  purple: 'oklch(0.58 0.192 280)',
  
  // Neutral colors
  white: '#ffffff',
  black: '#000000',
  gray50: 'rgb(249 250 251)',
  gray100: 'rgb(243 244 246)',
  gray200: 'rgb(229 231 235)',
  gray300: 'rgb(209 213 219)',
  gray400: 'rgb(156 163 175)',
  gray500: 'rgb(107 114 128)',
  gray600: 'rgb(75 85 99)',
  gray700: 'rgb(55 65 81)',
  gray800: 'rgb(31 41 55)',
  gray900: 'rgb(17 24 39)',
  
  // Semantic colors
  success: 'oklch(0.64 0.12 160)',
  warning: 'oklch(0.69 0.12 85)',
  error: 'oklch(0.55 0.192 20)',
  info: 'oklch(0.68 0.12 200)',
};

/**
 * Light theme configuration
 */
export const lightTheme: OnboardingTheme = {
  name: 'light',
  tokens: {
    bubbleBackground: heraColors.white,
    bubbleText: heraColors.gray900,
    beaconColor: heraColors.primaryBlue,
    overlayColor: 'rgba(0, 0, 0, 0.5)',
    spotlightBorder: heraColors.primaryBlue,
    buttonBackground: heraColors.primaryBlue,
    buttonText: heraColors.white,
    buttonHover: heraColors.cyanSecondary,
    skipLinkColor: heraColors.gray500,
    progressBarBackground: heraColors.gray200,
    progressBarFill: heraColors.primaryBlue,
  },
};

/**
 * Dark theme configuration
 */
export const darkTheme: OnboardingTheme = {
  name: 'dark',
  tokens: {
    bubbleBackground: heraColors.gray800,
    bubbleText: heraColors.gray100,
    beaconColor: heraColors.cyanSecondary,
    overlayColor: 'rgba(0, 0, 0, 0.8)',
    spotlightBorder: heraColors.cyanSecondary,
    buttonBackground: heraColors.cyanSecondary,
    buttonText: heraColors.gray900,
    buttonHover: heraColors.emeraldAccent,
    skipLinkColor: heraColors.gray400,
    progressBarBackground: heraColors.gray700,
    progressBarFill: heraColors.cyanSecondary,
  },
};

/**
 * High contrast theme for accessibility
 */
export const highContrastTheme: OnboardingTheme = {
  name: 'highContrast',
  tokens: {
    bubbleBackground: heraColors.black,
    bubbleText: heraColors.white,
    beaconColor: heraColors.amberGold,
    overlayColor: 'rgba(0, 0, 0, 0.9)',
    spotlightBorder: heraColors.amberGold,
    buttonBackground: heraColors.white,
    buttonText: heraColors.black,
    buttonHover: heraColors.amberGold,
    skipLinkColor: heraColors.white,
    progressBarBackground: heraColors.gray800,
    progressBarFill: heraColors.amberGold,
  },
};

/**
 * Get theme by name with fallback
 */
export function getTheme(themeName: 'light' | 'dark' | 'highContrast' = 'light'): OnboardingTheme {
  switch (themeName) {
    case 'dark':
      return darkTheme;
    case 'highContrast':
      return highContrastTheme;
    default:
      return lightTheme;
  }
}

/**
 * Convert HERA theme tokens to Joyride styles
 */
export function getJoyrideStyles(theme: OnboardingTheme): JoyrideStyles {
  const { tokens } = theme;
  
  return {
    beacon: {
      color: tokens.beaconColor,
      // Increase size for better visibility
      inner: {
        width: 20,
        height: 20,
      },
      outer: {
        width: 26,
        height: 26,
        border: `2px solid ${tokens.beaconColor}`,
      },
    },
    
    tooltip: {
      backgroundColor: tokens.bubbleBackground,
      color: tokens.bubbleText,
      borderRadius: '12px',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.15)',
      fontSize: '16px',
      lineHeight: '1.6',
      maxWidth: '480px',
      padding: '24px',
      // HERA glass morphism effect
      backdropFilter: 'blur(10px)',
      border: `1px solid ${theme.name === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    },
    
    tooltipContainer: {
      textAlign: 'left',
    },
    
    tooltipTitle: {
      fontSize: '20px',
      fontWeight: 600,
      marginBottom: '12px',
      color: tokens.bubbleText,
    },
    
    tooltipContent: {
      fontSize: '16px',
      lineHeight: '1.6',
      color: tokens.bubbleText,
      opacity: 0.9,
    },
    
    tooltipFooter: {
      marginTop: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    
    buttonBack: {
      backgroundColor: 'transparent',
      border: `2px solid ${tokens.buttonBackground}`,
      borderRadius: '8px',
      color: tokens.buttonBackground,
      fontSize: '14px',
      fontWeight: 500,
      padding: '8px 16px',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: tokens.buttonBackground,
        color: tokens.buttonText,
      },
    },
    
    buttonNext: {
      backgroundColor: tokens.buttonBackground,
      border: `2px solid ${tokens.buttonBackground}`,
      borderRadius: '8px',
      color: tokens.buttonText,
      fontSize: '14px',
      fontWeight: 500,
      padding: '8px 16px',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: tokens.buttonHover,
        borderColor: tokens.buttonHover,
      },
    },
    
    buttonClose: {
      color: tokens.skipLinkColor,
      fontSize: '24px',
      lineHeight: 1,
      padding: '8px',
      position: 'absolute',
      right: '8px',
      top: '8px',
      width: 'auto',
      height: 'auto',
      '&:hover': {
        color: tokens.bubbleText,
      },
    },
    
    buttonSkip: {
      color: tokens.skipLinkColor,
      fontSize: '14px',
      textDecoration: 'underline',
      '&:hover': {
        color: tokens.bubbleText,
      },
    },
    
    overlay: {
      backgroundColor: tokens.overlayColor,
      mixBlendMode: 'normal',
      // Smooth animation
      transition: 'opacity 0.3s ease',
    },
    
    spotlight: {
      backgroundColor: 'transparent',
      border: `2px solid ${tokens.spotlightBorder}`,
      borderRadius: '8px',
      boxShadow: `0 0 0 4px ${tokens.spotlightBorder}33`, // 20% opacity
      transition: 'all 0.3s ease',
    },
    
    floater: {
      // Arrow pointing to element
      arrow: {
        color: tokens.bubbleBackground,
      },
    },
    
    options: {
      // Global options that affect styling
      arrowColor: tokens.bubbleBackground,
      overlayColor: tokens.overlayColor,
      primaryColor: tokens.buttonBackground,
      spotlightShadow: `0 0 20px ${tokens.spotlightBorder}66`, // 40% opacity
      textColor: tokens.bubbleText,
      zIndex: 10000,
    },
  };
}

/**
 * Get accessibility-friendly styles
 * Ensures proper focus indicators and keyboard navigation
 */
export function getA11yStyles(baseStyles: JoyrideStyles): JoyrideStyles {
  return {
    ...baseStyles,
    
    buttonBack: {
      ...baseStyles.buttonBack,
      '&:focus': {
        outline: '3px solid currentColor',
        outlineOffset: '2px',
      },
    },
    
    buttonNext: {
      ...baseStyles.buttonNext,
      '&:focus': {
        outline: '3px solid currentColor',
        outlineOffset: '2px',
      },
    },
    
    buttonClose: {
      ...baseStyles.buttonClose,
      '&:focus': {
        outline: '3px solid currentColor',
        outlineOffset: '2px',
      },
    },
    
    buttonSkip: {
      ...baseStyles.buttonSkip,
      '&:focus': {
        outline: '3px solid currentColor',
        outlineOffset: '2px',
      },
    },
  };
}

/**
 * Get reduced motion styles
 * Removes animations for users who prefer reduced motion
 */
export function getReducedMotionStyles(baseStyles: JoyrideStyles): JoyrideStyles {
  return {
    ...baseStyles,
    
    beacon: {
      ...baseStyles.beacon,
      // Remove pulsing animation
      '& > span:first-child': {
        animation: 'none',
      },
    },
    
    tooltip: {
      ...baseStyles.tooltip,
      transition: 'none',
    },
    
    overlay: {
      ...baseStyles.overlay,
      transition: 'none',
    },
    
    spotlight: {
      ...baseStyles.spotlight,
      transition: 'none',
    },
  };
}

/**
 * Progress bar styles for step indicators
 */
export function getProgressStyles(theme: OnboardingTheme, current: number, total: number): React.CSSProperties {
  const progress = (current / total) * 100;
  
  return {
    container: {
      width: '100%',
      height: '4px',
      backgroundColor: theme.tokens.progressBarBackground,
      borderRadius: '2px',
      marginBottom: '16px',
      overflow: 'hidden',
    },
    bar: {
      width: `${progress}%`,
      height: '100%',
      backgroundColor: theme.tokens.progressBarFill,
      borderRadius: '2px',
      transition: 'width 0.3s ease',
    },
  };
}