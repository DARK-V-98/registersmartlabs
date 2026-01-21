'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useUserProfile } from '@/hooks/useUserProfile';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, profile, isLoading } = useUserProfile();

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
              <Input value={profile.name || ''} disabled />
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
        </CardContent>
      </Card>
    </div>
  );
}
