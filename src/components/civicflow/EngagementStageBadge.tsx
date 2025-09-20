import { Badge } from '@/components/ui/badge';
import type { EngagementStage } from '@/types/organizations';

const stageColors: Record<EngagementStage, string> = {
  'Exploration': 'bg-primary/10 text-primary border-primary/20',
  'Co-design': 'bg-secondary/10 text-secondary border-secondary/20',
  'Approval': 'bg-accent/10 text-accent border-accent/20',
  'Deployment': 'bg-accent-soft text-accent border-accent-soft',
  'Monitoring': 'bg-panel text-text-300 border-border',
};

export function EngagementStageBadge({ stage }: { stage?: EngagementStage }) {
  if (!stage) return <Badge variant="outline" className="border-border text-text-300">No stage</Badge>;
  
  return (
    <Badge className={`${stageColors[stage]} border`}>
      {stage}
    </Badge>
  );
}