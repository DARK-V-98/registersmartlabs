
'use client';

import { useUserProfile } from '@/hooks/useUserProfile';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Booking } from '@/types';
import Link from 'next/link';
import { CalendarPlus, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { format, differenceInMilliseconds } from 'date-fns';
import { useEffect, useState } from 'react';

// Function to format the countdown
const formatCountdown = (ms: number) => {
  if (ms < 0) return 'Session has passed';
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  return `${days}d ${hours}h ${minutes}m ${seconds}s`;
};


export default function DashboardOverview() {
  const { user, profile } = useUserProfile();
  const firestore = useFirestore();

  const [countdown, setCountdown] = useState('');

  const recentBookingsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(3)
    );
  }, [user, firestore]);

  const { data: bookings, isLoading } = useCollection<Booking>(recentBookingsQuery);

  const upcomingBooking = bookings?.find(b => 
    b.bookingStatus === 'confirmed' && 
    new Date(`${b.date} ${b.time}`) >= new Date()
  );

  useEffect(() => {
    if (!upcomingBooking) {
        setCountdown('');
        return;
    }

    const sessionDateTime = new Date(`${upcomingBooking.date} ${upcomingBooking.time}`);
    
    const interval = setInterval(() => {
        const now = new Date();
        const diff = differenceInMilliseconds(sessionDateTime, now);
        setCountdown(formatCountdown(diff));
    }, 1000);

    return () => clearInterval(interval);

  }, [upcomingBooking]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {profile?.name?.split(' ')[0] || 'Student'}!</h1>
        <p className="text-muted-foreground mt-2">Manage your classes and schedule upcoming sessions.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Quick Action */}
        <Card className="bg-primary text-primary-foreground border-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarPlus className="w-6 h-6" /> Book a Session
            </CardTitle>
            <CardDescription className="text-primary-foreground/80">
              Ready to learn? Schedule your next class now.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard/book">
              <Button variant="secondary" className="w-full font-semibold">
                Start Booking <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Next Session Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-6 h-6" /> Next Confirmed Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBooking ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg">{upcomingBooking.courseName}</h3>
                  <p className="text-muted-foreground">with {upcomingBooking.lecturerName}</p>
                </div>
                <div className="flex items-center gap-2 text-sm">
                   <div className="px-2 py-1 bg-secondary rounded text-secondary-foreground">
                      {upcomingBooking.date} at {upcomingBooking.time} (LKT)
                   </div>
                </div>
                {countdown && (
                    <div className="text-2xl font-bold text-primary font-mono tabular-nums">
                        {countdown}
                    </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No upcoming confirmed sessions.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Activity</h2>
            <Link href="/dashboard/bookings" className="text-sm text-primary hover:underline">View all</Link>
        </div>
        
        <div className="grid gap-4">
            {bookings?.map(booking => (
                <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-full ${booking.bookingStatus === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-secondary text-secondary-foreground'}`}>
                            <CheckCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="font-medium">{booking.courseName}</p>
                            <p className="text-sm text-muted-foreground">{booking.date} • {booking.time} (LKT)</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <span className={`text-xs px-2 py-1 rounded-full border ${
                            booking.bookingStatus === 'confirmed' ? 'border-green-200 bg-green-50 text-green-700' : 
                            booking.bookingStatus === 'payment_pending' ? 'border-orange-200 bg-orange-50 text-orange-700' : 
                            'border-gray-200 bg-gray-50 text-gray-700'
                         }`}>
                            {booking.bookingStatus?.replace('_', ' ') || 'Unknown'}
                         </span>
                    </div>
                </div>
            ))}
             {bookings?.length === 0 && (
                <p className="text-muted-foreground">No recent activity.</p>
            )}
        </div>
      </div>
    </div>
  );
}
