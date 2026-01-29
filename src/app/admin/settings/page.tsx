
'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldAlert } from 'lucide-react';
import { useFirestore, setDocumentNonBlocking } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AdminSettings } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DangerZone } from '@/components/admin/DangerZone';
import { logActivity } from '@/lib/logger';

const AdminSettingsPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  
  const [bankDetails, setBankDetails] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [whatsappContactUrl, setWhatsappContactUrl] = useState('');
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [physicalClassesEnabled, setPhysicalClassesEnabled] = useState(true);

  useEffect(() => {
    if (firestore) {
      const settingsRef = doc(firestore, 'settings', 'admin');
      const getSettings = async () => {
        const docSnap = await getDoc(settingsRef);
        if (docSnap.exists()) {
          const settings = docSnap.data() as AdminSettings;
          setBankDetails(settings.bankDetails || '');
          setWhatsappNumber(settings.whatsappNumber || '');
          setWhatsappContactUrl(settings.whatsappContactUrl || '');
          setDisabledDates((settings.disabledDates || []).map(dateStr => new Date(dateStr)));
          setNotificationEmails(settings.notificationEmails || []);
          setPhysicalClassesEnabled(settings.physicalClassesEnabled ?? true);
        }
      };
      getSettings();
    }
  }, [firestore]);

  const handleAddEmail = () => {
    if (!newEmail || !newEmail.includes('@')) {
        toast({ title: "Invalid Email", description: "Please enter a valid email address.", variant: "destructive" });
        return;
    }
    if (notificationEmails.includes(newEmail)) {
        toast({ title: "Duplicate Email", description: "This email is already in the list.", variant: "destructive" });
        return;
    }
    setNotificationEmails([...notificationEmails, newEmail]);
    setNewEmail('');
  };

  const handleRemoveEmail = (email: string) => {
    setNotificationEmails(notificationEmails.filter(e => e !== email));
  };

  const handleSave = () => {
    if (!firestore || !profile) return;
    
    const newSettings: AdminSettings = {
      bankDetails,
      whatsappNumber,
      whatsappContactUrl,
      disabledDates: disabledDates.map(date => format(date, 'yyyy-MM-dd')),
      notificationEmails,
      physicalClassesEnabled,
    };

    setDocumentNonBlocking(doc(firestore, 'settings', 'admin'), newSettings, { merge: true });

    logActivity(firestore, {
        actorId: profile.id,
        actorName: profile.name || 'Admin',
        actorEmail: profile.email,
        action: 'settings.update',
        entityType: 'settings',
        entityId: 'admin',
        details: { updatedFields: Object.keys(newSettings) }
    });

    toast({
      title: 'Settings Saved',
      description: 'Your settings have been updated.',
    });
  };

  if (isProfileLoading) {
    return <p>Loading settings...</p>;
  }

  const isSuperAdminOrDev = profile?.role === 'developer' || profile?.role === 'superadmin';

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold">General Settings</h2>
        <p className="text-muted-foreground">Manage payment information and site-wide booking settings.</p>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          {profile?.role === 'developer' && (
            <TabsTrigger value="danger" className="text-destructive">
              <ShieldAlert className="mr-2 h-4 w-4" />
              Danger Zone
            </TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="general" className="pt-6 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-border space-y-6">
                <h3 className="font-semibold text-lg">Payment Details</h3>
                <div className="space-y-2">
                <Label htmlFor="whatsapp">WhatsApp Number</Label>
                <Input 
                    id="whatsapp"
                    placeholder="e.g., +94771234567"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="bankDetails">Bank Details</Label>
                <Textarea 
                    id="bankDetails"
                    placeholder="Bank Name: ...\nAccount Number: ...\nBranch: ..."
                    value={bankDetails}
                    onChange={(e) => setBankDetails(e.target.value)}
                    className="min-h-[120px]"
                />
                </div>
                {isSuperAdminOrDev && (
                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="whatsappContact">Student Contact WhatsApp Link</Label>
                        <Input 
                            id="whatsappContact"
                            placeholder="https://wa.me/..."
                            value={whatsappContactUrl}
                            onChange={(e) => setWhatsappContactUrl(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">This link will be shown to students after they book.</p>
                    </div>
                )}
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-border space-y-6">
                <h3 className="font-semibold text-lg">Notification Emails</h3>
                <p className="text-sm text-muted-foreground">Add email addresses that should receive booking notifications.</p>
                
                <div className="flex gap-2">
                    <Input 
                        placeholder="admin@example.com" 
                        value={newEmail} 
                        onChange={(e) => setNewEmail(e.target.value)} 
                        onKeyDown={(e) => e.key === 'Enter' && handleAddEmail()}
                    />
                    <Button onClick={handleAddEmail} size="icon"><Plus className="h-4 w-4" /></Button>
                </div>

                <div className="space-y-2">
                    {notificationEmails.map(email => (
                        <div key={email} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                            <span className="text-sm">{email}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveEmail(email)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {notificationEmails.length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">No notification emails added. Notifications will be sent to the main admin email.</p>
                    )}
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-border space-y-6">
                <h3 className="font-semibold text-lg">Manage Availability</h3>
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border">
                    <div>
                        <Label htmlFor="physical-classes-switch" className="font-medium">Enable Physical Classes</Label>
                        <p className="text-sm text-muted-foreground">Allow users to book in-person physical classes.</p>
                    </div>
                    <Switch
                        id="physical-classes-switch"
                        checked={physicalClassesEnabled}
                        onCheckedChange={setPhysicalClassesEnabled}
                    />
                </div>
                <p className="text-sm text-muted-foreground pt-4 border-t">Select dates that should be unavailable for booking across all courses. Click a date to add or remove it.</p>
                <div className="flex justify-center">
                    <Calendar
                        mode="multiple"
                        selected={disabledDates}
                        onSelect={(dates) => setDisabledDates(dates || [])}
                        className="rounded-md border"
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <Button onClick={handleSave}>Save Changes</Button>
            </div>
        </TabsContent>

        {profile?.role === 'developer' && (
          <TabsContent value="danger" className="pt-6">
            <DangerZone />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default AdminSettingsPage;
