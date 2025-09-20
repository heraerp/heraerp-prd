/**
 * HERA CivicFlow Grants Component Props
 * 
 * Single-source prop definitions for all grants components.
 * These use the contract system to ensure type safety.
 */

import type { CreateGrantModalProps, ReviewGrantModalProps } from '@/contracts/ui-components';
import type { GrantApplicationWithRelated, GrantFilters } from '@/contracts/crm-grants';

// Re-export the contract types for consistency
export type { CreateGrantModalProps, ReviewGrantModalProps };

// Extended props for specific components
export type GrantFilterBarProps = {
  filters: GrantFilters;
  onFiltersChange: (filters: GrantFilters) => void;
};

export type GrantApplicationCardProps = {
  application: GrantApplicationWithRelated;
  onReview: () => void;
};