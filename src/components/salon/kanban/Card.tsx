// ============================================================================
// HERA • Kanban Card Component with DRAFT support
// ============================================================================

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { 
  Clock, 
  User, 
  Scissors, 
  Star, 
  AlertCircle,
  CheckCircle,
  Edit,
  MoreVertical,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { KanbanCard as CardType, CANCELLABLE_STATES, RESCHEDULABLE_STATES } from '@/schemas/kanban';
import { format } from 'date-fns';

interface CardProps {
  card: CardType;
  onConfirm?: () => void;
  onEdit?: () => void;
  onReschedule?: () => void;
  onCancel?: () => void;
  onProcessPayment?: () => void;
}

export function Card({ card, onConfirm, onEdit, onReschedule, onCancel, onProcessPayment }: CardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const startTime = format(new Date(card.start), 'HH:mm');
  const endTime = format(new Date(card.end), 'HH:mm');

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative bg-white dark:bg-zinc-900 rounded-lg border shadow-sm',
        'cursor-move select-none',
        isDragging && 'opacity-50 shadow-lg z-50',
        card.status === 'DRAFT' && 'border-amber-200 dark:border-amber-900'
      )}
      {...attributes}
      {...listeners}
    >
      {/* Draft badge */}
      {card.status === 'DRAFT' && (
        <div className="absolute -top-2 left-2">
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">
            Draft
          </Badge>
        </div>
      )}

      <div className="p-3 space-y-2">
        {/* Header with time and actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-3 h-3 text-gray-400" />
            <span className="font-medium">{startTime} - {endTime}</span>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {card.status === 'DRAFT' && (
                <>
                  <DropdownMenuItem onClick={onConfirm}>
                    <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                    Confirm Booking
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Draft
                  </DropdownMenuItem>
                </>
              )}
              {RESCHEDULABLE_STATES.includes(card.status) && (
                <DropdownMenuItem onClick={onReschedule}>
                  <Clock className="w-4 h-4 mr-2" />
                  Reschedule
                </DropdownMenuItem>
              )}
              {card.status === 'TO_PAY' && (
                <DropdownMenuItem onClick={onProcessPayment} className="text-green-600">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Process Payment
                </DropdownMenuItem>
              )}
              {CANCELLABLE_STATES.includes(card.status) && (
                <DropdownMenuItem onClick={onCancel} className="text-red-600">
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Cancel Appointment
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Customer name */}
        <div className="flex items-center gap-2">
          <User className="w-3 h-3 text-gray-400" />
          <span className="font-medium text-sm">{card.customer_name}</span>
          {card.flags?.vip && (
            <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
          )}
          {card.flags?.new && (
            <Badge variant="secondary" className="text-xs px-1 py-0">
              New
            </Badge>
          )}
        </div>

        {/* Service */}
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Scissors className="w-3 h-3" />
          <span>{card.service_name}</span>
        </div>

        {/* Stylist */}
        {card.stylist_name && (
          <div className="text-xs text-gray-500 dark:text-gray-500">
            with {card.stylist_name}
          </div>
        )}

        {/* Status indicator */}
        {card.status !== 'DRAFT' && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Status: {card.status.replace('_', ' ').toLowerCase()}
            {card.status === 'TO_PAY' && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">💳 POS Ready</span>
            )}
          </div>
        )}

        {/* Draft actions */}
        {card.status === 'DRAFT' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="default"
              className="flex-1 h-7 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              onClick={(e) => {
                e.stopPropagation();
                onConfirm?.();
              }}
            >
              Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 h-7"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.();
              }}
            >
              Edit
            </Button>
          </div>
        )}

        {/* TO_PAY actions */}
        {card.status === 'TO_PAY' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              size="sm"
              variant="default"
              className="flex-1 h-7 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              onClick={(e) => {
                e.stopPropagation();
                onProcessPayment?.();
              }}
            >
              <CreditCard className="w-3 h-3 mr-1" />
              Process Payment
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}