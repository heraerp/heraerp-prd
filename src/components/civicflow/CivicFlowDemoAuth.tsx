'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Users, Shield, FileText, Building } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface DemoUser {
  id: string;
  email: string;
  password: string;
  fullName: string;
  role: string;
  department: string;
  description: string;
  icon: React.ElementType;
}

const DEMO_USERS: DemoUser[] = [
  {
    id: 'e1f4a2b1-7c8d-4e5f-9a6b-3c2d5e8f9a1b',
    email: 'admin@civicflow-demo.gov',
    password: 'CivicFlowDemo2024!',
    fullName: 'Sarah Johnson',
    role: 'Administrator',
    department: 'IT Services',
    description: 'Full system access, manage all CivicFlow features',
    icon: Shield
  },
  {
    id: 'a2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
    email: 'case.manager@civicflow-demo.gov',
    password: 'CivicFlowDemo2024!',
    fullName: 'Michael Chen',
    role: 'Case Manager',
    department: 'Social Services',
    description: 'Manage constituents, cases, and service delivery',
    icon: Users
  },
  {
    id: 'b3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e',
    email: 'grants.officer@civicflow-demo.gov',
    password: 'CivicFlowDemo2024!',
    fullName: 'Emily Rodriguez',
    role: 'Grants Officer',
    department: 'Grants Management',
    description: 'Review and approve grants, funding applications',
    icon: FileText
  },
  {
    id: 'c4d5e6f7-8a9b-0c1d-2e3f-4a5b6c7d8e9f',
    email: 'outreach@civicflow-demo.gov',
    password: 'CivicFlowDemo2024!',
    fullName: 'David Thompson',
    role: 'Outreach Coordinator',
    department: 'Community Outreach',
    description: 'Community engagement and public communications',
    icon: Building
  }
];

export function CivicFlowDemoAuth() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<DemoUser | null>(null);

  // Check if already authenticated
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    // Check if user wants to force logout (for debugging)
    const forceLogout = new URLSearchParams(window.location.search).get('logout');
    if (forceLogout) {
      await supabase.auth.signOut();
      localStorage.removeItem('organizationId');
      localStorage.removeItem('currentRole');
      // Remove logout param from URL
      window.history.replaceState({}, '', '/civicflow/demo');
      return;
    }
    
    // Check current Supabase session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      // Check if this is a CivicFlow demo user
      const userMetadata = session.user.user_metadata;
      if (userMetadata?.organization_id === '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77') {
        // Valid CivicFlow user, set context and redirect
        localStorage.setItem('organizationId', '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77');
        localStorage.setItem('currentRole', userMetadata.role || 'User');
        router.push('/civicflow');
      } else {
        // Different org user (like salon), sign them out for CivicFlow
        await supabase.auth.signOut();
        localStorage.removeItem('organizationId');
        localStorage.removeItem('currentRole');
      }
    }
  };

  const handleDemoLogin = async (user: DemoUser) => {
    setLoading(true);
    setError('');
    setSelectedUser(user);

    try {
      // Sign in with CivicFlow demo user
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        // Set organization context
        localStorage.setItem('organizationId', '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77');
        localStorage.setItem('currentRole', user.role);
        
        // Redirect to CivicFlow dashboard
        router.push('/civicflow');
      }
    } catch (err: any) {
      console.error('Demo login error:', err);
      if (err.message.includes('Invalid login credentials')) {
        setError('Demo user not found. Please run the setup script first.');
      } else {
        setError(err.message || 'Failed to login with demo account');
      }
    } finally {
      setLoading(false);
      setSelectedUser(null);
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-text-100 mb-2">CivicFlow Demo</h1>
          <p className="text-xl text-text-300">
            Select a demo account to explore CivicFlow
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEMO_USERS.map((user) => (
            <div 
              key={user.email}
              className={`
                cursor-pointer transition-all rounded-lg border
                bg-panel border-border hover:bg-panel-alt
                ${selectedUser?.email === user.email ? 'ring-2 ring-accent' : ''}
                ${loading ? 'opacity-75' : ''}
              `}
              onClick={() => !loading && handleDemoLogin(user)}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-accent-soft flex items-center justify-center">
                      <user.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-text-100">{user.fullName}</h3>
                      <p className="text-sm text-text-500">{user.role} • {user.department}</p>
                    </div>
                  </div>
                  {selectedUser?.email === user.email && loading && (
                    <Loader2 className="h-5 w-5 animate-spin text-accent" />
                  )}
                </div>
                <p className="text-text-300 text-sm">
                  {user.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <p className="text-sm text-text-500 mb-2">
            This is a demonstration environment with sample data
          </p>
          <p className="text-xs text-text-500">
            External communications are disabled in demo mode
          </p>
        </div>
      </div>
    </div>
  );
}