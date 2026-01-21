
'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AdminSettings } from '@/types';
import { Switch } from '@/components/ui/switch';

const AdminSettingsPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'admin') : null, [firestore]);
  const { data: settings, isLoading } = useDoc<AdminSettings>(settingsRef);

  const [bankDetails, setBankDetails] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [physicalClassesEnabled, setPhysicalClassesEnabled] = useState(true);

  useEffect(() => {
    if (settings) {
      setBankDetails(settings.bankDetails || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setDisabledDates((settings.disabledDates || []).map(dateStr => new Date(dateStr)));
      setNotificationEmails(settings.notificationEmails || []);
      setPhysicalClassesEnabled(settings.physicalClassesEnabled ?? true);
    }
  }, [settings]);

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
    if (!firestore) return;
    
    const newSettings: AdminSettings = {
      bankDetails,
      whatsappNumber,
      disabledDates: disabledDates.map(date => format(date, 'yyyy-MM-dd')),
      notificationEmails,
      physicalClassesEnabled,
    };

    setDocumentNonBlocking(doc(firestore, 'settings', 'admin'), newSettings, { merge: true });

    toast({
      title: 'Settings Saved',
      description: 'Your settings have been updated.',
    });
  };

  if (isLoading) {
    return <p>Loading settings...</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold">General Settings</h2>
        <p className="text-muted-foreground">Manage payment information and site-wide booking settings.</p>
      </div>

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
            placeholder="Bank Name: ...&#10;Account Number: ...&#10;Branch: ..."
            value={bankDetails}
            onChange={(e) => setBankDetails(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
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
    </div>
  );
};

export default AdminSettingsPage;
