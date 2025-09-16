#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Fix the remaining furniture files with syntax errors
const filesToFix = [
  'src/app/furniture/finance/page.tsx',
  'src/app/furniture/hr/page.tsx'
];

function fixFinancePage(content) {
  // Fix the broken contextLoading check
  content = content.replace(
    /if \(contextLoading\) \{\s*return \( <div[^}]+\} \} \}/g,
    `if (contextLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    )
  }`
  );

  // Fix the variable declarations that are still compressed
  content = content.replace(
    /const \[selectedType, setSelectedType\] = useState\('all'\)\n\nconst \[selectedLevel, setSelectedLevel\] = useState\('all'\)/g,
    `  const [selectedType, setSelectedType] = useState('all')
  const [selectedLevel, setSelectedLevel] = useState('all')`
  );

  return content;
}

function fixHRPage(content) {
  // Fix imports that are compressed
  content = content.replace(
    /import \{ cn \}\nfrom '@\/lib\/utils' \/\/ Employee table columns/g,
    "import { cn } from '@/lib/utils'\n\n// Employee table columns"
  );

  // Fix the massive compressed employeeColumns array - this is the main issue
  const compressedColumns = /const employeeColumns = \[ \{ id: 'entity_code'[^]*?\}\s*\]/;
  
  const fixedColumns = `const employeeColumns = [
  {
    id: 'entity_code',
    key: 'entity_code',
    header: 'Employee ID',
    label: 'Employee ID',
    accessor: 'entity_code',
    sortable: true,
    width: '120px',
    render: (value: string) => (
      <span className="font-mono text-sm">{value}</span>
    )
  },
  {
    id: 'entity_name',
    key: 'entity_name',
    header: 'Name',
    label: 'Name',
    accessor: 'entity_name',
    sortable: true,
    render: (value: string, row: any) => (
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-foreground font-medium">
          {value
            .split(' ')
            .map(n => n[0])
            .join('')
            .substring(0, 2)
            .toUpperCase()}
        </div>
        <div>
          <p className="font-medium">{value}</p>
          <p className="text-xs text-muted-foreground">
            {(row.metadata as any)?.position || 'Employee'}
          </p>
        </div>
      </div>
    )
  },
  {
    id: 'department',
    key: 'department',
    header: 'Department',
    label: 'Department',
    accessor: (row: any) => (row.metadata as any)?.department || 'General',
    sortable: true,
    render: (_: any, row: any) => {
      const dept = (row.metadata as any)?.department || 'General';
      const deptColors: Record<string, string> = {
        Management: 'bg-purple-500/20 text-purple-400',
        Production: 'bg-blue-500/20 text-blue-400',
        'Quality Control': 'bg-green-500/20 text-green-400',
        Sales: 'bg-orange-500/20 text-orange-400',
        Administration: 'bg-pink-500/20 text-pink-400'
      };
      
      return (
        <Badge variant="outline" className={cn('border-0', deptColors[dept] || 'bg-gray-500/20 text-gray-400')}>
          {dept}
        </Badge>
      );
    }
  }
]`;

  if (compressedColumns.test(content)) {
    content = content.replace(compressedColumns, fixedColumns);
  }

  return content;
}

// Process each file
filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  if (file.includes('finance')) {
    content = fixFinancePage(content);
  } else if (file.includes('hr')) {
    content = fixHRPage(content);
  }
  
  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed final syntax errors in ${file}`);
  } else {
    console.log(`ℹ️  No changes needed for ${file}`);
  }
});

console.log('\n✨ Final furniture module syntax fixes complete!');