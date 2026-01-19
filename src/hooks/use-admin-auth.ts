
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/hooks/useUserProfile';

export function useAdminAuth() {
  const { user, profile, isLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user || profile?.role !== 'admin') {
        router.push('/login');
      }
    }
  }, [user, profile, isLoading, router]);

  return { 
    user, 
    profile, 
    isLoading,
  };
}
