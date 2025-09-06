/**
 * Guardrail status badge component
 */

import React from 'react';

interface GuardrailBadgeProps {
  level: 'error' | 'warn' | 'info' | 'ok';
  className?: string;
}

export function GuardrailBadge({ level, className = '' }: GuardrailBadgeProps) {
  const label = level === 'ok' ? 'PASS' : level.toUpperCase();
  
  const colorClasses = {
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800',
    warn: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    ok: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
  };

  return (
    <span 
      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium border ${colorClasses[level]} ${className}`}
      aria-label={`Guardrail status: ${label}`}
    >
      {label}
    </span>
  );
}