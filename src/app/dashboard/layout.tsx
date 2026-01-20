'use client';

import { DashboardSidebar } from '@/components/dashboard/Sidebar';
import { useUser } from '@/firebase/provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Layout from '@/components/layout/Layout'; // Assuming this is the main site layout (Header/Footer)
// Actually, usually dashboards have their own layout. Let's see. 
// If I use Layout, I get the main Navbar. 
// The user might want a dedicated dashboard experience. 
// Let's stick to a clean dashboard layout without the main landing page Navbar/Footer, 
// or maybe keep the Footer but replace the Navbar.
// For now, I will create a standalone layout with the Sidebar.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!user) {
    return null; 
  }

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="hidden w-64 md:block">
        <DashboardSidebar />
      </aside>
      <main className="flex-1 bg-secondary/10 p-4 md:p-8 overflow-y-auto h-screen">
        {children}
      </main>
    </div>
  );
}
