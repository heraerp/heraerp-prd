#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/furniture/finance/page.tsx');

if (!fs.existsSync(filePath)) {
  console.log('❌ File not found');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Fix the import statements - they're compressed onto single lines
content = content.replace(
  /import React, \{ useState, useEffect \}\nfrom 'react'/g,
  "import React, { useState, useEffect } from 'react'"
);

content = content.replace(
  /import \{ Card \}\nfrom '@\/components\/ui\/card'/g,
  "import { Card } from '@/components/ui/card'"
);

content = content.replace(
  /import \{ Button \}\nfrom '@\/components\/ui\/button'/g,
  "import { Button } from '@/components/ui/button'"
);

content = content.replace(
  /import \{ Input \}\nfrom '@\/components\/ui\/input'/g,
  "import { Input } from '@/components/ui/input'"
);

content = content.replace(
  /import \{ Badge \}\nfrom '@\/components\/ui\/badge'/g,
  "import { Badge } from '@/components/ui/badge'"
);

content = content.replace(
  /import \{ Alert, AlertDescription \}\nfrom '@\/components\/ui\/alert'/g,
  "import { Alert, AlertDescription } from '@/components/ui/alert'"
);

content = content.replace(
  /import \{ Skeleton \}\nfrom '@\/components\/ui\/skeleton'/g,
  "import { Skeleton } from '@/components/ui/skeleton'"
);

content = content.replace(
  /import \{ Tabs, TabsContent, TabsList, TabsTrigger \}\nfrom '@\/components\/ui\/tabs'/g,
  "import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'"
);

content = content.replace(
  /import \{ Select, SelectContent, SelectItem, SelectTrigger, SelectValue\s*\}\nfrom '@\/components\/ui\/select'/g,
  "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'"
);

content = content.replace(
  /import \{ DollarSign, TrendingUp, TrendingDown, AlertCircle, FileText, Calculator, PiggyBank, CreditCard, Search, Filter, ChevronRight, Building, Receipt, BarChart3, Download, Plus\s*\}\nfrom 'lucide-react'/g,
  "import {\n  DollarSign,\n  TrendingUp,\n  TrendingDown,\n  AlertCircle,\n  FileText,\n  Calculator,\n  PiggyBank,\n  CreditCard,\n  Search,\n  Filter,\n  ChevronRight,\n  Building,\n  Receipt,\n  BarChart3,\n  Download,\n  Plus\n} from 'lucide-react'"
);

content = content.replace(
  /import \{ useMultiOrgAuth \}\nfrom '@\/components\/auth\/MultiOrgAuthProvider'/g,
  "import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'"
);

content = content.replace(
  /import \{ useFurnitureOrg, FurnitureOrgLoading \}\nfrom '@\/components\/furniture\/FurnitureOrgContext'/g,
  "import { useFurnitureOrg, FurnitureOrgLoading } from '@/components/furniture/FurnitureOrgContext'"
);

content = content.replace(
  /import \{ useFinanceData \}\nfrom '@\/lib\/furniture\/use-finance-data'/g,
  "import { useFinanceData } from '@/lib/furniture/use-finance-data'"
);

content = content.replace(
  /import \{ cn \}\nfrom '@\/lib\/utils' \/\/ GL Account columns/g,
  "import { cn } from '@/lib/utils'\n\n// GL Account columns"
);

// Fix the massive compressed glAccountColumns array - this is causing the syntax error
const originalColumns = /const glAccountColumns = \[ \{ key: 'entity_code'[^]*?\}\s*\]/;

const fixedColumns = `const glAccountColumns = [
  {
    key: 'entity_code',
    label: 'Account Code', 
    sortable: true,
    width: '120px',
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  {
    key: 'entity_name',
    label: 'Account Name',
    sortable: true,
    render: (value: string, row: any) => {
      const depth = row.depth || 0;
      const indent = depth * 24;
      const isHeader = (row.metadata as any)?.account_type === 'header';
      
      return (
        <div style={{ paddingLeft: \`\${indent}px\` }} className="flex items-start gap-1">
          {depth > 0 && <span className="text-muted-foreground text-xs mt-1">└─</span>}
          <div>
            <p className={cn(
              'font-medium',
              isHeader && 'text-primary dark:text-blue-400',
              !isHeader && depth > 0 && 'text-sm'
            )}>
              {value}
            </p>
            {(row.metadata as any)?.ifrs_classification && (
              <p className="text-xs text-muted-foreground">
                IFRS: {row.metadata.ifrs_classification}
              </p>
            )}
          </div>
        </div>
      );
    }
  },
  {
    key: 'account_type',
    label: 'Type',
    sortable: true,
    render: (_: any, row: any) => {
      const type = (row.metadata as any)?.account_type || 'detail';
      const colors = {
        header: 'bg-blue-500/20 text-primary',
        detail: 'bg-gray-900/20 text-muted-foreground'
      };
      
      return (
        <Badge variant="outline" className={cn('border-0', colors[type])}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      );
    }
  },
  {
    key: 'normal_balance',
    label: 'Normal Balance',
    sortable: true,
    align: 'center' as const,
    render: (_: any, row: any) => {
      const balance = (row.metadata as any)?.normal_balance || 'debit';
      return (
        <span className={cn(
          'font-medium',
          balance === 'debit' ? 'text-red-600' : 'text-green-600'
        )}>
          {balance.toUpperCase()}
        </span>
      );
    }
  },
  {
    key: 'current_balance',
    label: 'Current Balance',
    sortable: true,
    align: 'right' as const,
    render: (_: any, row: any) => {
      const balance = row.current_balance || 0;
      const balanceType = row.balance_type || 'Dr';
      
      if (balance === 0) {
        return <span className="font-mono text-muted-foreground">-</span>;
      }
      
      return (
        <span className={cn(
          'font-mono',
          balanceType === 'Cr' ? 'text-green-600' : 'text-red-600'
        )}>
          ₹{balance.toLocaleString('en-IN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}{' '}
          {balanceType}
        </span>
      );
    }
  },
  {
    key: 'actions',
    label: 'Actions',
    align: 'center' as const,
    render: (_: any, row: any) => (
      <div className="flex gap-1 justify-center">
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-muted-foreground/10">
          <FileText className="h-4 w-4" />
        </Button>
      </div>
    )
  }
]`;

if (originalColumns.test(content)) {
  content = content.replace(originalColumns, fixedColumns);
  console.log('✅ Fixed glAccountColumns array');
} else {
  console.log('❌ Could not find glAccountColumns pattern');
}

// Fix any remaining compressed variable declarations
content = content.replace(
  /const \{ organizationId, organizationName, orgLoading \} = useFurnitureOrg\(\)\n\nconst \{ glAccounts, metrics, loading, refresh \} = useFinanceData\(organizationId\)\n\nconst \[activeTab, setActiveTab\] = useState\('chart-of-accounts'\)\n\nconst \[searchTerm, setSearchTerm\] = useState\(''\)/g,
  `const { organizationId, organizationName, orgLoading } = useFurnitureOrg()
  const { glAccounts, metrics, loading, refresh } = useFinanceData(organizationId)
  const [activeTab, setActiveTab] = useState('chart-of-accounts')
  const [searchTerm, setSearchTerm] = useState('')`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ Fixed furniture finance page syntax');
console.log('✨ Furniture finance syntax fix complete!');