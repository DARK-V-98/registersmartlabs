
'use client';

import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, arrayUnion, where, getDoc, arrayRemove } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, Check, X, Users, IndianRupee, BookCheck, Hourglass, Loader2 } from 'lucide-react';
import { format, isThisMonth, parseISO } from 'date-fns';
import { Booking, UserProfile, Schedule } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getSlotsForBooking } from '@/lib/availability';

const getStatusLabel = (status?: string) => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const AdminDashboardPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bookings'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'users'));
  }, [firestore]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection<Booking>(bookingsQuery);
  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  
  const isLoading = isBookingsLoading || isUsersLoading;

  const handleStatusChange = async (booking: Booking, newStatus: 'confirmed' | 'rejected') => {
    if (!firestore) return;
    const bookingRef = doc(firestore, 'bookings', booking.id);
    
    updateDocumentNonBlocking(bookingRef, { 
      bookingStatus: newStatus,
      paymentStatus: newStatus === 'confirmed' ? 'paid' : 'rejected' 
    });

    if (newStatus === 'rejected') {
        const scheduleId = `${booking.lecturerId}_${booking.date}`;
        const scheduleRef = doc(firestore, 'schedules', scheduleId);
        
        try {
            const scheduleSnap = await getDoc(scheduleRef);
            if (scheduleSnap.exists()) {
                const slotsToRemove = getSlotsForBooking(booking);
                
                if (slotsToRemove.length > 0) {
                    updateDocumentNonBlocking(scheduleRef, {
                        bookedSlots: arrayRemove(...slotsToRemove)
                    });
                }
            }
        } catch (error) {
            console.error("Error un-blocking time slot:", error);
            toast({ title: 'Error', description: 'Could not un-block the time slot.', variant: 'destructive'});
        }
    }
    
    toast({
      title: 'Booking Updated',
      description: `Booking has been ${newStatus}.`,
    });
  };

  const filteredBookings = bookings?.filter(b => {
    if (filter === 'pending') return b.bookingStatus === 'payment_pending';
    return true;
  });

  const stats = useMemo(() => {
    if (!bookings || !users) return { totalRevenue: 0, pendingCount: 0, totalUsers: 0, confirmedCount: 0 };
    
    // Note: This revenue calculation is a simplification.
    // A robust solution would handle multiple currencies, possibly converting to a base currency.
    const confirmedLKRBookings = bookings.filter(b => b.bookingStatus === 'confirmed' && b.currency === 'LKR');

    return {
      totalRevenue: confirmedLKRBookings.reduce((acc, b) => acc + (b.price || 0), 0),
      pendingCount: bookings.filter(b => b.bookingStatus === 'payment_pending').length,
      totalUsers: users.length,
      confirmedCount: bookings.filter(b => b.bookingStatus === 'confirmed').length,
    };
  }, [bookings, users]);

  const statCards = [
    { title: 'Total Revenue (LKR)', value: `LKR ${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee },
    { title: 'Pending Bookings', value: stats.pendingCount, icon: Hourglass },
    { title: 'Total Users', value: stats.totalUsers, icon: Users },
    { title: 'Confirmed Classes', value: stats.confirmedCount, icon: BookCheck },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-2">An overview of your platform's activity.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           {Array(4).fill(0).map((_, i) => <Card key={i}><CardHeader><CardTitle><Loader2 className="animate-spin" /></CardTitle></CardHeader><CardContent><p>Loading...</p></CardContent></Card>)}
        </div>
      ) : (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {statCards.map(card => (
              <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Manage Bookings</h2>
            <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Show All</span>
            <Switch
                checked={filter === 'pending'}
                onCheckedChange={(checked) => setFilter(checked ? 'pending' : 'all')}
                aria-label="Toggle pending bookings filter"
            />
            <span className="text-sm font-medium text-primary">Show Pending Only</span>
            </div>
        </div>

        {isLoading ? (
            <div className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>
        ) : (
            <div className="space-y-4">
            {filteredBookings && filteredBookings.length > 0 ? (
                filteredBookings.map((booking) => (
                <Card key={booking.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4 grid md:grid-cols-3 lg:grid-cols-5 gap-4 items-center">
                        <div className="lg:col-span-2 space-y-1">
                            <p className="font-semibold">{booking.courseName}</p>
                            <p className="text-sm text-muted-foreground">Student: {booking.userName || booking.userId}</p>
                        </div>
                         <div className="text-sm text-muted-foreground">
                            <p className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {booking.date}</p>
                            <p className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {booking.time}</p>
                        </div>
                        <div className="flex flex-col items-start gap-2">
                             <Badge variant={booking.bookingStatus === 'payment_pending' ? 'secondary' : 'outline'}>
                                {getStatusLabel(booking.bookingStatus)}
                            </Badge>
                             <p className="font-bold text-sm">{booking.currency} {booking.price?.toLocaleString()}</p>
                        </div>
                        <div className="flex gap-2 justify-start md:justify-end">
                             {booking.bookingStatus === 'payment_pending' && (
                                <>
                                    <Button size="sm" variant="outline" className="text-destructive hover:border-destructive hover:bg-destructive/5 border-red-200" onClick={() => handleStatusChange(booking, 'rejected')}>
                                        <X className="w-4 h-4 mr-2"/> Reject
                                    </Button>
                                    <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleStatusChange(booking, 'confirmed')}>
                                        <Check className="w-4 h-4 mr-2"/> Accept
                                    </Button>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>
                ))
            ) : (
                <div className="text-center py-12 bg-secondary/50 rounded-2xl">
                <p className="text-muted-foreground">
                    {filter === 'pending' ? 'No pending bookings to review.' : 'No bookings found.'}
                </p>
                </div>
            )}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboardPage;
