'use client';

import { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrgProfile } from '@/hooks/use-organizations';
import OrgHeader from '@/components/organizations/OrgHeader';
import OrgOverview from '@/components/organizations/OrgOverview';
import OrgContacts from '@/components/organizations/OrgContacts';
import OrgEngagement from '@/components/organizations/OrgEngagement';
import OrgFunding from '@/components/organizations/OrgFunding';
import OrgEvents from '@/components/organizations/OrgEvents';
import OrgComms from '@/components/organizations/OrgComms';
import OrgCases from '@/components/organizations/OrgCases';
import OrgFiles from '@/components/organizations/OrgFiles';
import OrgActivity from '@/components/organizations/OrgActivity';

const TAB_KEY = 'civicflow_org_profile_tab';

export default function OrganizationProfilePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orgId = params.id as string;

  // Get initial tab from URL or localStorage
  const urlTab = searchParams.get('tab');
  const savedTab = typeof window !== 'undefined' ? localStorage.getItem(TAB_KEY) : null;
  const [activeTab, setActiveTab] = useState(urlTab || savedTab || 'overview');

  // Fetch organization profile
  const { data: profile, isLoading, error } = useOrgProfile(orgId);

  // Update localStorage and URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem(TAB_KEY, value);
    
    // Update URL without navigation
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('tab', value);
    window.history.replaceState({}, '', newUrl.toString());
  };

  // Sync with URL changes
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && tab !== activeTab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error?.message || 'Failed to load organization profile. Please try again.'}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Button>
        </div>

        <OrgHeader organization={profile} />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid grid-cols-5 lg:grid-cols-9 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="contacts">Contacts</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="funding">Funding</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="comms">Comms</TabsTrigger>
            <TabsTrigger value="cases">Cases</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <Suspense fallback={<TabLoadingSkeleton />}>
              <TabsContent value="overview" className="space-y-4">
                <OrgOverview organizationId={orgId} />
              </TabsContent>

              <TabsContent value="contacts" className="space-y-4">
                <OrgContacts organizationId={orgId} />
              </TabsContent>

              <TabsContent value="engagement" className="space-y-4">
                <OrgEngagement organizationId={orgId} />
              </TabsContent>

              <TabsContent value="funding" className="space-y-4">
                <OrgFunding organizationId={orgId} />
              </TabsContent>

              <TabsContent value="events" className="space-y-4">
                <OrgEvents organizationId={orgId} />
              </TabsContent>

              <TabsContent value="comms" className="space-y-4">
                <OrgComms organizationId={orgId} />
              </TabsContent>

              <TabsContent value="cases" className="space-y-4">
                <OrgCases organizationId={orgId} />
              </TabsContent>

              <TabsContent value="files" className="space-y-4">
                <OrgFiles organizationId={orgId} />
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <OrgActivity organizationId={orgId} />
              </TabsContent>
            </Suspense>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <div className="flex gap-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-24" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}

function TabLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}