#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'src/app/furniture/ai-manager/page.tsx');

if (!fs.existsSync(filePath)) {
  console.log('❌ File not found');
  process.exit(1);
}

let content = fs.readFileSync(filePath, 'utf8');

// Replace the compressed renderMessage function with properly formatted version
const compressedFunction = /const renderMessage = \(message: AIMessage\) => \{ const isUser[^}]+\} \} \/\/ Show loading state if \(orgLoading\) \{/gs;

const formattedFunction = `const renderMessage = (message: AIMessage) => {
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
          {message.metrics && message.metrics.length > 0 && (
            <div className="bg-background mt-4 grid grid-cols-2 gap-3">
              {message.metrics.map((metric, i) => (
                <div key={i} className="bg-background/20 rounded p-3">
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-lg font-bold flex items-center gap-2">
                    {metric.value}
                    {metric.trend && (metric.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    ))}
                  </p>
                </div>
              ))}
            </div>
          )}
          {message.recommendations && message.recommendations.length > 0 && (
            <div className="bg-background mt-4 space-y-2">
              <p className="text-sm font-medium text-gray-300">Recommendations:</p>
              {message.recommendations.map((rec, i) => (
                <div key={i} className="bg-background/20 rounded p-3 hover:bg-background/30 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{rec.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{rec.description}</p>
                    </div>
                    <Badge variant="outline" className={cn(
                      'text-xs',
                      rec.impact === 'high' 
                        ? 'border-green-500 text-green-500'
                        : rec.impact === 'medium' 
                        ? 'border-yellow-500 text-yellow-500'
                        : 'border-gray-500 text-muted-foreground'
                    )}>
                      {rec.impact} impact
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
          {message.visualData && (
            <div className="mt-4 bg-background/20 rounded p-3">
              <p className="text-xs text-muted-foreground mb-2">Data Visualization</p>
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <BarChart3 className="h-8 w-8" />
              </div>
            </div>
          )}
        </div>
        {isUser && (
          <div className="w-8 h-8 rounded-full bg-muted-foreground/10 flex items-center justify-center flex-shrink-0">
            <Users className="h-4 w-4" />
          </div>
        )}
      </div>
    )
  }

  // Show loading state
  if (orgLoading) {`;

if (compressedFunction.test(content)) {
  content = content.replace(compressedFunction, formattedFunction);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Fixed renderMessage function formatting');
} else {
  console.log('❌ Could not find the compressed function pattern');
}

console.log('✨ AI Manager render function fix complete!');