'use client';

import { useState } from 'react';
import { useCollection, useFirestore, useMemoFirebase, updateDocumentNonBlocking, setDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, doc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { PiCalendar, PiClock, PiCheck, PiX, PiFileText } from 'react-icons/pi';
import type { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Booking } from '@/types';

const AdminBookingsPage = () => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');
  const { profile, isLoading: isProfileLoading } = useUserProfile();

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !profile || profile.role !== 'admin') return null;
    return query(collection(firestore, 'bookings'), orderBy('date', 'asc'));
  }, [firestore, profile]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection<Booking>(bookingsQuery);
  
  const isLoading = isProfileLoading || isBookingsLoading;

  const handleStatusChange = (booking: Booking, newStatus: 'confirmed' | 'rejected') => {
    if (!firestore) return;
    const bookingRef = doc(firestore, 'bookings', booking.id);
    
    // @ts-ignore - Booking status type mismatch between local/global? No, using global.
    updateDocumentNonBlocking(bookingRef, { bookingStatus: newStatus });

    if (newStatus === 'confirmed') {
      const dateString = booking.date; // It's a string YYYY-MM-DD
      // Construct composite ID matching creation logic: courseId_lecturerId_date
      const scheduleId = `${booking.courseId}_${booking.lecturerId}_${dateString}`;
      const scheduleRef = doc(firestore, 'schedules', scheduleId);
      setDocumentNonBlocking(scheduleRef, {
        bookedSlots: arrayUnion(booking.time)
      }, { merge: true });
    }
    // Note: No arrayRemove for 'rejected' here, as this UI only acts on 'pending' items,
    // which wouldn't be in the schedule yet. Cancellation of confirmed items is handled elsewhere.

    toast({
      title: 'Booking Updated',
      description: `Booking has been ${newStatus}.`,
    });
  };

  const filteredBookings = bookings?.filter(b => {
    if (filter === 'pending') return b.bookingStatus === 'payment_pending' || b.bookingStatus === 'created'; // payment_pending is the main one
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold">Manage Bookings</h2>
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

      {isLoading && <p>Loading bookings...</p>}

      {!isLoading && (
        <div className="space-y-4">
          {filteredBookings && filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-white p-6 rounded-2xl border border-border transition-shadow hover:shadow-md">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-4">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center text-2xl">
                            🎓
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">{booking.courseName}</h3>
                            <p className="text-sm text-muted-foreground">User: {booking.userName || booking.userId}</p>
                        </div>
                     </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1.5"><PiCalendar className="w-4 h-4" /> {booking.date}</span>
                      <span className="flex items-center gap-1.5"><PiClock className="w-4 h-4" /> {booking.time}</span>
                      <span className="flex items-center gap-1.5 capitalize"><PiFileText className="w-4 h-4" /> {booking.classType || 'online'}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end justify-between gap-4">
                    <Badge className={
                        booking.bookingStatus === 'confirmed' ? 'bg-success/10 text-success' :
                        booking.bookingStatus === 'payment_pending' ? 'bg-amber-100 text-amber-800' :
                        booking.bookingStatus === 'rejected' || booking.bookingStatus === 'cancelled' ? 'bg-destructive/10 text-destructive' :
                        'bg-secondary'
                    }>{booking.bookingStatus.replace('_', ' ')}</Badge>
                    
                    {booking.bookingStatus === 'payment_pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-success hover:border-success hover:bg-success/5 border-green-200" onClick={() => handleStatusChange(booking, 'confirmed')}>
                          <PiCheck className="w-4 h-4 mr-2"/> Accept
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive hover:border-destructive hover:bg-destructive/5 border-red-200" onClick={() => handleStatusChange(booking, 'rejected')}>
                          <PiX className="w-4 h-4 mr-2"/> Reject
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-secondary/50 rounded-2xl">
              <p className="text-muted-foreground">
                {filter === 'pending' ? 'No pending bookings.' : 'No bookings found.'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminBookingsPage;
