'use client';

import { Calendar, DollarSign, Building2, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { ProgramListItem } from '@/types/crm-programs';

interface ProgramCardProps {
  program: ProgramListItem;
  onCreateGrantRound: () => void;
}

const statusStyles = {
  active: 'bg-green-100 text-green-800 border-green-200',
  paused: 'bg-amber-100 text-amber-800 border-amber-200',
  archived: 'bg-gray-100 text-gray-800 border-gray-200',
};

export function ProgramCard({ program, onCreateGrantRound }: ProgramCardProps) {
  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const formatter = new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${formatter.format(startDate)} - ${formatter.format(endDate)}`;
  };

  return (
    <Card className="bg-panel border-border hover:bg-panel-alt transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <CardTitle className="text-lg font-semibold text-text-100">
              {program.code} – {program.title}
            </CardTitle>
            <Badge className={statusStyles[program.status]}>
              {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sponsor */}
        {program.sponsor_org_name && (
          <div className="flex items-center gap-2 text-sm text-text-300">
            <Building2 className="h-4 w-4" />
            <span>{program.sponsor_org_name}</span>
          </div>
        )}

        {/* Tags */}
        {program.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {program.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-secondary/10 text-secondary border-secondary/20 text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Budget */}
        <div className="flex items-center gap-2 text-sm">
          <DollarSign className="h-4 w-4 text-accent" />
          <span className="font-medium text-text-100">
            Budget: {formatCurrency(program.budget)}
          </span>
        </div>

        {/* Grant Rounds */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-text-300">
            <Calendar className="h-4 w-4" />
            <span>
              {program.rounds_count} Grant Round{program.rounds_count !== 1 ? 's' : ''}
            </span>
          </div>
          {program.next_window && (
            <div className="text-xs text-text-500 pl-6">
              Next: {formatDateRange(program.next_window.open, program.next_window.close)}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            asChild
            className="flex-1 border-border hover:bg-accent-soft hover:text-accent"
          >
            <Link href={`/civicflow/programs/${program.id}`}>View Details</Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onCreateGrantRound}
            className="border-border hover:bg-accent-soft hover:text-accent"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}