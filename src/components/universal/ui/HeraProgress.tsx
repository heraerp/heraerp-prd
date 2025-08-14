'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface HeraProgressProps {
  value: number;
  max?: number;
  variant?: 'default' | 'gradient' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  label?: string;
  className?: string;
}

export function HeraProgress({
  value,
  max = 100,
  variant = 'default',
  size = 'md',
  showValue = false,
  showPercentage = false,
  animated = true,
  label,
  className
}: HeraProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  const variantClasses = {
    default: 'bg-hera-500',
    gradient: 'bg-gradient-to-r from-hera-500 via-hera-cyan-500 to-hera-emerald-500',
    success: 'bg-hera-emerald-500',
    warning: 'bg-hera-amber-500',
    danger: 'bg-red-500'
  };

  const animatedClass = animated ? 'transition-all duration-700 ease-out-expo' : '';

  return (
    <div className={cn('space-y-2', className)}>
      {/* Label and Value */}
      {(label || showValue || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && (
            <span className="font-medium text-foreground">{label}</span>
          )}
          <div className="flex items-center gap-2 text-muted-foreground">
            {showValue && <span>{value.toLocaleString()}</span>}
            {showValue && showPercentage && <span>•</span>}
            {showPercentage && <span>{percentage.toFixed(1)}%</span>}
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className={cn(
        'hera-progress-bar',
        sizeClasses[size],
        'relative overflow-hidden'
      )}>
        <div
          className={cn(
            'hera-progress-fill',
            variantClasses[variant],
            animatedClass,
            'relative'
          )}
          style={{ width: `${percentage}%` }}
        >
          {/* Shimmer Effect */}
          {animated && variant === 'gradient' && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          )}
        </div>

        {/* Glow Effect for high values */}
        {percentage > 80 && variant === 'gradient' && (
          <div 
            className="absolute inset-0 bg-gradient-to-r from-hera-500/20 via-hera-cyan-500/20 to-hera-emerald-500/20 animate-glow"
            style={{ width: `${percentage}%` }}
          />
        )}
      </div>
    </div>
  );
}

// Specialized variants
export function HeraWealthProgress({ className, ...props }: Omit<HeraProgressProps, 'variant'>) {
  return (
    <HeraProgress
      variant="gradient"
      size="lg"
      animated={true}
      className={className}
      {...props}
    />
  );
}

export function HeraGoalProgress({ 
  current, 
  target, 
  title,
  className, 
  ...props 
}: Omit<HeraProgressProps, 'value' | 'max'> & {
  current: number;
  target: number;
  title?: string;
}) {
  const percentage = (current / target) * 100;
  const isOverTarget = current > target;
  
  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <h4 className="font-medium text-foreground">{title}</h4>
      )}
      
      <HeraProgress
        value={current}
        max={target}
        variant={isOverTarget ? 'success' : 'gradient'}
        showValue={true}
        showPercentage={true}
        {...props}
      />
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>Current: {current.toLocaleString()}</span>
        <span>Target: {target.toLocaleString()}</span>
      </div>
      
      {isOverTarget && (
        <div className="text-xs text-hera-emerald-400 font-medium">
          🎉 Target exceeded by {((current - target) / target * 100).toFixed(1)}%
        </div>
      )}
    </div>
  );
}

export function HeraRiskProgress({ 
  riskLevel, 
  className,
  ...props 
}: Omit<HeraProgressProps, 'value' | 'variant'> & {
  riskLevel: number; // 0-100
}) {
  const getVariant = () => {
    if (riskLevel <= 30) return 'success';
    if (riskLevel <= 70) return 'warning';
    return 'danger';
  };

  const getRiskLabel = () => {
    if (riskLevel <= 30) return 'Low Risk';
    if (riskLevel <= 70) return 'Moderate Risk';
    return 'High Risk';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex justify-between items-center text-sm">
        <span className="font-medium">Risk Level</span>
        <span className={cn(
          'font-semibold',
          riskLevel <= 30 ? 'text-hera-emerald-400' : 
          riskLevel <= 70 ? 'text-hera-amber-400' : 'text-red-400'
        )}>
          {getRiskLabel()}
        </span>
      </div>
      
      <HeraProgress
        value={riskLevel}
        variant={getVariant()}
        showPercentage={true}
        className={className}
        {...props}
      />
    </div>
  );
}