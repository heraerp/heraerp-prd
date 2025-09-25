'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { EmailSidebar } from '@/components/civicflow/emails/EmailSidebar';
import { EmailList } from '@/components/civicflow/emails/EmailList';
import { EmailView } from '@/components/civicflow/emails/EmailView';
import { ComposeModal } from '@/components/civicflow/emails/ComposeModal';
import { AiAssistantPanel } from '@/components/civicflow/emails/AiAssistantPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useHERAAuth } from '@/components/auth/HERAAuthProvider';
import { useEmailList, useEmail } from '@/hooks/civicflow/useEmails';
import { useOrgStore } from '@/state/org';
import { 
  Search,
  Plus,
  Settings,
  Filter,
  SortAsc,
  Loader2,
  Sparkles
} from 'lucide-react';

export type EmailFolder = 'inbox' | 'outbox' | 'drafts' | 'sent' | 'trash';

interface EmailFilters {
  search: string;
  dateRange: string;
  priority: string;
  tags: string[];
}

export default function EmailsPage() {
  const searchParams = useSearchParams();
  const { currentOrgId } = useOrgStore();
  
  // Use the demo org ID constant like other pages
  const DEMO_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77';
  const organizationId = currentOrgId || DEMO_ORG_ID;
  const isDemoMode = organizationId === DEMO_ORG_ID;
  
  const [currentFolder, setCurrentFolder] = useState<EmailFolder>('inbox');
  const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [filters, setFilters] = useState<EmailFilters>({
    search: '',
    dateRange: 'all',
    priority: 'all',
    tags: []
  });

  // Initialize folder from URL params
  useEffect(() => {
    const folder = searchParams.get('folder') as EmailFolder;
    if (folder && ['inbox', 'outbox', 'drafts', 'sent', 'trash'].includes(folder)) {
      setCurrentFolder(folder);
    }
  }, [searchParams]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        switch (e.key.toLowerCase()) {
          case 'n':
            e.preventDefault();
            setIsComposeOpen(true);
            break;
          case 's':
            e.preventDefault();
            // Save draft if compose is open
            break;
          case 'enter':
            if (isComposeOpen) {
              e.preventDefault();
              // Send email
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isComposeOpen]);

  const {
    data: emails,
    isLoading: emailsLoading,
    error: emailsError
  } = useEmailList({
    folder: currentFolder,
    filters,
    organizationId: organizationId
  });

  const {
    data: selectedEmail,
    isLoading: emailLoading
  } = useEmail(selectedEmailId, {
    enabled: !!selectedEmailId
  });


  const handleFolderChange = (folder: EmailFolder) => {
    setCurrentFolder(folder);
    setSelectedEmailId(null);
    // Update URL without page refresh
    const url = new URL(window.location.href);
    url.searchParams.set('folder', folder);
    window.history.replaceState({}, '', url);
  };

  const handleEmailSelect = (emailId: string) => {
    setSelectedEmailId(emailId);
  };

  const handleFilterChange = (key: keyof EmailFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex h-screen bg-muted/50">
      {/* Email Sidebar */}
      <div className="w-64 bg-card border-r border-border flex-shrink-0">
        <EmailSidebar
          currentFolder={currentFolder}
          onFolderChange={handleFolderChange}
          organizationId={organizationId}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Email List */}
        <div className="w-80 bg-card border-r border-border flex flex-col">
          {/* Email List Header */}
          <div className="p-4 border-b border-border">
            <div className="flex items-center gap-2 mb-3">
              <Button
                onClick={() => setIsComposeOpen(true)}
                className="flex-1"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Compose
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsAiPanelOpen(!isAiPanelOpen)}
                className={isAiPanelOpen ? 'bg-purple-100 dark:bg-purple-900' : ''}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search emails..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4"
              />
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 mt-2">
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filter
              </Button>
              <Button variant="ghost" size="sm">
                <SortAsc className="h-4 w-4 mr-1" />
                Sort
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Email List Content */}
          <div className="flex-1 overflow-y-auto">
            {emailsLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : emailsError ? (
              <div className="p-4 text-center text-red-600">
                <p>Error loading emails</p>
                <p className="text-sm text-muted-foreground">{emailsError.message}</p>
              </div>
            ) : (
              <EmailList
                emails={emails || []}
                selectedEmailId={selectedEmailId}
                onEmailSelect={handleEmailSelect}
                folder={currentFolder}
              />
            )}
          </div>
        </div>

        {/* Email View */}
        <div className="flex-1 flex">
          <div className="flex-1 bg-card">
            {selectedEmailId ? (
              emailLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : selectedEmail ? (
                <EmailView
                  email={selectedEmail}
                  onReply={() => setIsComposeOpen(true)}
                  onForward={() => setIsComposeOpen(true)}
                  onDelete={() => {/* Handle delete */}}
                  onMove={() => {/* Handle move */}}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <p>Email not found</p>
                </div>
              )
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl mb-4">📧</div>
                  <h2 className="text-xl font-semibold mb-2">
                    {currentFolder.charAt(0).toUpperCase() + currentFolder.slice(1)}
                  </h2>
                  <p className="text-muted-foreground">
                    Select an email to view its content
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* AI Assistant Panel */}
          {isAiPanelOpen && (
            <div className="w-80 border-l border-gray-200 dark:border-gray-700">
              <AiAssistantPanel
                emailId={selectedEmailId}
                onClose={() => setIsAiPanelOpen(false)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Compose Modal */}
      {isComposeOpen && (
        <ComposeModal
          organizationId={organizationId}
          onClose={() => setIsComposeOpen(false)}
          onSent={() => {
            setIsComposeOpen(false);
            // Refresh email list if needed
          }}
        />
      )}
    </div>
  );
}