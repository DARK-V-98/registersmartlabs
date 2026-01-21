'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUserProfile } from '@/hooks/useUserProfile';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2, Save } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useEffect, useMemo, useState } from 'react';
import { updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useFirestore } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';

export default function ProfilePage() {
  const { user, profile, isLoading } = useUserProfile();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState(profile?.phoneNumber || '');
  const [name, setName] = useState(profile?.name || '');
  const [isSaving, setIsSaving] = useState(false);


  useEffect(() => {
    if (profile) {
      setPhoneNumber(profile.phoneNumber || '');
      setName(profile.name || '');
    }
  }, [profile]);

  const profileCompletion = useMemo(() => {
    let completed = 0;
    const total = 3;
    if (profile?.email) completed++;
    if (profile?.name && profile.name !== profile.email?.split('@')[0]) completed++;
    if (profile?.phoneNumber) completed++;
    return (completed / total) * 100;
  }, [profile]);

  const handleProfileUpdate = async () => {
    if (!user || !firestore) return;
    setIsSaving(true);
    try {
        const userRef = doc(firestore, 'users', user.uid);
        await updateDocumentNonBlocking(userRef, {
            name: name,
            phoneNumber: phoneNumber
        });
        toast({ title: 'Profile Updated', description: 'Your information has been saved.' });
    } catch (e) {
        toast({ title: 'Error', description: 'Could not update profile.', variant: 'destructive'});
    } finally {
        setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  if (!user || !profile) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Profile</h2>
        {(profile?.role === 'admin' || profile?.role === 'developer') && (
           <Link href="/admin">
             <Button variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800">
               <ShieldCheck className="mr-2 h-4 w-4" />
               Access Admin Panel
             </Button>
           </Link>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>Complete your profile for a better experience.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="flex items-center gap-4">
                <Progress value={profileCompletion} className="w-[60%]" />
                <span className="text-sm font-medium text-muted-foreground">{Math.round(profileCompletion)}% Complete</span>
            </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoURL || ''} />
              <AvatarFallback className="text-lg">{profile.name?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{profile.name || 'User'}</h3>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={name} onChange={e => setName(e.target.value)} disabled={isSaving}/>
            </div>
             <div className="space-y-2">
              <Label>Phone Number</Label>
              <Input value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="e.g. +94771234567" disabled={isSaving}/>
            </div>
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input value={user.email || ''} disabled />
            </div>
            <div className="space-y-2">
              <Label>User ID</Label>
              <Input value={user.uid} disabled className="font-mono text-xs" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleProfileUpdate} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
