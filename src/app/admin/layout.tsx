'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAdminAuth } from '@/hooks/use-admin-auth';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  Bookmark,
  Settings,
  Users,
  GraduationCap,
  Calendar,
  CreditCard,
  LayoutGrid,
  Presentation,
  PanelLeft,
  Home,
  BarChart,
  LineChart,
  History,
} from 'lucide-react';
import Image from 'next/image';

const navLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/courses', label: 'Courses', icon: GraduationCap },
  { href: '/admin/lecturers', label: 'Lecturers', icon: Presentation },
  { href: '/admin/schedules', label: 'Schedules', icon: Calendar },
  { href: '/admin/bookings', label: 'Bookings', icon: Bookmark },
  { href: '/admin/payments', label: 'Verification', icon: CreditCard },
  { href: '/admin/payouts', label: 'Payouts', icon: BarChart, roles: ['developer', 'superadmin'] },
  { href: '/admin/reports', label: 'Reports', icon: LineChart, roles: ['developer', 'superadmin'] },
  { href: '/admin/activity', label: 'Activity Log', icon: History, roles: ['developer', 'superadmin'] },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

function AdminNav({ userRole }: { userRole: string | undefined }) {
  const pathname = usePathname();
  return (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      <div className="flex items-center gap-3 px-3 py-4 mb-4">
        <Image src="/logo.png" alt="smartlabs Logo" width={32} height={32} className="rounded-lg" />
        <h2 className="text-xl font-bold tracking-tight">Admin Panel</h2>
      </div>
      {navLinks.map((link) => {
        if (link.roles && !link.roles.includes(userRole || '')) {
          return null;
        }
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary',
              pathname === link.href && 'bg-muted text-primary'
            )}
          >
            <link.icon className="h-4 w-4" />
            {link.label}
          </Link>
        )
      })}
    </nav>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, profile } = useAdminAuth();
  const [open, setOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Verifying admin access...</p>
      </div>
    );
  }

  if (!profile || (profile.role !== 'admin' && profile.role !== 'developer' && profile.role !== 'superadmin')) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Access Denied.</p>
      </div>
    );
  }

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex-1">
            <AdminNav userRole={profile.role} />
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="shrink-0 md:hidden">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col" onOpenAutoFocus={(e) => e.preventDefault()}>
              <AdminNav userRole={profile.role} />
            </SheetContent>
          </Sheet>
          <div className="w-full flex-1" />
          <Link href="/">
            <Button variant="outline">
              <Home className="mr-2 h-4 w-4" />
              Back to Site
            </Button>
          </Link>
        </header>
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
