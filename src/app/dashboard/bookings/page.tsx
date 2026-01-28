
'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Loader2, MessageSquare } from 'lucide-react';
import { Booking } from '@/types';
import Link from 'next/link';

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
    case 'payment_pending': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'cancellation_requested': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
    case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const getStatusLabel = (status?: string) => {
  if (!status) return 'Unknown';
  return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function MyBookingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const bookingsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);

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
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
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
                            <span className="text-xs text-muted-foreground">{booking.time} (LKT)</span>
                        </TableCell>
                        <TableCell>
                            <Badge variant="outline" className={getStatusColor(booking.bookingStatus)}>
                            {getStatusLabel(booking.bookingStatus)}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                           <Link href={`/dashboard/bookings/${booking.id}`}>
                               <Button variant="outline" size="sm">
                                   <MessageSquare className="w-4 h-4 mr-2" />
                                   View Details & Chat
                               </Button>
                           </Link>
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
