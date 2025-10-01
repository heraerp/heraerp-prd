// ================================================================================
// HERA UNIVERSAL SCHEMAS - STUB FOR AUTH IMPLEMENTATION
// Smart Code: HERA.SCHEMAS.UNIVERSAL.STUB.V1
// Minimal schema definitions for frontend auth, will be expanded later
// ================================================================================

import { z } from 'zod'

// Basic user schema for authentication
export const User = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  roles: z.array(z.enum(['owner', 'manager', 'stylist', 'cashier'])),
  organization_id: z.string().uuid(),
  created_at: z.string().datetime().optional(),
  last_login: z.string().datetime().optional()
})
export type User = z.infer<typeof User>

// Login request schema
export const LoginRequest = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})
export type LoginRequest = z.infer<typeof LoginRequest>

// Login response schema
export const LoginResponse = z.object({
  token: z.string(),
  user: User,
  expires_at: z.string().datetime()
})
export type LoginResponse = z.infer<typeof LoginResponse>

// Signup request schema
export const SignupRequest = z
  .object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    organizationName: z.string().min(1, 'Organization name is required')
  })
  .refine(data => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword']
  })
export type SignupRequest = z.infer<typeof SignupRequest>

// Dashboard metrics (mock data structure)
export const DashboardMetrics = z.object({
  todaysSales: z.object({
    amount: z.number(),
    currency: z.string().default('AED'),
    change: z.number().optional()
  }),
  upcomingAppointments: z.object({
    count: z.number(),
    next: z.string().datetime().optional()
  }),
  lowStock: z.object({
    count: z.number(),
    items: z.array(z.string())
  }),
  organization_id: z.string().uuid()
})
export type DashboardMetrics = z.infer<typeof DashboardMetrics>

// API Response wrapper
export const ApiResponse = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  code: z.string().optional()
})
export type ApiResponse = z.infer<typeof ApiResponse>

// Error response
export const ApiError = z.object({
  message: z.string(),
  code: z.string().optional(),
  status: z.number().optional()
})
export type ApiError = z.infer<typeof ApiError>
