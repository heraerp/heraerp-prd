'use client'

import { UniversalLayout } from '@/src/components/layout/UniversalLayout'
import {
  Heart,
  Calendar,
  Users,
  FileText,
  Pill,
  Activity,
  Stethoscope,
  ClipboardList,
  Phone,
  BarChart3
} from 'lucide-react'
import { getModuleTheme } from '@/src/lib/theme/module-themes'

const theme = getModuleTheme('healthcare')

const sidebarItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Activity className="w-5 h-5" />,
    href: '/healthcare',
    color: 'hover:bg-blue-100'
  },
  {
    id: 'appointments',
    label: 'Appointments',
    icon: <Calendar className="w-5 h-5" />,
    href: '/healthcare/appointments',
    badge: '8',
    color: 'hover:bg-cyan-100'
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: <Users className="w-5 h-5" />,
    href: '/healthcare/patients',
    color: 'hover:bg-blue-100'
  },
  {
    id: 'consultations',
    label: 'Consultations',
    icon: <Stethoscope className="w-5 h-5" />,
    href: '/healthcare/consultations',
    badge: 'Live',
    color: 'hover:bg-cyan-100'
  },
  {
    id: 'prescriptions',
    label: 'Prescriptions',
    icon: <Pill className="w-5 h-5" />,
    href: '/healthcare/prescriptions',
    color: 'hover:bg-blue-100'
  },
  {
    id: 'medical-records',
    label: 'Medical Records',
    icon: <FileText className="w-5 h-5" />,
    href: '/healthcare/records',
    color: 'hover:bg-cyan-100'
  },
  {
    id: 'lab-results',
    label: 'Lab Results',
    icon: <ClipboardList className="w-5 h-5" />,
    href: '/healthcare/lab',
    badge: '3',
    color: 'hover:bg-blue-100'
  },
  {
    id: 'emergency',
    label: 'Emergency',
    icon: <Phone className="w-5 h-5" />,
    href: '/healthcare/emergency',
    color: 'hover:bg-red-100'
  },
  {
    id: 'reports',
    label: 'Reports',
    icon: <BarChart3 className="w-5 h-5" />,
    href: '/healthcare/reports',
    color: 'hover:bg-cyan-100'
  }
]

const quickActions = [
  {
    id: 'new-appointment',
    label: 'Book Appointment',
    icon: <Calendar className="w-5 h-5" />,
    href: '/healthcare/appointments?action=new',
    color: 'hover:bg-blue-100',
    description: 'Schedule patient appointment'
  },
  {
    id: 'new-patient',
    label: 'Register Patient',
    icon: <Users className="w-5 h-5" />,
    href: '/healthcare/patients?action=new',
    color: 'hover:bg-cyan-100',
    description: 'Add new patient record'
  },
  {
    id: 'start-consultation',
    label: 'Start Consultation',
    icon: <Stethoscope className="w-5 h-5" />,
    href: '/healthcare/consultations?action=new',
    color: 'hover:bg-blue-100',
    description: 'Begin patient consultation'
  },
  {
    id: 'write-prescription',
    label: 'Write Prescription',
    icon: <Pill className="w-5 h-5" />,
    href: '/healthcare/prescriptions?action=new',
    color: 'hover:bg-cyan-100',
    description: 'Create new prescription'
  },
  {
    id: 'order-lab-test',
    label: 'Order Lab Test',
    icon: <ClipboardList className="w-5 h-5" />,
    href: '/healthcare/lab?action=order',
    color: 'hover:bg-blue-100',
    description: 'Request laboratory tests'
  },
  {
    id: 'emergency-alert',
    label: 'Emergency Alert',
    icon: <Phone className="w-5 h-5" />,
    href: '/healthcare/emergency?action=alert',
    color: 'hover:bg-red-100',
    description: 'Send emergency notification'
  }
]

export default function HealthcareLayout({ children }: { children: React.ReactNode }) {
  return (
    <UniversalLayout
      title="Health Pro"
      subtitle="Medical Center"
      icon={Heart}
      sidebarItems={sidebarItems}
      quickActions={quickActions}
      brandGradient={theme.brandGradient}
      accentGradient={theme.accentGradient}
      backgroundGradient={theme.backgroundGradient}
      baseUrl="/healthcare"
    >
      {children}
    </UniversalLayout>
  )
}
