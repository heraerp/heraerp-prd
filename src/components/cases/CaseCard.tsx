/**
 * Case Card Component
 * Displays case information in a card format
 */

import React from 'react';
import { format } from 'date-fns';
import { 
  Calendar, 
  User, 
  Tag, 
  AlertTriangle,
  FileText,
  MoreVertical 
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { CaseCardProps, CaseStatus, CasePriority, CaseRag } from '@/types/cases';

const statusColors: Record<CaseStatus, string> = {
  new: 'bg-blue-100 text-blue-800',
  in_review: 'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-gray-100 text-gray-800',
  breach: 'bg-red-100 text-red-800',
  closed: 'bg-slate-100 text-slate-800',
};

const priorityColors: Record<CasePriority, string> = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const ragColors: Record<CaseRag, string> = {
  R: 'bg-red-500 text-white',
  A: 'bg-amber-500 text-white',
  G: 'bg-green-500 text-white',
};

export function CaseCard({ case: caseItem, onAction, onClick }: CaseCardProps) {
  const handleCardClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const handleAction = (action: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAction) {
      onAction(action as any);
    }
  };

  const isOverdue = caseItem.due_date && new Date(caseItem.due_date) < new Date();

  return (
    <Card 
      className="hover:shadow-lg transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-medium text-lg line-clamp-2">
              {caseItem.entity_name}
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="secondary" 
                className={statusColors[caseItem.status]}
              >
                {caseItem.status.replace('_', ' ')}
              </Badge>
              <Badge 
                variant="secondary" 
                className={priorityColors[caseItem.priority]}
              >
                {caseItem.priority}
              </Badge>
              {caseItem.rag && (
                <Badge 
                  variant="secondary" 
                  className={ragColors[caseItem.rag]}
                >
                  RAG: {caseItem.rag}
                </Badge>
              )}
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {caseItem.status !== 'closed' && (
                <>
                  <DropdownMenuItem onClick={(e) => handleAction('vary', e)}>
                    <FileText className="mr-2 h-4 w-4" />
                    Request Variation
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={(e) => handleAction('breach', e)}>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Record Breach
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => handleAction('close', e)}>
                    Close Case
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <div className="space-y-2 text-sm">
          {caseItem.program_name && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>{caseItem.program_name}</span>
            </div>
          )}
          
          {caseItem.owner && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{caseItem.owner}</span>
            </div>
          )}
          
          {caseItem.due_date && (
            <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
              <Calendar className="h-4 w-4" />
              <span>
                Due: {format(new Date(caseItem.due_date), 'MMM d, yyyy')}
                {isOverdue && ' (Overdue)'}
              </span>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 border-t">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {caseItem.tags && caseItem.tags.length > 0 && (
              <div className="flex items-center gap-1">
                <Tag className="h-3 w-3 text-muted-foreground" />
                {caseItem.tags.slice(0, 2).map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {caseItem.tags.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{caseItem.tags.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            Updated {format(new Date(caseItem.updated_at), 'MMM d')}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}