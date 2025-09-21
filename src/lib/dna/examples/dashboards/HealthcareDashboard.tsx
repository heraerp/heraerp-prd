'use client'

// ================================================================================
// HERA DNA HEALTHCARE DASHBOARD EXAMPLE
// Smart Code: HERA.DNA.EXAMPLE.DASHBOARD.HEALTHCARE.V1
// Complete healthcare practice dashboard with patient management
// ================================================================================

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Heart,
  DollarSign,
  Users,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle,
  User,
  Phone,
  MapPin,
  Activity,
  Stethoscope,
  Pill,
  FileText,
  UserCheck,
  TrendingUp,
  Shield
} from 'lucide-react'
import { StatCardDNA } from '../../components/ui/stat-card-dna'
import { EnterpriseDataTable } from '../../components/organisms/EnterpriseDataTable'
import { motion } from 'framer-motion'

// ================================================================================
// TYPES AND INTERFACES
// ================================================================================

interface HealthcareMetrics {
  dailyRevenue: number
  revenueChange: number
  patientsToday: number
  patientsChange: number
  appointmentsCompleted: number
  completedChange: number
  bedOccupancy: number
  occupancyChange: number
}

interface Patient {
  id: string
  name: string
  age: number
  gender: string
  condition: string
  doctor: string
  room?: string
  admissionDate?: string
  status: 'waiting' | 'in_consultation' | 'treatment' | 'discharged'
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

interface Appointment {
  id: string
  patientName: string
  doctorName: string
  time: string
  type: string
  duration: number
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled'
}

interface Doctor {
  id: string
  name: string
  avatar: string
  specialization: string
  patientsToday: number
  availability: 'available' | 'busy' | 'surgery' | 'off_duty'
  rating: number
  experience: number
}

interface HealthcareDashboardProps {
  organizationId?: string
  className?: string
}

// ================================================================================
// MOCK DATA
// ================================================================================

const mockMetrics: HealthcareMetrics = {
  dailyRevenue: 15750.25,
  revenueChange: 8.3,
  patientsToday: 42,
  patientsChange: 12.5,
  appointmentsCompleted: 38,
  completedChange: 6.8,
  bedOccupancy: 78,
  occupancyChange: -3.2
}

const mockPatients: Patient[] = [
  {
    id: 'pat-001',
    name: 'John Smith',
    age: 45,
    gender: 'Male',
    condition: 'Chest Pain',
    doctor: 'Dr. Johnson',
    status: 'in_consultation',
    urgency: 'high'
  },
  {
    id: 'pat-002',
    name: 'Mary Wilson',
    age: 32,
    gender: 'Female',
    condition: 'Regular Checkup',
    doctor: 'Dr. Davis',
    status: 'waiting',
    urgency: 'low'
  },
  {
    id: 'pat-003',
    name: 'Robert Brown',
    age: 67,
    gender: 'Male',
    condition: 'Diabetes Follow-up',
    doctor: 'Dr. Miller',
    room: 'Room 205',
    admissionDate: '2024-01-15',
    status: 'treatment',
    urgency: 'medium'
  },
  {
    id: 'pat-004',
    name: 'Lisa Anderson',
    age: 28,
    gender: 'Female',
    condition: 'Prenatal Care',
    doctor: 'Dr. Thompson',
    status: 'completed',
    urgency: 'low'
  }
]

const mockAppointments: Appointment[] = [
  {
    id: 'app-001',
    patientName: 'Sarah Johnson',
    doctorName: 'Dr. Davis',
    time: '10:30 AM',
    type: 'Consultation',
    duration: 30,
    status: 'ongoing'
  },
  {
    id: 'app-002',
    patientName: 'Michael Chen',
    doctorName: 'Dr. Miller',
    time: '11:00 AM',
    type: 'Follow-up',
    duration: 20,
    status: 'scheduled'
  },
  {
    id: 'app-003',
    patientName: 'Jennifer Davis',
    doctorName: 'Dr. Johnson',
    time: '11:30 AM',
    type: 'Emergency',
    duration: 45,
    status: 'scheduled'
  },
  {
    id: 'app-004',
    patientName: 'David Wilson',
    doctorName: 'Dr. Thompson',
    time: '12:00 PM',
    type: 'Surgery Consultation',
    duration: 60,
    status: 'completed'
  }
]

const mockDoctors: Doctor[] = [
  {
    id: 'doc-001',
    name: 'Dr. Emily Johnson',
    avatar: '/avatars/dr-johnson.jpg',
    specialization: 'Cardiology',
    patientsToday: 12,
    availability: 'busy',
    rating: 4.9,
    experience: 15
  },
  {
    id: 'doc-002',
    name: 'Dr. Michael Davis',
    avatar: '/avatars/dr-davis.jpg',
    specialization: 'Internal Medicine',
    patientsToday: 8,
    availability: 'available',
    rating: 4.8,
    experience: 12
  },
  {
    id: 'doc-003',
    name: 'Dr. Sarah Miller',
    avatar: '/avatars/dr-miller.jpg',
    specialization: 'Endocrinology',
    patientsToday: 6,
    availability: 'surgery',
    rating: 4.9,
    experience: 18
  },
  {
    id: 'doc-004',
    name: 'Dr. James Thompson',
    avatar: '/avatars/dr-thompson.jpg',
    specialization: 'Obstetrics & Gynecology',
    patientsToday: 10,
    availability: 'busy',
    rating: 4.7,
    experience: 10
  }
]

// ================================================================================
// UTILITY FUNCTIONS
// ================================================================================

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

const getUrgencyColor = (urgency: string) => {
  const colors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }
  return colors[urgency as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const getStatusColor = (status: string) => {
  const colors = {
    waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    in_consultation: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    treatment: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    discharged: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    ongoing: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    available: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    busy: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
    surgery: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    off_duty: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

const getStatusIcon = (status: string) => {
  const icons = {
    waiting: Clock,
    in_consultation: Stethoscope,
    treatment: Activity,
    discharged: CheckCircle,
    scheduled: Calendar,
    ongoing: Activity,
    completed: CheckCircle,
    cancelled: AlertTriangle,
    available: UserCheck,
    busy: User,
    surgery: Activity,
    off_duty: User
  }
  return icons[status as keyof typeof icons] || Clock
}

// ================================================================================
// MAIN COMPONENT
// ================================================================================

export function HealthcareDashboard({ organizationId, className }: HealthcareDashboardProps) {
  const [metrics, setMetrics] = useState<HealthcareMetrics>(mockMetrics)
  const [patients, setPatients] = useState<Patient[]>(mockPatients)
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments)
  const [doctors, setDoctors] = useState<Doctor[]>(mockDoctors)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)

    return () => clearInterval(timer)
  }, [])

  // Table columns for patients
  const patientColumns = [
    {
      accessorKey: 'name',
      header: 'Patient',
      cell: ({ row }: { row: any }) => (
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="font-medium">{row.original.name}</p>
            <p className="text-sm text-muted-foreground">
              {row.original.age}y • {row.original.gender}
            </p>
          </div>
        </div>
      )
    },
    {
      accessorKey: 'condition',
      header: 'Condition',
      cell: ({ row }: { row: any }) => row.original.condition
    },
    {
      accessorKey: 'doctor',
      header: 'Doctor',
      cell: ({ row }: { row: any }) => row.original.doctor
    },
    {
      accessorKey: 'urgency',
      header: 'Urgency',
      cell: ({ row }: { row: any }) => (
        <Badge className={getUrgencyColor(row.original.urgency)}>{row.original.urgency}</Badge>
      )
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }: { row: any }) => {
        const StatusIcon = getStatusIcon(row.original.status)
        return (
          <Badge className={getStatusColor(row.original.status)}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {row.original.status.replace('_', ' ')}
          </Badge>
        )
      }
    },
    {
      accessorKey: 'room',
      header: 'Room',
      cell: ({ row }: { row: any }) => row.original.room || 'Outpatient'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold !text-gray-900 dark:!text-gray-100">
            Healthcare Dashboard
          </h1>
          <p className="text-muted-foreground">
            City General Medical Center • {currentTime.toLocaleDateString()}{' '}
            {currentTime.toLocaleTimeString()}
          </p>
        </div>
        <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          <Heart className="w-3 h-3 mr-1" />
          Operational
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <StatCardDNA
            title="Daily Revenue"
            value={formatCurrency(metrics.dailyRevenue)}
            trend={
              metrics.revenueChange > 0 ? `+${metrics.revenueChange}%` : `${metrics.revenueChange}%`
            }
            trendDirection={metrics.revenueChange > 0 ? 'up' : 'down'}
            icon={DollarSign}
            description="Today's total revenue"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <StatCardDNA
            title="Patients Today"
            value={metrics.patientsToday.toString()}
            trend={
              metrics.patientsChange > 0
                ? `+${metrics.patientsChange}%`
                : `${metrics.patientsChange}%`
            }
            trendDirection={metrics.patientsChange > 0 ? 'up' : 'down'}
            icon={Users}
            description="Total patients seen"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <StatCardDNA
            title="Completed"
            value={metrics.appointmentsCompleted.toString()}
            trend={
              metrics.completedChange > 0
                ? `+${metrics.completedChange}%`
                : `${metrics.completedChange}%`
            }
            trendDirection={metrics.completedChange > 0 ? 'up' : 'down'}
            icon={CheckCircle}
            description="Appointments completed"
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <StatCardDNA
            title="Bed Occupancy"
            value={`${metrics.bedOccupancy}%`}
            trend={
              metrics.occupancyChange > 0
                ? `+${metrics.occupancyChange}%`
                : `${metrics.occupancyChange}%`
            }
            trendDirection={metrics.occupancyChange > 0 ? 'up' : 'down'}
            icon={Activity}
            description="Current bed utilization"
          />
        </motion.div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Today's Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {appointments.map(appointment => {
                const StatusIcon = getStatusIcon(appointment.status)
                return (
                  <div
                    key={appointment.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          appointment.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-600'
                            : appointment.status === 'ongoing'
                              ? 'bg-orange-100 text-orange-600'
                              : appointment.status === 'completed'
                                ? 'bg-green-100 text-green-600'
                                : 'bg-red-100 text-red-600'
                        }`}
                      >
                        <StatusIcon className="w-5 h-5" />
                      </div>

                      <div>
                        <p className="font-medium">{appointment.patientName}</p>
                        <p className="text-sm text-muted-foreground">
                          {appointment.type} • {appointment.doctorName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="font-medium">{appointment.time}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(appointment.duration)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Doctor Status */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                Medical Staff
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {doctors.map(doctor => {
                const StatusIcon = getStatusIcon(doctor.availability)
                return (
                  <div key={doctor.id} className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={doctor.avatar} />
                      <AvatarFallback>
                        {doctor.name
                          .split(' ')
                          .map(n => n[1])
                          .join('')}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{doctor.name}</p>
                        <Badge className={`${getStatusColor(doctor.availability)} text-xs`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {doctor.availability.replace('_', ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground">
                          {doctor.specialization}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {doctor.patientsToday} patients
                        </span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm">Critical patient in ER</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-yellow-50 dark:bg-yellow-950/30 rounded">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm">Surgery delayed 30 min</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded">
                <Pill className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Medication refill needed</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Patient List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Active Patients
          </CardTitle>
        </CardHeader>
        <CardContent>
          <EnterpriseDataTable
            data={patients}
            columns={patientColumns}
            searchable={true}
            exportable={true}
            pagination={true}
          />
        </CardContent>
      </Card>

      {/* Additional Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Patient Satisfaction</span>
              <div className="flex items-center gap-1">
                <Progress value={96} className="w-16" />
                <span className="font-medium">96%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Average Wait Time</span>
              <span className="font-medium">18 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Treatment Success Rate</span>
              <span className="font-medium text-green-600">94%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Readmission Rate</span>
              <span className="font-medium text-orange-600">3.2%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Facility Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="text-sm">789 Medical Center Drive</p>
                <p className="text-sm text-muted-foreground">Healthcare District, City 67890</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">(555) 246-8135</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">24/7 Emergency Services</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">250 Beds • 45 ICU • 12 OR</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ================================================================================
// EXPORTS
// ================================================================================

export default HealthcareDashboard

// Export types for external use
export type { HealthcareDashboardProps, HealthcareMetrics, Patient, Appointment, Doctor }
