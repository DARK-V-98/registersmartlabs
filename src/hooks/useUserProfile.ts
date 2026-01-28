
'use client';

import { useUser, useDoc, useMemoFirebase, useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/types';
import { useEffect } from 'react';

export function useUserProfile() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
  
  const { data: profile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userProfileRef);

  useEffect(() => {
    if (user && profile && !profile.timezone && firestore) {
        try {
            const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (userTimezone) {
                const userRef = doc(firestore, 'users', user.uid);
                updateDocumentNonBlocking(userRef, { timezone: userTimezone });
            }
        } catch (e) {
            console.error("Could not detect timezone:", e);
        }
    }
  }, [user, profile, firestore]);


  return { 
    user, 
    profile, 
    isLoading: isAuthLoading || isProfileLoading,
    error,
  };
}
