
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import Layout from '@/components/layout/Layout';
import { cn } from '@/lib/utils';
import { 
  Bookmark, 
  Settings, 
  Users, 
  GraduationCap, 
  Calendar, 
  CreditCard, 
  LayoutGrid, 
  Presentation 
} from 'lucide-react';

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { href: '/admin/lecturers', label: 'Lecturers', icon: Presentation },
  { href: '/admin/schedules', label: 'Schedules', icon: Calendar },
  { href: '/admin/bookings', label: 'Bookings', icon: Bookmark },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, profile } = useAdminAuth();
  const pathname = usePathname();

  if (isLoading) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <p>Verifying admin access...</p>
        </div>
      </Layout>
    );
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'developer')) {
    return (
       <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <p>Access Denied.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-display text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="grid lg:grid-cols-4 gap-8">
          <aside className="lg:col-span-1">
            <nav className="sticky top-24 bg-white p-4 rounded-xl border border-border">
              <ul className="space-y-2">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-lg transition-colors',
                        pathname === link.href
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-secondary'
                      )}
                    >
                      <link.icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <main className="lg:col-span-3">{children}</main>
        </div>
      </div>
    </Layout>
  );
}
