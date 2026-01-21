'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { 
  LayoutGrid, 
  CalendarPlus, 
  CalendarCheck, 
  User, 
  LogOut,
  ShieldCheck,
  Home
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth, useCollection, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';
import { Booking } from '@/types';

const sidebarItems = [
  {
    title: 'Overview',
    href: '/dashboard',
    icon: LayoutGrid,
  },
  {
    title: 'Book a Session',
    href: '/dashboard/book',
    icon: CalendarPlus,
  },
  {
    title: 'My Bookings',
    href: '/dashboard/bookings',
    icon: CalendarCheck,
    notificationKey: 'pending_payment',
  },
  {
    title: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
];

const useBookingNotifications = () => {
    const { user } = useUser();
    const firestore = useFirestore();

    const pendingBookingsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(
            collection(firestore, 'bookings'),
            where('userId', '==', user.uid),
            where('bookingStatus', '==', 'payment_pending')
        );
    }, [user, firestore]);

    const { data: pendingBookings } = useCollection<Booking>(pendingBookingsQuery);

    return {
        pendingPaymentCount: pendingBookings?.length || 0,
    };
};

export function DashboardSidebar() {
  const pathname = usePathname();
  const auth = useAuth();
  const router = useRouter();
  const { profile } = useUserProfile();
  const { pendingPaymentCount } = useBookingNotifications();

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  return (
    <div className="flex h-full flex-col border-r bg-card px-3 py-4">
      <div className="mb-10 flex items-center px-3">
        <h2 className="text-xl font-bold tracking-tight">Student Portal</h2>
      </div>
      <div className="flex-1 space-y-1">
        <nav className="grid items-start gap-2">
          {sidebarItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <Link
                key={index}
                href={item.href}
              >
                <span
                  className={cn(
                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                    pathname === item.href ? "bg-accent text-accent-foreground" : "transparent"
                  )}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  <span>{item.title}</span>
                   {item.notificationKey === 'pending_payment' && pendingPaymentCount > 0 && (
                      <Badge className="ml-auto flex h-6 w-6 shrink-0 items-center justify-center rounded-full">
                        {pendingPaymentCount}
                      </Badge>
                    )}
                </span>
              </Link>
            );
          })}
          
          {(profile?.role === 'admin' || profile?.role === 'developer') && (
             <Link href="/admin">
                <span className="group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground text-amber-600 font-bold mt-4 border border-amber-200 bg-amber-50">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  <span>Admin Panel</span>
                </span>
             </Link>
          )}
        </nav>
      </div>
      <div className="mt-auto space-y-1">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="mr-2 h-4 w-4" />
            Back to Site
          </Button>
        </Link>
        <Button variant="ghost" className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
