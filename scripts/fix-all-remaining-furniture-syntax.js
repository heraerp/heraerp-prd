#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// All furniture files that need syntax fixes
const filesToFix = [
  'src/app/furniture/ai-manager/page.tsx',
  'src/app/furniture/digital-accountant/page.tsx', 
  'src/app/furniture/finance/page.tsx',
  'src/app/furniture/hr/page.tsx',
  'src/app/furniture/inventory/page.tsx',
  'src/app/furniture/page.tsx',
  'src/app/furniture/production/orders/[id]/page.tsx'
];

function fixSyntaxErrors(content) {
  // Fix missing newlines after export const dynamic
  content = content.replace(
    /export const dynamic = 'force-dynamic'\s*([^\n])/g,
    "export const dynamic = 'force-dynamic'\n$1"
  );

  // Fix compressed JSDoc comments followed by imports
  content = content.replace(
    /\*\/ import React/g,
    '*/\nimport React'
  );

  // Fix compressed function definitions
  content = content.replace(
    /\} export default function ([A-Z][a-zA-Z]*)\(\) \{/g,
    '}\n\nexport default function $1() {'
  );

  // Fix compressed variable declarations
  content = content.replace(
    /const \[([^\]]+)\] = useState\([^)]+\) const \[([^\]]+)\] = useState/g,
    'const [$1] = useState($1)\n  const [$2] = useState'
  );

  // Fix compressed interface properties in ai-manager
  content = content.replace(
    /label: string\s+value: string \| number\s+trend\?: 'up' \| 'down' \| 'stable'\s+change\?: number/g,
    'label: string;\n    value: string | number;\n    trend?: \'up\' | \'down\' | \'stable\';\n    change?: number;'
  );

  // Fix compressed useEffect patterns
  content = content.replace(
    /const inputRef = useRef<HTMLInputElement>\(null\)\s*\/\/ Auto-scroll to bottom\s*useEffect\(\(\) => \{/g,
    'const inputRef = useRef<HTMLInputElement>(null)\n\n  // Auto-scroll to bottom\n  useEffect(() => {'
  );

  // Fix renderMessage function that's on one line
  content = content.replace(
    /const renderMessage = \(message: AIMessage\) => \{ const isUser[^}]+\} \}/g,
    `const renderMessage = (message: AIMessage) => {
    const isUser = message.type === 'user'
    const isInsight = message.type === 'insight'
    const isSystem = message.type === 'system'

    return (
      <div key={message.id} className={cn('flex gap-3', isUser ? 'justify-end' : 'justify-start')}>
        {!isUser && (
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            isInsight ? 'bg-yellow-500/20' : 'bg-blue-500/20'
          )}>
            {isInsight ? (
              <Lightbulb className="h-4 w-4 text-yellow-500" />
            ) : (
              <Brain className="h-4 w-4 text-blue-500" />
            )}
          </div>
        )}
        <div className={cn(
          'max-w-[80%] rounded-lg p-4',
          isUser
            ? 'bg-blue-600 text-foreground'
            : isInsight
              ? 'bg-yellow-500/10 border border-yellow-500/30'
              : isSystem
                ? 'bg-purple-500/10 border border-purple-500/30'
                : 'bg-muted-foreground/10'
        )}>
          {message.priority && !isUser && (
            <Badge variant="outline" className={cn(
              'mb-2',
              message.priority === 'high'
                ? 'border-red-500 text-red-500'
                : message.priority === 'medium'
                  ? 'border-yellow-500 text-yellow-500'
                  : 'border-green-500 text-green-500'
            )}>
              {message.priority.toUpperCase()} PRIORITY
            </Badge>
          )}
          <p className={cn('whitespace-pre-wrap', isInsight && 'font-medium')}>
            {message.content}
          </p>
        </div>
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4" />
          </div>
        )}
      </div>
    )
  }`
  );

  // Fix compressed comment and import statements
  content = content.replace(
    /from '@\/lib\/utils' \/\/ Remove old GLAccount interface as we're using GLAccountNode from the service export default function/g,
    "from '@/lib/utils'\n\n// Remove old GLAccount interface as we're using GLAccountNode from the service\nexport default function"
  );

  // Fix compressed function patterns and variable patterns
  content = content.replace(
    /\} \/\/ Calculate totals and count all accounts including children const countAllAccounts/g,
    '  }\n\n  // Calculate totals and count all accounts including children\n  const countAllAccounts'
  );

  // Fix complex compressed useEffect and scroll patterns
  content = content.replace(
    /const timer = setTimeout\(\(\) => \{ requestAnimationFrame\(scrollToBottom\) \}, 50\) return \(\) => clearTimeout\(timer\) \}, \[messages\]\)/g,
    '    const timer = setTimeout(() => {\n      requestAnimationFrame(scrollToBottom)\n    }, 50)\n\n    return () => clearTimeout(timer)\n  }, [messages])'
  );

  // Fix scroll viewport access patterns
  content = content.replace(
    /const viewport = scrollAreaRef\.current\.querySelector\('\[data-radix-scroll-area-viewport\]'\) if \(viewport\) \{/g,
    '        const viewport = scrollAreaRef.current.querySelector(\'[data-radix-scroll-area-viewport]\')\n        if (viewport) {'
  );

  content = content.replace(
    /viewport\.scrollTo\(\{ top: viewport\.scrollHeight, behavior: 'smooth' \}\) \} \}/g,
    '          viewport.scrollTo({ top: viewport.scrollHeight, behavior: \'smooth\' })\n        }\n      }'
  );

  // Fix compressed if statements and loading patterns
  content = content.replace(
    /if \(scrollAreaRef\.current\) \{ const viewport/g,
    'if (scrollAreaRef.current) {\n        const viewport'
  );

  // Fix interface method definitions  
  content = content.replace(
    /action\?: \(\) => void \}/g,
    'action?: () => void;\n  }'
  );

  // Fix array type definitions
  content = content.replace(
    /debits: Array<\{ account: string; amount: number \}>/g,
    'debits: Array<{ account: string; amount: number }>;'
  );

  content = content.replace(
    /credits: Array<\{ account: string; amount: number \}>/g,
    'credits: Array<{ account: string; amount: number }>;'
  );

  // Fix Quick Insights array definition
  content = content.replace(
    /category: string\s*\} \/\/ Real-time business metrics\s*const BUSINESS_METRICS/g,
    'category: string;\n}\n\n// Real-time business metrics\nconst BUSINESS_METRICS'
  );

  // Fix pattern with QuickPrompt interface
  content = content.replace(
    /category: string\s*\} \/\/ Furniture-specific quick prompts\s*const FURNITURE_QUICK_PROMPTS/g,
    'category: string;\n}\n\n// Furniture-specific quick prompts\nconst FURNITURE_QUICK_PROMPTS'
  );

  return content;
}

// Process each file
let fixedCount = 0;

filesToFix.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${file}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Apply syntax fixes
  content = fixSyntaxErrors(content);
  
  // Only write if changes were made
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed syntax errors in ${file}`);
    fixedCount++;
  } else {
    console.log(`ℹ️  No syntax changes needed for ${file}`);
  }
});

console.log(`\n✨ Furniture module syntax fix complete! Fixed ${fixedCount} files.`);