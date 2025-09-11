'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import React from 'react';
import { PWMLayout } from '@/components/pwm/PWMLayout';

export default function PWMPage() {
  // TODO: Get organization ID from auth context
  const organizationId = 'demo-org-001';
  
  return <PWMLayout organizationId={organizationId} />;
}