'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Calendar } from '@/components/ui/calendar'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  CheckSquare, Calendar as CalendarIcon, Clock, AlertCircle, 
  Users, Filter, Plus, Search, Star, ChevronRight,
  Phone, Mail, Video, MessageSquare, TrendingUp,
  Target, Briefcase, FileText, Activity, BarChart3, X
} from 'lucide-react'
import Link from 'next/link'
import { CRMLayout } from '@/components/layout/crm-layout'

const tasks = [
  {
    id: 1,
    title: 'Follow up with Sarah Johnson',
    type: 'call',
    contact: 'Sarah Johnson',
    company: 'Tech Solutions Inc',
    dueDate: '2024-01-20',
    dueTime: '2:00 PM',
    priority: 'high',
    completed: false,
    assignedTo: 'John Smith',
    relatedOpportunity: 'Tech Solutions - Q1 Implementation',
    notes: 'Discuss implementation timeline and technical requirements'
  },
  {
    id: 2,
    title: 'Send proposal to Mike Chen',
    type: 'email',
    contact: 'Mike Chen',
    company: 'StartupCo',
    dueDate: '2024-01-22',
    dueTime: '10:00 AM',
    priority: 'medium',
    completed: false,
    assignedTo: 'Jane Doe',
    relatedOpportunity: 'StartupCo - Pilot Program',
    notes: 'Include pricing options for 10, 20, and 50 users'
  },
  {
    id: 3,
    title: 'Contract negotiation call',
    type: 'meeting',
    contact: 'Emily Rodriguez',
    company: 'Global Enterprises',
    dueDate: '2024-01-19',
    dueTime: '3:00 PM',
    priority: 'high',
    completed: true,
    assignedTo: 'John Smith',
    relatedOpportunity: 'Global Enterprises - Enterprise License',
    notes: 'Finalized terms - 15% discount for 3-year commitment'
  },
  {
    id: 4,
    title: 'Demo preparation',
    type: 'task',
    contact: 'Sarah Johnson',
    company: 'Tech Solutions Inc',
    dueDate: '2024-01-25',
    dueTime: '11:00 AM',
    priority: 'medium',
    completed: false,
    assignedTo: 'Technical Team',
    relatedOpportunity: 'Tech Solutions - Q1 Implementation',
    notes: 'Customize demo with their specific use cases'
  },
  {
    id: 5,
    title: 'Quarterly check-in call',
    type: 'call',
    contact: 'David Lee',
    company: 'Retail Corp',
    dueDate: '2024-01-21',
    dueTime: '4:00 PM',
    priority: 'low',
    completed: false,
    assignedTo: 'Jane Doe',
    relatedOpportunity: null,
    notes: 'Regular account review - check satisfaction levels'
  }
]

const activities = [
  { type: 'call', icon: Phone, label: 'Call', count: 12, color: 'text-blue-600', bg: 'bg-blue-100' },
  { type: 'email', icon: Mail, label: 'Email', count: 28, color: 'text-green-600', bg: 'bg-green-100' },
  { type: 'meeting', icon: Video, label: 'Meeting', count: 8, color: 'text-purple-600', bg: 'bg-purple-100' },
  { type: 'task', icon: CheckSquare, label: 'Task', count: 15, color: 'text-orange-600', bg: 'bg-orange-100' }
]

export default function TasksDashboard() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showCompleted, setShowCompleted] = useState(false)
  const [taskList, setTaskList] = useState(tasks)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // New task form state
  const [newTask, setNewTask] = useState({
    title: '',
    contact_name: '',
    company: '',
    task_type: 'call',
    priority: 'medium',
    due_date: '',
    due_time: '',
    description: '',
    assigned_to: '',
    related_opportunity: ''
  })
  
  // Filter tasks
  const today = new Date().toISOString().split('T')[0]
  const now = new Date()
  
  const todayTasks = taskList.filter(task => 
    task.dueDate === today && !task.completed
  )
  const overdueTasks = taskList.filter(task => {
    const taskDate = new Date(task.dueDate)
    return taskDate && !isNaN(taskDate.getTime()) && taskDate < now && !task.completed
  })
  const upcomingTasks = taskList.filter(task => {
    const taskDate = new Date(task.dueDate)
    return taskDate && !isNaN(taskDate.getTime()) && taskDate > now && !task.completed
  })
  const completedTasks = taskList.filter(task => task.completed)
  
  // Calculate metrics
  const totalTasks = taskList.length
  const completedCount = completedTasks.length
  const completionRate = totalTasks > 0 ? (completedCount / totalTasks) * 100 : 0
  
  const handleTaskToggle = (taskId: string | number) => {
    setTaskList(taskList.map(task => 
      task.id === taskId ? { ...task, completed: !task.completed } : task
    ))
  }

  const handleCreateTask = async () => {
    if (!newTask.title || !newTask.contact_name || !newTask.due_date) {
      alert('Please fill in title, contact name, and due date')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/crm-tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_id: 'demo_org',
          title: newTask.title,
          contact_name: newTask.contact_name,
          task_type: newTask.task_type,
          priority: newTask.priority,
          due_date: newTask.due_date,
          description: newTask.description,
          assigned_to: newTask.assigned_to || 'Current User',
          related_opportunity: newTask.related_opportunity
        })
      })

      const result = await response.json()
      
      if (result.success) {
        // Convert API response to match our task list format
        const apiTask = result.data
        const uiTask = {
          id: apiTask.id,
          title: apiTask.entity_name,
          type: apiTask.dynamic_fields.task_type,
          contact: apiTask.dynamic_fields.contact_name,
          company: newTask.company,
          dueDate: apiTask.dynamic_fields.due_date,
          dueTime: newTask.due_time || '10:00 AM',
          priority: apiTask.dynamic_fields.priority,
          completed: false,
          assignedTo: apiTask.dynamic_fields.assigned_to,
          relatedOpportunity: apiTask.dynamic_fields.related_opportunity,
          notes: apiTask.dynamic_fields.description
        }
        
        setTaskList([...taskList, uiTask])
        setIsCreateModalOpen(false)
        
        // Reset form
        setNewTask({
          title: '',
          contact_name: '',
          company: '',
          task_type: 'call',
          priority: 'medium',
          due_date: '',
          due_time: '',
          description: '',
          assigned_to: '',
          related_opportunity: ''
        })
        
        alert('Task created successfully!')
      } else {
        alert('Failed to create task: ' + result.message)
      }
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Error creating task. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFormChange = (field: string, value: string) => {
    setNewTask(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const getTaskIcon = (type: string) => {
    switch(type) {
      case 'call': return Phone
      case 'email': return Mail
      case 'meeting': return Video
      case 'task': return CheckSquare
      default: return CheckSquare
    }
  }

  const getPriorityColor = (priority: string) => {
    switch(priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  return (
    <CRMLayout>
      <div className="min-h-screen bg-white p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-4 text-sm">
          <Link href="/crm-progressive" className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            <Users className="h-4 w-4" />
            CRM Hub
          </Link>
          <span className="text-gray-400">→</span>
          <span className="text-gray-600">Tasks & Activities</span>
        </div>

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Tasks & Activities</h1>
            <p className="text-gray-600 mt-1 text-sm sm:text-base">Stay on top of your daily work and follow-ups</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/crm-progressive/dashboards/main">
                <BarChart3 className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Executive View</span>
                <span className="sm:hidden">Executive</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/crm-progressive/dashboards/sales">
                <Target className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Sales Pipeline</span>
                <span className="sm:hidden">Sales</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">New Task</span>
                  <span className="sm:hidden">New</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="title" className="text-right">
                      Title*
                    </Label>
                    <Input
                      id="title"
                      value={newTask.title}
                      onChange={(e) => handleFormChange('title', e.target.value)}
                      placeholder="Follow up with..."
                      className="col-span-3"
                    />
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="contact_name" className="text-right">
                      Contact*
                    </Label>
                    <Input
                      id="contact_name"
                      value={newTask.contact_name}
                      onChange={(e) => handleFormChange('contact_name', e.target.value)}
                      placeholder="John Smith"
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="company" className="text-right">
                      Company
                    </Label>
                    <Input
                      id="company"
                      value={newTask.company}
                      onChange={(e) => handleFormChange('company', e.target.value)}
                      placeholder="Company Name"
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="task_type" className="text-right">
                      Type
                    </Label>
                    <Select value={newTask.task_type} onValueChange={(value) => handleFormChange('task_type', value)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="follow_up">Follow Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="priority" className="text-right">
                      Priority
                    </Label>
                    <Select value={newTask.priority} onValueChange={(value) => handleFormChange('priority', value)}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="due_date" className="text-right">
                      Due Date*
                    </Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) => handleFormChange('due_date', e.target.value)}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="due_time" className="text-right">
                      Due Time
                    </Label>
                    <Input
                      id="due_time"
                      type="time"
                      value={newTask.due_time}
                      onChange={(e) => handleFormChange('due_time', e.target.value)}
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="assigned_to" className="text-right">
                      Assigned To
                    </Label>
                    <Input
                      id="assigned_to"
                      value={newTask.assigned_to}
                      onChange={(e) => handleFormChange('assigned_to', e.target.value)}
                      placeholder="Team member name"
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="related_opportunity" className="text-right">
                      Opportunity
                    </Label>
                    <Input
                      id="related_opportunity"
                      value={newTask.related_opportunity}
                      onChange={(e) => handleFormChange('related_opportunity', e.target.value)}
                      placeholder="Related sales opportunity"
                      className="col-span-3"
                    />
                  </div>

                  <div className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor="description" className="text-right">
                      Description
                    </Label>
                    <Textarea
                      id="description"
                      value={newTask.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      placeholder="Additional notes or details..."
                      className="col-span-3"
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateTask}
                    disabled={isLoading}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {isLoading ? 'Creating...' : 'Create Task'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Activity Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {activities.map((activity) => (
            <Card key={activity.type} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{activity.label} Today</p>
                    <p className="text-2xl font-bold">{activity.count}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.type === 'task' ? 'To complete' : 'Scheduled'}
                    </p>
                  </div>
                  <div className={`h-12 w-12 ${activity.bg} rounded-lg flex items-center justify-center`}>
                    <activity.icon className={`h-6 w-6 ${activity.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Task Progress */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Today&apos;s Progress</h3>
                <p className="text-sm text-gray-600">
                  {completedCount} of {totalTasks} tasks completed
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{completionRate.toFixed(0)}%</p>
                <p className="text-sm text-gray-600">Completion rate</p>
              </div>
            </div>
            <Progress value={completionRate} className="h-3" />
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task Lists - 2 columns wide */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Search tasks..." 
                className="pl-10 w-full"
              />
            </div>

            {/* Overdue Tasks */}
            {overdueTasks.length > 0 && (
              <Card className="border-red-200">
                <CardHeader className="bg-red-50">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-5 w-5" />
                    Overdue Tasks ({overdueTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {overdueTasks.map(task => {
                    const TaskIcon = getTaskIcon(task.type)
                    return (
                      <div key={task.id} className="p-4 border rounded-lg bg-red-50/50">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={task.completed}
                            onCheckedChange={() => handleTaskToggle(task.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold flex items-center gap-2">
                                <TaskIcon className="h-4 w-4" />
                                {task.title}
                              </h4>
                              <Badge variant={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {task.contact} • {task.company}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-red-600">
                                Due: {task.dueDate} at {task.dueTime}
                              </p>
                              <p className="text-xs text-gray-500">
                                Assigned to: {task.assignedTo}
                              </p>
                            </div>
                            {task.notes && (
                              <p className="text-xs text-gray-500 mt-2 italic">
                                {task.notes}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}

            {/* Today&apos;s Tasks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Today&apos;s Tasks ({todayTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayTasks.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No tasks scheduled for today
                  </p>
                ) : (
                  todayTasks.map(task => {
                    const TaskIcon = getTaskIcon(task.type)
                    return (
                      <div key={task.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex items-start gap-3">
                          <Checkbox 
                            checked={task.completed}
                            onCheckedChange={() => handleTaskToggle(task.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-semibold flex items-center gap-2">
                                <TaskIcon className="h-4 w-4" />
                                {task.title}
                              </h4>
                              <Badge variant={getPriorityColor(task.priority)}>
                                {task.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">
                              {task.contact} • {task.company}
                            </p>
                            <div className="flex items-center justify-between mt-2">
                              <p className="text-xs text-gray-500">
                                Due at {task.dueTime}
                              </p>
                              <p className="text-xs text-gray-500">
                                Assigned to: {task.assignedTo}
                              </p>
                            </div>
                            {task.relatedOpportunity && (
                              <div className="flex items-center gap-1 mt-2">
                                <Briefcase className="h-3 w-3 text-gray-400" />
                                <p className="text-xs text-gray-600">
                                  {task.relatedOpportunity}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </CardContent>
            </Card>

            {/* Upcoming Tasks */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Upcoming Tasks ({upcomingTasks.length})
                </CardTitle>
                <Button variant="ghost" size="sm">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingTasks.slice(0, 5).map(task => {
                  const TaskIcon = getTaskIcon(task.type)
                  return (
                    <div key={task.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <TaskIcon className="h-4 w-4 text-gray-400" />
                          <h4 className="font-medium text-sm">{task.title}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {task.dueDate}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 ml-6">
                        {task.contact} • {task.company}
                      </p>
                    </div>
                  )
                })}
              </CardContent>
            </Card>

            {/* Completed Tasks */}
            {showCompleted && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquare className="h-5 w-5" />
                    Completed Tasks ({completedTasks.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {completedTasks.map(task => {
                    const TaskIcon = getTaskIcon(task.type)
                    return (
                      <div key={task.id} className="p-3 border rounded-lg bg-gray-50 opacity-75">
                        <div className="flex items-center gap-3">
                          <Checkbox 
                            checked={true}
                            onCheckedChange={() => handleTaskToggle(task.id)}
                          />
                          <div className="flex-1">
                            <h4 className="font-medium text-sm line-through text-gray-500 flex items-center gap-2">
                              <TaskIcon className="h-4 w-4" />
                              {task.title}
                            </h4>
                            <p className="text-xs text-gray-400">
                              {task.contact} • Completed on {task.dueDate}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Calendar Widget */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Calendar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>

            {/* Task Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  This Week&apos;s Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tasks Completed</span>
                  <span className="font-semibold">32</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Calls Made</span>
                  <span className="font-semibold">18</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Emails Sent</span>
                  <span className="font-semibold">45</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Meetings Held</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Productivity Score</span>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold">8.5/10</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  {showCompleted ? 'Hide' : 'Show'} Completed Tasks
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <FileText className="h-4 w-4 mr-2" />
                  Export Task Report
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  View Team Tasks
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </div>
    </CRMLayout>
  )
}