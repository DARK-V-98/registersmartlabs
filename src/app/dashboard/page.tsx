'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Booking } from '@/types';
import Link from 'next/link';
import { CalendarPlus, ArrowRight, Clock, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function DashboardOverview() {
  const { user } = useUser();
  const firestore = useFirestore();

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
    ['confirmed', 'payment_pending'].includes(b.bookingStatus) && 
    new Date(b.date) >= new Date(new Date().setHours(0,0,0,0))
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {user?.displayName?.split(' ')[0] || 'Student'}!</h1>
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
              <Clock className="w-6 h-6" /> Next Session
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
                      {upcomingBooking.date}
                   </div>
                   <div className="px-2 py-1 bg-secondary rounded text-secondary-foreground">
                      {upcomingBooking.time}
                   </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${upcomingBooking.bookingStatus === 'confirmed' ? 'bg-green-500' : 'bg-orange-500'}`} />
                    <span className="capitalize text-sm font-medium">{upcomingBooking.bookingStatus.replace('_', ' ')}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No upcoming sessions scheduled.</p>
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
                            <p className="text-sm text-muted-foreground">{booking.date} • {booking.time}</p>
                        </div>
                    </div>
                    <div className="text-right">
                         <span className={`text-xs px-2 py-1 rounded-full border ${
                            booking.bookingStatus === 'confirmed' ? 'border-green-200 bg-green-50 text-green-700' : 
                            booking.bookingStatus === 'payment_pending' ? 'border-orange-200 bg-orange-50 text-orange-700' : 
                            'border-gray-200 bg-gray-50 text-gray-700'
                         }`}>
                            {booking.bookingStatus.replace('_', ' ')}
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
