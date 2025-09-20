'use client';

import { FileText, ExternalLink, Star, Clock, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { GrantApplicationListItem } from '@/types/crm-grants';

interface ApplicationCardProps {
  application: GrantApplicationListItem;
  onReview: () => void;
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300',
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  in_review: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  awarded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  closed: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-300',
} as const;

const STATUS_LABELS = {
  draft: 'Draft',
  submitted: 'Submitted',
  in_review: 'In Review',
  approved: 'Approved',
  rejected: 'Rejected',
  awarded: 'Awarded',
  closed: 'Closed',
} as const;

export function ApplicationCard({ application, onReview }: ApplicationCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const canReview = ['submitted', 'in_review'].includes(application.status);

  return (
    <Card className="bg-panel border-border hover:border-accent/50 transition-all duration-200 h-full flex flex-col">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <h3 className="font-semibold text-text-100 line-clamp-2 mb-1">
              {application.applicant.name}
            </h3>
            <p className="text-sm text-text-300">
              {application.applicant.type === 'constituent' ? 'Constituent' : 'Partner Organization'}
            </p>
          </div>
          <Badge className={STATUS_COLORS[application.status]}>
            {STATUS_LABELS[application.status]}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-text-300">
            <FileText className="h-4 w-4" />
            <span className="font-medium">{application.program.title}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-text-300">
            <ExternalLink className="h-4 w-4" />
            <span>Round: {application.round.round_code}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 flex-1 flex flex-col">
        <div className="space-y-3 flex-1">
          {/* Financial Information */}
          {(application.amount_requested || application.amount_awarded) && (
            <div className="space-y-2">
              {application.amount_requested && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-text-400" />
                  <span className="text-text-300">Requested:</span>
                  <span className="text-text-100 font-medium">
                    {formatCurrency(application.amount_requested)}
                  </span>
                </div>
              )}
              {application.amount_awarded && (
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-accent" />
                  <span className="text-text-300">Awarded:</span>
                  <span className="text-accent font-medium">
                    {formatCurrency(application.amount_awarded)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Score */}
          {application.score !== undefined && (
            <div className="flex items-center gap-2 text-sm">
              <Star className="h-4 w-4 text-amber-500" />
              <span className="text-text-300">Score:</span>
              <span className="text-text-100 font-medium">
                {application.score}/100
              </span>
            </div>
          )}

          {/* Last Action */}
          {application.last_action_at && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-text-400" />
              <span className="text-text-300">Last action:</span>
              <span className="text-text-100">
                {formatDate(application.last_action_at)}
              </span>
            </div>
          )}

          {/* Created Date */}
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-text-400" />
            <span className="text-text-300">Created:</span>
            <span className="text-text-100">
              {formatDate(application.created_at)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 border-border hover:bg-accent-soft"
          >
            <FileText className="h-4 w-4 mr-2" />
            View
          </Button>
          {canReview && (
            <Button
              size="sm"
              onClick={onReview}
              className="flex-1 bg-accent hover:bg-accent/90 text-accent-fg"
            >
              Review
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}