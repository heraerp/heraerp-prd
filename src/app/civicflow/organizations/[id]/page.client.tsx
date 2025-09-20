'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOrganization, useContacts, useUpdateOrganization, useCreateContact, useLogActivity } from '@/hooks/use-organizations';
import { useOrgStore } from '@/state/org';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EngagementStageBadge } from '@/components/civicflow/EngagementStageBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Building2, 
  ArrowLeft, 
  Users, 
  Mail, 
  Phone, 
  Calendar,
  MessageSquare,
  FileText,
  Activity,
  Plus,
  User,
  Edit
} from 'lucide-react';
import type { EngagementStage, ActivityType } from '@/types/organizations';

export default function Client({ id }: { id: string }) {
  const router = useRouter();
  const { currentOrgId } = useOrgStore();
  const { data: org, isLoading } = useOrganization(id, currentOrgId || undefined);
  const { data: contacts } = useContacts(id, currentOrgId || undefined);
  const updateOrg = useUpdateOrganization(id, currentOrgId || undefined);
  const createContact = useCreateContact(id);
  const logActivity = useLogActivity(id, currentOrgId || '');
  
  const [activeTab, setActiveTab] = useState('overview');
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [isStageOpen, setIsStageOpen] = useState(false);
  
  // Form states
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRole, setContactRole] = useState('');
  
  const [activityType, setActivityType] = useState<ActivityType>('note');
  const [activitySubject, setActivitySubject] = useState('');
  const [activityBody, setActivityBody] = useState('');
  
  const [newStage, setNewStage] = useState<EngagementStage>('Exploration');

  const handleCreateContact = async () => {
    if (!contactName || !currentOrgId) return;
    
    await createContact.mutateAsync({
      entity_type: 'person',
      entity_name: contactName,
      organization_id: currentOrgId,
      smart_code: 'HERA.CRM.CONTACTS.ENTITY.PERSON.v1',
      metadata: {
        email: contactEmail,
        phone: contactPhone,
        role: contactRole,
        org_entity_id: id,
      }
    });
    
    setIsContactOpen(false);
    setContactName('');
    setContactEmail('');
    setContactPhone('');
    setContactRole('');
  };

  const handleLogActivity = async () => {
    if (!activitySubject) return;
    
    await logActivity.mutateAsync({
      type: activityType,
      occurred_at: new Date().toISOString(),
      subject: activitySubject,
      body: activityBody,
    });
    
    setIsActivityOpen(false);
    setActivityType('note');
    setActivitySubject('');
    setActivityBody('');
  };

  const handleUpdateStage = async () => {
    await updateOrg.mutateAsync({
      metadata: {
        ...org?.metadata,
        engagement_stage: newStage,
      }
    });
    setIsStageOpen(false);
  };

  if (isLoading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6 lg:p-8">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardContent className="pt-6">
            <p className="text-destructive">Organization not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/civicflow/organizations')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-text-100">{org.name}</h1>
            <div className="flex items-center gap-3 mt-2">
              {org.metadata?.type && (
                <Badge variant="outline">{org.metadata.type}</Badge>
              )}
              {org.metadata?.engagement_stage && (
                <EngagementStageBadge stage={org.metadata.engagement_stage} />
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isActivityOpen} onOpenChange={setIsActivityOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Log Activity
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Activity</DialogTitle>
                <DialogDescription>
                  Record an interaction with this organization.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="activity-type">Type</Label>
                  <Select value={activityType} onValueChange={(v) => setActivityType(v as ActivityType)}>
                    <SelectTrigger id="activity-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="call">Call</SelectItem>
                      <SelectItem value="meeting">Meeting</SelectItem>
                      <SelectItem value="note">Note</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="activity-subject">Subject</Label>
                  <Input
                    id="activity-subject"
                    value={activitySubject}
                    onChange={(e) => setActivitySubject(e.target.value)}
                    placeholder="Brief description"
                  />
                </div>
                <div>
                  <Label htmlFor="activity-body">Details</Label>
                  <Textarea
                    id="activity-body"
                    value={activityBody}
                    onChange={(e) => setActivityBody(e.target.value)}
                    placeholder="Add more details..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsActivityOpen(false)}>Cancel</Button>
                <Button onClick={handleLogActivity} disabled={!activitySubject || logActivity.isPending}>
                  {logActivity.isPending ? 'Logging...' : 'Log Activity'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 w-full mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">Contacts</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="programs">Programs</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card className="bg-panel border-border">
                <CardHeader>
                  <CardTitle>Organization Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-text-500">Legal Name</p>
                      <p className="text-text-100">{org.metadata?.legal_name || org.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-500">Registration Number</p>
                      <p className="text-text-100">{org.metadata?.reg_no || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-500">Address</p>
                      <p className="text-text-100">{org.metadata?.address || 'Not provided'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-text-500">Tags</p>
                      <div className="flex gap-2 mt-1">
                        {org.metadata?.tags?.length ? (
                          org.metadata.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary">{tag}</Badge>
                          ))
                        ) : (
                          <span className="text-text-500">No tags</span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts">
              <Card className="bg-panel border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Contacts</CardTitle>
                    <CardDescription>People associated with this organization</CardDescription>
                  </div>
                  <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Contact
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Contact</DialogTitle>
                        <DialogDescription>
                          Add a new person to this organization.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label htmlFor="contact-name">Name</Label>
                          <Input
                            id="contact-name"
                            value={contactName}
                            onChange={(e) => setContactName(e.target.value)}
                            placeholder="Full name"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact-email">Email</Label>
                          <Input
                            id="contact-email"
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            placeholder="email@example.com"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact-phone">Phone</Label>
                          <Input
                            id="contact-phone"
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value)}
                            placeholder="+1 234 567 8900"
                          />
                        </div>
                        <div>
                          <Label htmlFor="contact-role">Role</Label>
                          <Input
                            id="contact-role"
                            value={contactRole}
                            onChange={(e) => setContactRole(e.target.value)}
                            placeholder="e.g., Program Director"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsContactOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreateContact} disabled={!contactName || createContact.isPending}>
                          {createContact.isPending ? 'Adding...' : 'Add Contact'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {contacts && contacts.length > 0 ? (
                    <div className="space-y-3">
                      {contacts.map((contact) => (
                        <div key={contact.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                              <User className="h-5 w-5 text-accent" />
                            </div>
                            <div>
                              <p className="font-medium text-text-100">{contact.name}</p>
                              <p className="text-sm text-text-500">{contact.metadata?.role || 'Contact'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-text-500">
                            {contact.metadata?.email && (
                              <div className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                <span>{contact.metadata.email}</span>
                              </div>
                            )}
                            {contact.metadata?.phone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3.5 w-3.5" />
                                <span>{contact.metadata.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-text-500 text-center py-8">No contacts yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities">
              <Card className="bg-panel border-border">
                <CardHeader>
                  <CardTitle>Recent Activities</CardTitle>
                  <CardDescription>Emails, calls, meetings, and notes</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-text-500 text-center py-8">No activities recorded yet</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="programs">
              <Card className="bg-panel border-border">
                <CardHeader>
                  <CardTitle>Programs & Grants</CardTitle>
                  <CardDescription>Active programs and grant applications</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-text-500 text-center py-8">No programs or grants linked</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Engagement Stage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <EngagementStageBadge stage={org.metadata?.engagement_stage} />
                <Dialog open={isStageOpen} onOpenChange={setIsStageOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit className="h-4 w-4 mr-2" />
                      Change Stage
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Update Engagement Stage</DialogTitle>
                      <DialogDescription>
                        Move this organization to a different stage in your engagement process.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Select value={newStage} onValueChange={(v) => setNewStage(v as EngagementStage)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Exploration">Exploration</SelectItem>
                          <SelectItem value="Co-design">Co-design</SelectItem>
                          <SelectItem value="Approval">Approval</SelectItem>
                          <SelectItem value="Deployment">Deployment</SelectItem>
                          <SelectItem value="Monitoring">Monitoring</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsStageOpen(false)}>Cancel</Button>
                      <Button onClick={handleUpdateStage} disabled={updateOrg.isPending}>
                        {updateOrg.isPending ? 'Updating...' : 'Update Stage'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Relationship Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-500">Not assigned</p>
              <Button variant="outline" size="sm" className="w-full mt-3">
                Assign RM
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-panel border-border">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-500">Total Interactions</span>
                  <span className="text-text-100 font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-500">Active Programs</span>
                  <span className="text-text-100 font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-500">Open Cases</span>
                  <span className="text-text-100 font-medium">0</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}