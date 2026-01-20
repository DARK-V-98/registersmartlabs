'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { Booking } from '@/types';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
    case 'payment_pending': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'payment_pending': return 'Payment Pending';
    case 'confirmed': return 'Confirmed';
    case 'rejected': return 'Rejected';
    case 'cancelled': return 'Cancelled';
    default: return status;
  }
};

export default function MyBookingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const bookingsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'bookings'),
      where('userId', '==', user.uid)
      // Removed orderBy to avoid index requirement issues until index is created
      // orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: bookingsRaw, isLoading } = useCollection<Booking>(bookingsQuery);

  // Sort client-side
  const bookings = bookingsRaw?.sort((a, b) => {
    if (!a.createdAt || !b.createdAt) return 0;
    // Handle Firestore Timestamp or Date
    const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt).getTime();
    const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt).getTime();
    return timeB - timeA;
  });

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">My Bookings</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Booking History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course</TableHead>
                <TableHead>Lecturer</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings?.map((booking) => (
                <TableRow key={booking.id}>
                  <TableCell className="font-medium">
                    {booking.courseName || 'Unknown Course'}
                    <div className="text-xs text-muted-foreground capitalize">{booking.classType || 'online'} Class</div>
                  </TableCell>
                  <TableCell>{booking.lecturerName || 'Unknown Lecturer'}</TableCell>
                  <TableCell>
                    {booking.date} <br/> 
                    <span className="text-xs text-muted-foreground">{booking.time}</span>
                  </TableCell>
                  <TableCell>
                    {booking.price ? `Rs. ${booking.price}` : '-'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(booking.bookingStatus)}>
                      {getStatusLabel(booking.bookingStatus)}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
              {bookings?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No bookings found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
