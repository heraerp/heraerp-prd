'use client';

import { useState } from 'react';
import { useRunList } from '@/hooks/use-runs';
import { useOrgStore } from '@/state/org';
import { TaskDrawer } from '@/components/TaskDrawer';
import { LoadingState } from '@/components/states/Loading';
import { ErrorState } from '@/components/states/ErrorState';
import { EmptyState } from '@/components/states/EmptyState';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import type { TaskItem } from '@/types/tasks';

export default function TasksPage() {
  const { currentOrgId } = useOrgStore();
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Fetch runs with waiting_input status to get human tasks
  const { data: runs, isLoading, isError, error } = useRunList({
    orgId: currentOrgId,
    status: 'waiting_input',
  });

  // Convert runs to task format
  const tasks: TaskItem[] = runs?.data?.flatMap(run => 
    // For now, create a task per run waiting for input
    // In a real implementation, you'd have a proper tasks endpoint
    [{
      id: `${run.id}-task`,
      run_id: run.id,
      sequence: run.current_step_sequence || 1,
      step_name: run.current_step_name || 'Manual Step',
      subject_entity_id: run.id,
      due_at: run.due_at,
      organization_id: run.organization_id,
      metadata: {
        playbook_name: run.playbook_name,
        playbook_version: run.playbook_version,
        started_at: run.started_at,
        progress_percentage: run.progress_percentage,
      },
    }]
  ) || [];

  const handleOpenTask = (task: TaskItem) => {
    setSelectedTask(task);
    setDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setDrawerOpen(false);
    setSelectedTask(null);
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (isError) {
    return <ErrorState message={error?.message || 'Failed to load tasks'} />;
  }

  if (!currentOrgId) {
    return (
      <div className="container mx-auto py-8">
        <EmptyState 
          message="Please select an organization to view tasks"
          icon={AlertCircle}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Task Inbox</h1>
          <p className="text-gray-600">
            Human tasks requiring your attention
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tasks</p>
                  <p className="text-2xl font-bold">{tasks.length}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Urgent</p>
                  <p className="text-2xl font-bold text-red-600">
                    {tasks.filter(t => t.due_at && new Date(t.due_at) < new Date()).length}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Week</p>
                  <p className="text-2xl font-bold text-green-600">
                    {tasks.filter(t => {
                      if (!t.due_at) return false;
                      const due = new Date(t.due_at);
                      const week = new Date();
                      week.setDate(week.getDate() + 7);
                      return due <= week;
                    }).length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks List */}
        {tasks.length === 0 ? (
          <Card>
            <CardContent className="p-8">
              <EmptyState 
                message="No tasks requiring attention"
                description="All your playbook runs are progressing automatically"
                icon={CheckCircle}
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Card key={task.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{task.step_name}</CardTitle>
                      <CardDescription>
                        {task.metadata?.playbook_name} • Run {task.run_id.slice(0, 8)}...
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.due_at && (
                        <Badge 
                          variant={new Date(task.due_at) < new Date() ? 'destructive' : 'secondary'}
                        >
                          Due {formatDateTime(task.due_at)}
                        </Badge>
                      )}
                      <Button 
                        size="sm"
                        onClick={() => handleOpenTask(task)}
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Sequence:</span>
                      <p className="font-medium">{task.sequence}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Progress:</span>
                      <p className="font-medium">{task.metadata?.progress_percentage || 0}%</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Started:</span>
                      <p className="font-medium">
                        {task.metadata?.started_at 
                          ? formatDateTime(task.metadata.started_at)
                          : 'N/A'
                        }
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Version:</span>
                      <p className="font-medium">{task.metadata?.playbook_version || 'N/A'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Task Drawer */}
        <TaskDrawer
          open={drawerOpen}
          onClose={handleCloseDrawer}
          task={selectedTask}
        />
      </div>
    </div>
  );
}