
'use client';
import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AdminSettings {
  bankDetails?: string;
  whatsappNumber?: string;
  disabledDates?: string[];
}

const AdminSettingsPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'admin') : null, [firestore]);
  const { data: settings, isLoading } = useDoc<AdminSettings>(settingsRef);

  const [bankDetails, setBankDetails] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [disabledDates, setDisabledDates] = useState<Date[]>([]);

  useEffect(() => {
    if (settings) {
      setBankDetails(settings.bankDetails || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setDisabledDates((settings.disabledDates || []).map(dateStr => new Date(dateStr)));
    }
  }, [settings]);

  const handleSave = () => {
    if (!firestore) return;
    
    const newSettings = {
      bankDetails,
      whatsappNumber,
      disabledDates: disabledDates.map(date => format(date, 'yyyy-MM-dd')),
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
        <h3 className="font-semibold text-lg">Manage Availability</h3>
        <p className="text-sm text-muted-foreground">Select dates that should be unavailable for booking across all courses. Click a date to add or remove it.</p>
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
