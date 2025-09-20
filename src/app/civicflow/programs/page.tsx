'use client';

import { useState } from 'react';
import { Plus, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { FilterBar } from '@/components/civicflow/programs/FilterBar';
import { ProgramCard } from '@/components/civicflow/programs/ProgramCard';
import { CreateProgramModal } from '@/components/civicflow/programs/CreateProgramModal';
import { CreateGrantRoundModal } from '@/components/civicflow/programs/CreateGrantRoundModal';
import { useProgramKpis, useProgramList, useExportPrograms } from '@/hooks/use-programs';
import type { ProgramFilters } from '@/types/crm-programs';

export default function ProgramsPage() {
  const [filters, setFilters] = useState<ProgramFilters>({
    page: 1,
    page_size: 20,
  });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [isGrantRoundModalOpen, setIsGrantRoundModalOpen] = useState(false);

  const { data: kpis, isLoading: kpisLoading } = useProgramKpis();
  const { data: programsData, isLoading: programsLoading } = useProgramList(filters);
  const exportPrograms = useExportPrograms();

  const handleExport = (format: 'csv' | 'json') => {
    exportPrograms.mutate({ filters, format });
  };

  const handleCreateGrantRound = (programId: string) => {
    setSelectedProgramId(programId);
    setIsGrantRoundModalOpen(true);
  };

  const kpiCards = [
    {
      title: 'Total Programs',
      value: kpis?.total_programs || 0,
      color: 'text-primary',
    },
    {
      title: 'Active Rounds',
      value: kpis?.active_rounds || 0,
      color: 'text-secondary',
    },
    {
      title: 'Average Budget',
      value: kpis?.avg_budget ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(kpis.avg_budget) : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(0),
      color: 'text-accent',
    },
    {
      title: 'New This Month',
      value: kpis?.new_this_month || 0,
      color: 'text-accent2',
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-100">Programs</h1>
          <p className="text-text-300 mt-1">Manage government programs and grant rounds</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport('csv')}
            disabled={exportPrograms.isPending}
            className="border-border hover:bg-accent-soft"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-accent hover:bg-accent/90 text-accent-fg"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Program
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="bg-panel border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-text-300">
                {kpi.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <FilterBar
        filters={filters}
        onFiltersChange={(newFilters) => setFilters({ ...newFilters, page: 1 })}
      />

      {/* Programs Grid */}
      {programsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : programsData?.items.length === 0 ? (
        <Card className="bg-panel border-border">
          <CardContent className="py-12 text-center">
            <p className="text-lg font-semibold text-text-100 mb-2">No programs found</p>
            <p className="text-text-300 mb-6">
              {filters.q || filters.status || filters.tags
                ? 'Try adjusting your filters to see more results.'
                : 'Get started by creating your first program.'}
            </p>
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Program
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {programsData?.items.map((program) => (
              <ProgramCard
                key={program.id}
                program={program}
                onCreateGrantRound={() => handleCreateGrantRound(program.id)}
              />
            ))}
          </div>

          {/* Pagination */}
          {programsData && programsData.total_pages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page! - 1) }))}
                disabled={filters.page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-text-300">
                Page {filters.page} of {programsData.total_pages}
              </span>
              <Button
                variant="outline"
                onClick={() => setFilters((f) => ({ ...f, page: f.page! + 1 }))}
                disabled={filters.page === programsData.total_pages}
              >
                Next
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <CreateProgramModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />

      {selectedProgramId && (
        <CreateGrantRoundModal
          open={isGrantRoundModalOpen}
          onOpenChange={setIsGrantRoundModalOpen}
          programId={selectedProgramId}
        />
      )}
    </div>
  );
}