'use client';

import React from 'react';
import { HeraCard } from './HeraCard';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface HeraMetricProps {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: {
    value: number;
    percentage?: number;
    period?: string;
  };
  trend?: 'up' | 'down' | 'neutral';
  format?: 'currency' | 'percentage' | 'number';
  currency?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'wealth' | 'compact';
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}

export function HeraMetric({
  title,
  value,
  subtitle,
  change,
  trend,
  format = 'number',
  currency = 'USD',
  icon,
  variant = 'default',
  className,
  interactive = false,
  onClick
}: HeraMetricProps) {
  const formatValue = (val: string | number) => {
    const numValue = typeof val === 'string' ? parseFloat(val) : val;
    
    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(numValue);
      case 'percentage':
        return `${numValue.toFixed(2)}%`;
      default:
        return numValue.toLocaleString();
    }
  };

  const formatLargeNumber = (val: number) => {
    if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
    if (val >= 1e3) return `${(val / 1e3).toFixed(2)}K`;
    return val.toFixed(2);
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4" />;
      case 'down':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Minus className="h-4 w-4" />;
    }
  };

  const getTrendClasses = () => {
    switch (trend) {
      case 'up':
        return 'hera-status-positive';
      case 'down':
        return 'hera-status-negative';
      default:
        return 'hera-status-neutral';
    }
  };

  const cardVariant = variant === 'wealth' ? 'wealth' : 'metric';

  return (
    <HeraCard
      variant={cardVariant}
      interactive={interactive}
      animation="fade-in"
      className={cn('cursor-pointer', className)}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground truncate">
            {title}
          </h3>
          {icon && (
            <div className="flex-shrink-0 text-hera-400">
              {icon}
            </div>
          )}
        </div>

        {/* Value */}
        <div className="space-y-1">
          <div className={cn(
            "text-2xl font-bold tracking-tight",
            variant === 'wealth' ? 'text-3xl lg:text-4xl' : ''
          )}>
            {variant === 'wealth' && format === 'currency' 
              ? formatLargeNumber(typeof value === 'string' ? parseFloat(value) : value)
              : formatValue(value)
            }
          </div>
          
          {subtitle && (
            <p className="text-sm text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>

        {/* Change Indicator */}
        {change && (
          <div className={cn(
            "flex items-center gap-2 text-sm font-medium",
            getTrendClasses()
          )}>
            {getTrendIcon()}
            <span>
              {change.percentage ? `${change.percentage > 0 ? '+' : ''}${change.percentage.toFixed(2)}%` : ''}
              {change.value !== undefined && (
                <span className="ml-1">
                  ({change.value > 0 ? '+' : ''}{formatValue(change.value)})
                </span>
              )}
              {change.period && (
                <span className="text-muted-foreground ml-1">
                  {change.period}
                </span>
              )}
            </span>
          </div>
        )}
      </div>
    </HeraCard>
  );
}

// Specialized variants
export function HeraWealthMetric({ className, ...props }: Omit<HeraMetricProps, 'variant'>) {
  return (
    <HeraMetric
      variant="wealth"
      format="currency"
      className={cn('min-h-[160px]', className)}
      {...props}
    />
  );
}

export function HeraCompactMetric({ className, ...props }: Omit<HeraMetricProps, 'variant'>) {
  return (
    <HeraMetric
      variant="compact"
      className={cn('p-4', className)}
      {...props}
    />
  );
}