'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Download, 
  LayoutGrid, 
  List,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { CaseFilterBar } from '@/components/cases/CaseFilterBar';
import { CaseCard } from '@/components/cases/CaseCard';
import { CaseTable } from '@/components/cases/CaseTable';
import { CreateCaseForm } from '@/components/cases/CreateCaseForm';
import { Loading } from '@/components/states/Loading';
import { ErrorState } from '@/components/states/ErrorState';
import { EmptyState } from '@/components/states/EmptyState';
import { SeedDataButton } from '@/components/civicflow/SeedDataButton';
import { useCaseList, useCaseKpis, useCreateCase, useExportCases } from '@/hooks/use-cases';
import { useOrgStore } from '@/state/org';
import type { CaseFilters, CreateCasePayload, CaseExportFormat } from '@/types/cases';

const VIEW_STORAGE_KEY = 'civicflow-cases-view';

export default function CasesPage() {
  const router = useRouter();
  const { currentOrgId } = useOrgStore();
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filters, setFilters] = useState<CaseFilters>({
    page: 1,
    pageSize: 20,
  });

  // Load view preference
  useEffect(() => {
    const savedView = localStorage.getItem(VIEW_STORAGE_KEY);
    if (savedView === 'table' || savedView === 'card') {
      setViewMode(savedView);
    }
  }, []);

  // Queries
  const kpisQuery = useCaseKpis();
  const casesQuery = useCaseList(filters);
  const createCaseMutation = useCreateCase();
  const exportMutation = useExportCases();

  // Update view preference
  const handleViewChange = (view: 'card' | 'table') => {
    setViewMode(view);
    localStorage.setItem(VIEW_STORAGE_KEY, view);
  };

  // Handle filter changes
  const handleFiltersChange = (newFilters: CaseFilters) => {
    setFilters({ ...newFilters, page: 1 }); // Reset to page 1 on filter change
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  // Create case
  const handleCreateCase = async (data: CreateCasePayload) => {
    await createCaseMutation.mutateAsync(data);
    setShowCreateDialog(false);
  };

  // Export cases
  const handleExport = (format: CaseExportFormat) => {
    exportMutation.mutate({ format, filters });
  };

  // Navigate to case detail
  const handleCaseClick = (caseId: string) => {
    router.push(`/civicflow/cases/${caseId}`);
  };

  // Clear filters
  const handleClearFilters = () => {
    setFilters({ page: 1, pageSize: 20 });
  };

  // KPI Cards
  const kpiCards = [
    {
      title: 'Open Cases',
      value: kpisQuery.data?.open || 0,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Due This Week',
      value: kpisQuery.data?.due_this_week || 0,
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100',
    },
    {
      title: 'Breaches',
      value: kpisQuery.data?.breaches || 0,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
    },
    {
      title: 'On-Time %',
      value: `${kpisQuery.data?.on_time_pct || 0}%`,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  if (!currentOrgId) {
    return (
      <div className="p-8">
        <ErrorState 
          title="No Organization Selected" 
          message="Please select an organization to view cases."
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cases</h1>
          <p className="text-muted-foreground">
            Manage cases, applications, and agreements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SeedDataButton />
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            New Case
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('zip')}>
                Export Evidence Pack (ZIP)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {kpi.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                {kpi.title === 'On-Time %' && kpisQuery.data && (
                  <p className="text-xs text-muted-foreground">
                    Avg. resolution: {kpisQuery.data.avg_resolution_days} days
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter Bar */}
      <CaseFilterBar 
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClear={handleClearFilters}
      />

      {/* View Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center gap-1 rounded-md border p-1">
          <Button
            variant={viewMode === 'card' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('card')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => handleViewChange('table')}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cases List */}
      <div>
        {casesQuery.isLoading ? (
          <Loading message="Loading cases..." />
        ) : casesQuery.isError ? (
          <ErrorState
            title="Error loading cases"
            message={casesQuery.error?.message || 'An error occurred'}
          />
        ) : !casesQuery.data?.items.length ? (
          <EmptyState
            title="No cases found"
            message={filters.q ? "Try adjusting your filters" : "Create your first case to get started"}
            action={
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Case
              </Button>
            }
          />
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {casesQuery.data.items.map((caseItem) => (
              <CaseCard
                key={caseItem.id}
                case={caseItem}
                onClick={() => handleCaseClick(caseItem.id)}
                onAction={(action) => {
                  // TODO: Handle inline actions
                  console.log('Action:', action, 'Case:', caseItem.id);
                }}
              />
            ))}
          </div>
        ) : (
          <CaseTable
            cases={casesQuery.data.items}
            onAction={(caseId, action) => {
              // TODO: Handle inline actions
              console.log('Action:', action, 'Case:', caseId);
            }}
            loading={casesQuery.isLoading}
          />
        )}
      </div>

      {/* Pagination */}
      {casesQuery.data && casesQuery.data.total > casesQuery.data.pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((filters.page || 1) - 1) * (filters.pageSize || 20) + 1} to{' '}
            {Math.min((filters.page || 1) * (filters.pageSize || 20), casesQuery.data.total)} of{' '}
            {casesQuery.data.total} cases
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange((filters.page || 1) - 1)}
              disabled={(filters.page || 1) === 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange((filters.page || 1) + 1)}
              disabled={
                (filters.page || 1) * (filters.pageSize || 20) >= casesQuery.data.total
              }
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Case Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Case</DialogTitle>
          </DialogHeader>
          <CreateCaseForm
            onSubmit={handleCreateCase}
            onCancel={() => setShowCreateDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}