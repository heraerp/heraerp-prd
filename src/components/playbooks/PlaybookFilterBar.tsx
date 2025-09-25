'use client';

import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import type { PlaybookFilters, PlaybookStatus, PlaybookCategory } from '@/types/playbooks';

interface PlaybookFilterBarProps {
  filters: PlaybookFilters;
  onFiltersChange: (filters: PlaybookFilters) => void;
  onClear: () => void;
}

export function PlaybookFilterBar({ filters, onFiltersChange, onClear }: PlaybookFilterBarProps) {
  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, q: value });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value === 'all' ? undefined : value as PlaybookStatus 
    });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      category: value === 'all' ? undefined : value as PlaybookCategory 
    });
  };

  const handleServiceChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      service_id: value === 'all' ? undefined : value 
    });
  };

  const activeFiltersCount = Object.entries(filters)
    .filter(([key, value]) => key !== 'page' && key !== 'pageSize' && value !== undefined && value !== '')
    .length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search playbooks..."
            value={filters.q || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status Filter */}
        <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Category Filter */}
        <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="constituent">Constituent Services</SelectItem>
            <SelectItem value="grants">Grants Management</SelectItem>
            <SelectItem value="service">Service Delivery</SelectItem>
            <SelectItem value="case">Case Management</SelectItem>
            <SelectItem value="outreach">Outreach</SelectItem>
          </SelectContent>
        </Select>

        {/* Service Filter */}
        <Select value={filters.service_id || 'all'} onValueChange={handleServiceChange}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Service" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Services</SelectItem>
            <SelectItem value="health-dept">Health Department</SelectItem>
            <SelectItem value="social-services">Social Services</SelectItem>
            <SelectItem value="public-works">Public Works</SelectItem>
            <SelectItem value="parks-rec">Parks & Recreation</SelectItem>
          </SelectContent>
        </Select>

        {/* Clear Filters */}
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <X className="mr-2 h-4 w-4" />
            Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.q && (
            <Badge variant="secondary" className="gap-1">
              Search: {filters.q}
              <button
                onClick={() => onFiltersChange({ ...filters, q: undefined })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <button
                onClick={() => onFiltersChange({ ...filters, status: undefined })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.category && (
            <Badge variant="secondary" className="gap-1">
              Category: {filters.category}
              <button
                onClick={() => onFiltersChange({ ...filters, category: undefined })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.service_id && (
            <Badge variant="secondary" className="gap-1">
              Service: {filters.service_id}
              <button
                onClick={() => onFiltersChange({ ...filters, service_id: undefined })}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}