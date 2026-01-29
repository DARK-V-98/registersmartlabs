
'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ShieldAlert } from 'lucide-react';
import { useFirestore, setDocumentNonBlocking, useDoc } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { AdminSettings, CurrencySetting } from '@/types';
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
  
  const [currencies, setCurrencies] = useState<CurrencySetting[]>([]);
  const [newCurrency, setNewCurrency] = useState({ country: '', code: '', symbol: '' });

  const settingsRef = firestore ? doc(firestore, 'settings', 'admin') : null;
  const { data: settings } = useDoc<AdminSettings>(settingsRef);
  
  // This ref ensures we only load from the database once.
  const isInitialized = useRef(false);

  useEffect(() => {
    // Only populate state from the DB if settings have loaded and we haven't initialized yet.
    // This prevents overwriting user's unsaved changes on subsequent re-renders.
    if (settings && !isInitialized.current) {
      setBankDetails(settings.bankDetails || '');
      setWhatsappNumber(settings.whatsappNumber || '');
      setWhatsappContactUrl(settings.whatsappContactUrl || '');
      setDisabledDates((settings.disabledDates || []).map(dateStr => new Date(dateStr)));
      setNotificationEmails(settings.notificationEmails || []);
      setPhysicalClassesEnabled(settings.physicalClassesEnabled ?? true);
      
      const existingCurrencies = settings.currencies || [];
      const hasLKR = existingCurrencies.some(c => c.code === 'LKR');
      const finalCurrencyList = hasLKR ? existingCurrencies : [{ country: 'Sri Lanka', code: 'LKR', symbol: 'LKR' }, ...existingCurrencies];
      
      setCurrencies(finalCurrencyList);
      // Mark as initialized so this effect doesn't run again and overwrite state.
      isInitialized.current = true;
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
  
  const handleAddCurrency = () => {
    if (!newCurrency.country || !newCurrency.code || !newCurrency.symbol) {
      toast({ title: "Invalid Currency", description: "Please fill all currency fields.", variant: "destructive" });
      return;
    }
    if (currencies.some(c => c.code === newCurrency.code.toUpperCase())) {
      toast({ title: "Duplicate Currency", description: `Currency code ${newCurrency.code.toUpperCase()} already exists.`, variant: "destructive" });
      return;
    }
    setCurrencies([...currencies, { ...newCurrency, code: newCurrency.code.toUpperCase() }]);
    setNewCurrency({ country: '', code: '', symbol: '' });
  };

  const handleRemoveCurrency = (code: string) => {
    if (code === 'LKR') {
      toast({ title: "Action Not Allowed", description: "LKR is the default currency and cannot be removed.", variant: "destructive" });
      return;
    }
    setCurrencies(currencies.filter(c => c.code !== code));
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
      currencies,
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
          <TabsTrigger value="currencies">Currencies</TabsTrigger>
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

        <TabsContent value="currencies" className="pt-6 space-y-8">
            <div className="bg-white p-6 rounded-2xl border border-border space-y-6">
                <h3 className="font-semibold text-lg">Currency Management</h3>
                <p className="text-sm text-muted-foreground">Add and manage the currencies available for course pricing. LKR is the default and cannot be removed.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 border-t pt-4">
                    <Input placeholder="Country (e.g. Singapore)" value={newCurrency.country} onChange={(e) => setNewCurrency({...newCurrency, country: e.target.value})} />
                    <Input placeholder="Code (e.g. SGD)" value={newCurrency.code} onChange={(e) => setNewCurrency({...newCurrency, code: e.target.value})} />
                    <Input placeholder="Symbol (e.g. $)" value={newCurrency.symbol} onChange={(e) => setNewCurrency({...newCurrency, symbol: e.target.value})} />
                    <Button onClick={handleAddCurrency}><Plus className="h-4 w-4 mr-2" />Add Currency</Button>
                </div>

                <div className="space-y-2">
                    {currencies.map(currency => (
                        <div key={currency.code} className="grid grid-cols-4 items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
                            <span className="text-sm font-medium col-span-1">{currency.country}</span>
                            <span className="text-sm col-span-1">{currency.code}</span>
                            <span className="text-sm col-span-1">{currency.symbol}</span>
                            <div className="col-span-1 text-right">
                                { currency.code !== 'LKR' && 
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleRemoveCurrency(currency.code)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                }
                            </div>
                        </div>
                    ))}
                    {currencies.length === 0 && (
                        <p className="text-sm text-muted-foreground italic text-center py-4">No currencies added. Only LKR will be available.</p>
                    )}
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

    