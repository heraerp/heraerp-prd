// ============================================================================
// HERA • Salon Appointments Kanban Page with DRAFT support
// ============================================================================

'use client';

import React, { useState, useCallback } from 'react';
import { format, startOfToday } from 'date-fns';
import { Plus, Calendar, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Board } from '@/components/salon/kanban/Board';
import { ReschedulePanel } from '@/components/salon/kanban/ReschedulePanel';
import { useKanbanPlaybook } from '@/hooks/useKanbanPlaybook';
import { KanbanCard } from '@/schemas/kanban';
import { SalonAuthGuard } from '@/components/salon/auth/SalonAuthGuard';

// Mock auth hook - replace with actual
const useAuth = () => ({
  user: { 
    id: '123', 
    organization_id: '48f96c62-4e45-42f1-8a50-d2f4b3a7f803' 
  }
});

// Mock branch hook - replace with actual
const useBranch = () => ({
  currentBranch: { 
    id: 'main', 
    name: 'Hair Talkz Main' 
  },
  branches: [
    { id: 'main', name: 'Hair Talkz Main' },
    { id: 'downtown', name: 'Hair Talkz Downtown' }
  ]
});

export default function KanbanPage() {
  const { user } = useAuth();
  const { currentBranch, branches } = useBranch();
  const { toast } = useToast();
  const [date, setDate] = useState(startOfToday());
  const [selectedCard, setSelectedCard] = useState<KanbanCard | null>(null);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  
  // Draft form state
  const [draftForm, setDraftForm] = useState({
    customer_name: '',
    service_name: '',
    staff_name: '',
    start_time: '',
    duration: '60'
  });

  const {
    cards,
    cardsByColumn,
    loading,
    isMoving,
    moveCard,
    createDraft,
    reload,
    canTransition
  } = useKanbanPlaybook({
    organization_id: user.organization_id,
    branch_id: currentBranch.id,
    date: format(date, 'yyyy-MM-dd'),
    userId: user.id
  });

  const handleCardAction = useCallback(async (card: KanbanCard, action: string) => {
    switch (action) {
      case 'confirm':
        // Move to BOOKED column
        const bookedCards = cardsByColumn.BOOKED;
        await moveCard(card.id, 'BOOKED', bookedCards.length);
        break;
        
      case 'edit':
        setSelectedCard(card);
        setRescheduleOpen(true);
        break;
        
      case 'reschedule':
        setSelectedCard(card);
        setRescheduleOpen(true);
        break;
        
      case 'cancel':
        if (window.confirm('Are you sure you want to cancel this appointment?')) {
          await moveCard(card.id, 'CANCELLED', 0);
        }
        break;
    }
  }, [moveCard, cardsByColumn]);

  const handleCreateDraft = async () => {
    const { customer_name, service_name, staff_name, start_time, duration } = draftForm;
    
    if (!customer_name || !service_name || !start_time) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    const [hours, minutes] = start_time.split(':').map(Number);
    const start = new Date(date);
    start.setHours(hours, minutes, 0, 0);
    
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + parseInt(duration));

    await createDraft({
      customer_id: 'draft-' + Date.now(), // Mock ID
      customer_name,
      service_id: 'service-' + Date.now(),
      service_name,
      staff_id: staff_name ? 'staff-' + Date.now() : undefined,
      staff_name: staff_name || undefined,
      start: start.toISOString(),
      end: end.toISOString()
    });

    setDraftModalOpen(false);
    setDraftForm({
      customer_name: '',
      service_name: '',
      staff_name: '',
      start_time: '',
      duration: '60'
    });
  };

  return (
    <SalonAuthGuard requiredRoles={['Owner', 'Receptionist', 'Administrator']}>
      <div className="h-screen flex flex-col bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-black">
        {/* Luxe header */}
        <header className="bg-black text-white px-6 py-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <h1 className="text-2xl font-light tracking-wide">
                Appointments • {currentBranch.name}
              </h1>
              
              {/* Date picker */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'justify-start text-left font-normal bg-zinc-900 border-zinc-800 hover:bg-zinc-800',
                      'text-white hover:text-white'
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {format(date, 'EEEE, MMMM d')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={date}
                    onSelect={(d) => d && setDate(d)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={reload}
                disabled={loading || isMoving}
                className="text-white hover:text-white hover:bg-zinc-800"
              >
                <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
              </Button>
              
              <Button
                onClick={() => setDraftModalOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Draft
              </Button>
            </div>
          </div>
        </header>

        {/* Kanban board */}
        <div className="flex-1 overflow-hidden">
          <Board
            cardsByColumn={cardsByColumn}
            onMove={moveCard}
            onCardAction={handleCardAction}
            loading={loading}
            isMoving={isMoving}
          />
        </div>

        {/* Reschedule panel */}
        <ReschedulePanel
          open={rescheduleOpen}
          onOpenChange={setRescheduleOpen}
          appointment={selectedCard}
          organization_id={user.organization_id}
          branch_id={currentBranch.id}
          branches={branches}
          staff={[
            { id: 'staff1', name: 'Sarah' },
            { id: 'staff2', name: 'Emma' },
            { id: 'staff3', name: 'Lisa' }
          ]}
          currentUserId={user.id}
        />

        {/* New Draft Modal */}
        <Dialog open={draftModalOpen} onOpenChange={setDraftModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Draft Appointment</DialogTitle>
              <DialogDescription>
                Create a draft appointment that can be confirmed later
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  value={draftForm.customer_name}
                  onChange={(e) => setDraftForm(prev => ({ ...prev, customer_name: e.target.value }))}
                  placeholder="Enter customer name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Service *</Label>
                <Input
                  value={draftForm.service_name}
                  onChange={(e) => setDraftForm(prev => ({ ...prev, service_name: e.target.value }))}
                  placeholder="Enter service name"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Staff Member (optional)</Label>
                <Input
                  value={draftForm.staff_name}
                  onChange={(e) => setDraftForm(prev => ({ ...prev, staff_name: e.target.value }))}
                  placeholder="Enter staff name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time *</Label>
                  <Input
                    type="time"
                    value={draftForm.start_time}
                    onChange={(e) => setDraftForm(prev => ({ ...prev, start_time: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={draftForm.duration}
                    onChange={(e) => setDraftForm(prev => ({ ...prev, duration: e.target.value }))}
                    min="15"
                    step="15"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setDraftModalOpen(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateDraft}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  Create Draft
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SalonAuthGuard>
  );
}