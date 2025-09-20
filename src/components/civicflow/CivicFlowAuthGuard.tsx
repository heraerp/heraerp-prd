'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { LoadingState } from '@/components/states/Loading';
import { setOrgId } from '@/lib/api-client';
import { useOrgStore } from '@/state/org';

interface CivicFlowAuthGuardProps {
  children: React.ReactNode;
}

export function CivicFlowAuthGuard({ children }: CivicFlowAuthGuardProps) {
  const router = useRouter();
  const { setCurrentOrgId } = useOrgStore();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        // Check if this is a CivicFlow user
        const userMetadata = session.user.user_metadata;
        if (userMetadata?.organization_id === '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77') {
          setIsAuthenticated(true);
          const orgId = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';
          localStorage.setItem('organizationId', orgId);
          localStorage.setItem('currentRole', userMetadata.role || 'User');
          setCurrentOrgId(orgId as any);
          setOrgId(orgId as any);
        } else {
          setIsAuthenticated(false);
          router.push('/civicflow-auth');
        }
      } else if (event === 'SIGNED_OUT') {
        setIsAuthenticated(false);
        localStorage.removeItem('organizationId');
        localStorage.removeItem('currentRole');
        router.push('/civicflow-auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router, setCurrentOrgId]);

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Check if this is a CivicFlow demo user
        const userMetadata = session.user.user_metadata;
        if (userMetadata?.organization_id === '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77') {
          setIsAuthenticated(true);
          const orgId = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';
          localStorage.setItem('organizationId', orgId);
          localStorage.setItem('currentRole', userMetadata.role || 'User');
          setCurrentOrgId(orgId as any);
          setOrgId(orgId as any);
        } else {
          // Wrong org user, redirect to civicflow auth
          setIsAuthenticated(false);
          router.push('/civicflow-auth');
        }
      } else {
        setIsAuthenticated(false);
        router.push('/civicflow-auth');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      router.push('/civicflow-auth');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <LoadingState />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Router will redirect
  }

  return <>{children}</>;
}