
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';

export function useAdminAuth() {
  const { user, profile, isLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (profile?.role !== 'admin' && profile?.role !== 'developer') {
        router.push('/dashboard');
      }
    }
  }, [user, profile, isLoading, router]);

  return { 
    user, 
    profile, 
    isLoading,
  };
}
