import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function DemoBanner() {
  return (
    <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-900 dark:text-amber-100">
        <strong>Demo Mode:</strong> External communications are disabled. Messages will be simulated and logged locally.
      </AlertDescription>
    </Alert>
  );
}