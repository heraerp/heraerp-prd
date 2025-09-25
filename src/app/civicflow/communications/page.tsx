'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useOrgStore } from '@/state/org';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Send,
  Inbox,
  AlertCircle,
  UserX,
  Clock,
  TrendingUp,
  Plus,
  Download,
  ChevronDown,
} from 'lucide-react';
import { DemoBanner } from '@/components/communications/DemoBanner';
import { CampaignList } from '@/components/communications/CampaignList';
import { TemplateList } from '@/components/communications/TemplateList';
import { AudienceList } from '@/components/communications/AudienceList';
import { OutboxList } from '@/components/communications/OutboxList';
import { InboxList } from '@/components/communications/InboxList';
import { LogsTable } from '@/components/communications/LogsTable';
import { NewCampaignModal } from '@/components/communications/NewCampaignModal';
import { useCommKpis, useExportComms } from '@/hooks/use-communications';
import { isDemoMode } from '@/lib/demo-guard';
import { Loading } from '@/components/states/Loading';
import { ErrorState } from '@/components/states/ErrorState';
import { useToast } from '@/components/ui/use-toast';

const TABS = [
  { value: 'campaigns', label: 'Campaigns' },
  { value: 'templates', label: 'Templates' },
  { value: 'audiences', label: 'Audiences' },
  { value: 'outbox', label: 'Outbox' },
  { value: 'inbox', label: 'Inbox' },
  { value: 'logs', label: 'Logs' },
];

function CommunicationsContent() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { currentOrgId } = useOrgStore();
  const isDemo = isDemoMode(currentOrgId);
  
  // Tab management
  const tabFromUrl = searchParams.get('tab') || 'campaigns';
  const [activeTab, setActiveTab] = useState(tabFromUrl);
  const [showNewCampaignModal, setShowNewCampaignModal] = useState(false);
  
  // Queries
  const { data: kpis, isLoading: kpisLoading, error: kpisError } = useCommKpis();
  const exportMutation = useExportComms();
  
  // Persist active tab
  useEffect(() => {
    const validTab = TABS.find(t => t.value === tabFromUrl);
    if (validTab) {
      setActiveTab(validTab.value);
      localStorage.setItem('civicflow-comms-tab', validTab.value);
    }
  }, [tabFromUrl]);
  
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem('civicflow-comms-tab', value);
    router.push(`/civicflow/communications?tab=${value}`);
  };
  
  const handleExport = (format: 'csv' | 'pdf' | 'zip') => {
    exportMutation.mutate({
      kind: activeTab,
      format,
      organization_id: currentOrgId,
      include_demo_watermark: isDemo,
    }, {
      onSuccess: () => {
        toast({ title: `Export started (${format.toUpperCase()})` });
      },
      onError: () => {
        toast({ 
          title: 'Export failed', 
          variant: 'destructive' 
        });
      }
    });
  };
  
  if (!currentOrgId) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-lg font-medium mb-2">No Organization Selected</h2>
          <p className="text-muted-foreground">
            Please select an organization to view communications.
          </p>
        </div>
      </div>
    );
  }
  
  if (kpisError) {
    return (
      <div className="container mx-auto py-6">
        <ErrorState 
          message="Failed to load communications data" 
          onRetry={() => window.location.reload()} 
        />
      </div>
    );
  }
  
  
return (
    <div className="container mx-auto py-6 space-y-6">
      {isDemo && <DemoBanner />}
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Communications</h1>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowNewCampaignModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Campaign
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                Export to PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('zip')}>
                Export Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outbound Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {kpisLoading ? '-' : kpis?.outbound_today || 0}
              </span>
              <Send className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inbound Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {kpisLoading ? '-' : kpis?.inbound_today || 0}
              </span>
              <Inbox className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bounces (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {kpisLoading ? '-' : kpis?.bounces_7d || 0}
              </span>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Opt-outs (7d)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {kpisLoading ? '-' : kpis?.opt_outs_7d || 0}
              </span>
              <UserX className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Queue Size
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {kpisLoading ? '-' : kpis?.queue_size || 0}
              </span>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Deliverability
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">
                {kpisLoading ? '-' : `${kpis?.deliverability_percent || 0}%`}
              </span>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          {TABS.map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}>
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        
        <TabsContent value="campaigns">
          <CampaignList />
        </TabsContent>
        
        <TabsContent value="templates">
          <TemplateList />
        </TabsContent>
        
        <TabsContent value="audiences">
          <AudienceList />
        </TabsContent>
        
        <TabsContent value="outbox">
          <OutboxList />
        </TabsContent>
        
        <TabsContent value="inbox">
          <InboxList />
        </TabsContent>
        
        <TabsContent value="logs">
          <LogsTable />
        </TabsContent>
      </Tabs>
      
      {/* Modals */}
      <NewCampaignModal
        open={showNewCampaignModal}
        onOpenChange={setShowNewCampaignModal}
        onSuccess={() => {
          toast({ title: 'Campaign created successfully' });
          setShowNewCampaignModal(false);
        }}
      />
    </div>
  );

}

export default function CommunicationsPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 mx-auto">Loading...</div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      }
    >
      <CommunicationsContent />
    </Suspense>
  )
}