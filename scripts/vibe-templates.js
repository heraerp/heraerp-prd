#!/usr/bin/env node
/**
 * HERA Vibe Coding Templates
 * Generate perfect-first-attempt code structures
 */

const fs = require('fs');
const path = require('path');

const VIBE_TEMPLATES = {
  salonPage: (pageName, componentName) => `'use client'
// Force dynamic rendering to prevent SSG issues with SecuredSalonProvider
export const dynamic = "force-dynamic";

import React, { useState, useMemo } from 'react'
import { useSecuredSalonContext } from '../EnterpriseSecuredSalonProvider'
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { Plus, Search, Filter } from 'lucide-react'

export default function ${componentName}() {
  const { organization, salonRole } = useSecuredSalonContext()
  const [loading, setLoading] = useState(false)

  return (
    <SalonLuxePage
      title="${pageName}"
      description="Enterprise ${pageName.toLowerCase()} management"
      maxWidth="full"
      padding="lg"
    >
      <div className="space-y-6">
        {/* Add your vibe code here */}
        <div className="text-champagne">
          🚀 ${pageName} - Ready for vibe coding!
        </div>
      </div>
    </SalonLuxePage>
  )
}`,

  enterprisePage: (moduleName, pageName) => `'use client'

import React, { useState } from 'react'
import { ProtectedPage } from '@/components/rbac/ProtectedPage'
import { ModuleHomePage } from '@/components/modules/ModuleHomePage'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Building2, Users, BarChart3 } from 'lucide-react'

export default function ${moduleName}${pageName}Page() {
  const { organization } = useHERAAuth()
  
  const moduleConfig = {
    title: "${moduleName} ${pageName}",
    description: "Enterprise ${moduleName.toLowerCase()} ${pageName.toLowerCase()}",
    smartCode: "HERA.${moduleName.toUpperCase()}.${pageName.toUpperCase()}.v1",
    sections: [
      {
        title: "Quick Actions",
        items: [
          {
            title: "New ${pageName}",
            icon: Building2,
            href: "/${moduleName.toLowerCase()}/${pageName.toLowerCase()}/new"
          }
        ]
      }
    ]
  }

  return (
    <ProtectedPage requiredSpace="${moduleName.toLowerCase()}">
      <ModuleHomePage {...moduleConfig} />
    </ProtectedPage>
  )
}`,

  universalTransaction: (transactionType) => `'use client'

import React from 'react'
import UniversalTransaction from '@/components/universal/transactions/UniversalTransaction'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

export default function ${transactionType}TransactionPage() {
  const { organization } = useHERAAuth()

  const handleSave = async (header, lines) => {
    console.log('💾 Saving ${transactionType.toLowerCase()}:', { header, lines })
  }

  const handlePost = async (header, lines) => {
    console.log('📨 Posting ${transactionType.toLowerCase()}:', { header, lines })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <UniversalTransaction
        mode="${transactionType.toLowerCase()}"
        organization_id={organization?.id}
        onSave={handleSave}
        onPost={handlePost}
      />
    </div>
  )
}`
};

function generateVibeCode(templateType, ...args) {
  const template = VIBE_TEMPLATES[templateType];
  if (!template) {
    console.error(`❌ Template '${templateType}' not found`);
    return;
  }

  const code = template(...args);
  console.log('🎨 Generated vibe code:');
  console.log('='.repeat(50));
  console.log(code);
  console.log('='.repeat(50));
  
  return code;
}

// CLI interface
const [,, templateType, ...args] = process.argv;

if (!templateType) {
  console.log('🎯 HERA Vibe Templates - Perfect First Attempt Coding');
  console.log('');
  console.log('Available templates:');
  console.log('  salonPage <PageName> <ComponentName>');
  console.log('  enterprisePage <ModuleName> <PageName>');
  console.log('  universalTransaction <TransactionType>');
  console.log('');
  console.log('Examples:');
  console.log('  node scripts/vibe-templates.js salonPage "Dashboard" "SalonDashboard"');
  console.log('  node scripts/vibe-templates.js enterprisePage "Finance" "Reports"');
  console.log('  node scripts/vibe-templates.js universalTransaction "Sale"');
} else {
  generateVibeCode(templateType, ...args);
}

module.exports = { VIBE_TEMPLATES, generateVibeCode };