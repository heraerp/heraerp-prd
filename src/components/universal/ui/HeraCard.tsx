'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface HeraCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'wealth' | 'metric' | 'elevated';
  interactive?: boolean;
  glow?: 'none' | 'primary' | 'success' | 'warning';
  animation?: 'none' | 'fade-in' | 'slide-up' | 'scale-in' | 'bounce-in';
  animationDelay?: number;
  children: React.ReactNode;
}

export function HeraCard({
  variant = 'default',
  interactive = false,
  glow = 'none',
  animation = 'none',
  animationDelay = 0,
  className,
  children,
  ...props
}: HeraCardProps) {
  const baseClasses = 'relative overflow-hidden';
  
  const variantClasses = {
    default: 'hera-card',
    glass: 'hera-glass-card',
    wealth: 'hera-wealth-card',
    metric: 'hera-metric-card',
    elevated: 'hera-surface-elevated rounded-lg p-6'
  };

  const interactiveClasses = interactive ? 'hera-interactive' : '';
  
  const glowClasses = {
    none: '',
    primary: 'hera-glow-primary',
    success: 'hera-glow-success',
    warning: 'hera-glow-warning'
  };

  const animationClasses = {
    none: '',
    'fade-in': 'animate-fade-in',
    'slide-up': 'animate-slide-up',
    'scale-in': 'animate-scale-in',
    'bounce-in': 'animate-bounce-in'
  };

  const delayClass = animationDelay > 0 ? `animate-delay-${animationDelay}` : '';

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        interactiveClasses,
        glowClasses[glow],
        animationClasses[animation],
        delayClass,
        className
      )}
      style={{
        animationDelay: animationDelay > 0 ? `${animationDelay}ms` : undefined
      }}
      {...props}
    >
      {children}
    </div>
  );
}

// Specialized variants for common use cases
export function HeraWealthCard({ children, className, ...props }: Omit<HeraCardProps, 'variant'>) {
  return (
    <HeraCard variant="wealth" className={className} {...props}>
      {children}
    </HeraCard>
  );
}

export function HeraGlassCard({ children, className, ...props }: Omit<HeraCardProps, 'variant'>) {
  return (
    <HeraCard variant="glass" className={className} {...props}>
      {children}
    </HeraCard>
  );
}

export function HeraMetricCard({ children, className, ...props }: Omit<HeraCardProps, 'variant'>) {
  return (
    <HeraCard variant="metric" className={className} {...props}>
      {children}
    </HeraCard>
  );
}