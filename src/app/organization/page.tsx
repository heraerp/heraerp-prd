'use client'

import React from 'react'
import { redirect } from 'next/navigation'

// Redirect to dashboard as the default organization page
export default function OrganizationPage() {
  redirect('/organization/dashboard')
}