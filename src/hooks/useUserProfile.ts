
'use client';

import { useUser, useDoc, useMemoFirebase, useFirestore } from '@/firebase';
import { doc } from 'firebase/firestore';

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin' | 'developer';
}

export function useUserProfile() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: profile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

  return { 
    user, 
    profile, 
    isLoading: isAuthLoading || isProfileLoading,
    error,
  };
}
