'use client';

import { useState } from 'react';
import { useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, where } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Check, X } from 'lucide-react';
import Image from 'next/image';

export default function AdminBookingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'bookings'), orderBy('createdAt', 'desc'));
  }, [firestore]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection<Booking>(bookingsQuery);

  const filteredBookings = bookings?.filter(b => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return b.bookingStatus === 'payment_pending';
    if (activeTab === 'confirmed') return b.bookingStatus === 'confirmed';
    if (activeTab === 'rejected') return b.bookingStatus === 'rejected';
    return true;
  });

  const handleUpdateStatus = async (bookingId: string, status: Booking['bookingStatus'], paymentStatus: Booking['paymentStatus']) => {
    setIsLoading(true);
    try {
      await updateDocumentNonBlocking(doc(firestore, 'bookings', bookingId), {
        bookingStatus: status,
        paymentStatus: paymentStatus
      });
      toast({ title: `Booking ${status}` });
      setIsReceiptOpen(false);
    } catch (error) {
      toast({ title: 'Error updating booking', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bookings Management</h2>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Payment Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <Card className="mt-4">
          <CardContent className="p-0">
            {isBookingsLoading ? (
               <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Date/Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings?.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                         <div className="font-medium">{booking.userId}</div>
                         {/* We need to fetch user name or store it in booking. Stored in booking is better. */}
                      </TableCell>
                      <TableCell>
                        <div>{booking.courseName}</div>
                        <div className="text-xs text-muted-foreground">{booking.lecturerName}</div>
                      </TableCell>
                      <TableCell>
                        {booking.date} <br/> {booking.time}
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          booking.bookingStatus === 'confirmed' ? 'default' : 
                          booking.bookingStatus === 'payment_pending' ? 'secondary' : 
                          'destructive'
                        }>
                          {booking.bookingStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isReceiptOpen && selectedBooking?.id === booking.id} onOpenChange={(open) => {
                          setIsReceiptOpen(open);
                          if (!open) setSelectedBooking(null);
                          else setSelectedBooking(booking);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedBooking(booking)}>
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <h3 className="font-semibold">Course Details</h3>
                                <p>Course: {booking.courseName}</p>
                                <p>Lecturer: {booking.lecturerName}</p>
                                <p>Date: {booking.date} @ {booking.time}</p>
                                <p>Price: LKR {booking.price}</p>
                              </div>
                              <div className="space-y-2">
                                <h3 className="font-semibold">Payment Receipt</h3>
                                {booking.receiptUrl ? (
                                  <div>
                                    {booking.receiptType?.startsWith('image/') ? (
                                      <div className="relative h-64 w-full border rounded-md overflow-hidden">
                                        <Image 
                                          src={booking.receiptUrl} 
                                          alt="Receipt" 
                                          fill 
                                          className="object-contain"
                                        />
                                      </div>
                                    ) : (
                                      <div className="h-64 w-full border rounded-md flex flex-col items-center justify-center bg-secondary text-center p-4">
                                        <p className="text-sm font-medium">Receipt Uploaded</p>
                                        <p className="text-xs text-muted-foreground mb-2">
                                          {booking.receiptType === 'application/pdf' ? 'PDF Document' : 'Unsupported file type'}
                                        </p>
                                        <a href={booking.receiptUrl} target="_blank" rel="noopener noreferrer">
                                          <Button variant="link" size="sm">
                                            View File
                                          </Button>
                                        </a>
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-muted-foreground">No receipt uploaded.</p>
                                )}
                              </div>
                            </div>
                            <DialogFooter className="gap-2 sm:justify-between">
                              <Button 
                                variant="destructive" 
                                onClick={() => handleUpdateStatus(booking.id, 'rejected', 'rejected')}
                                disabled={isLoading}
                              >
                                <X className="w-4 h-4 mr-2" /> Reject
                              </Button>
                              <Button 
                                className="bg-green-600 hover:bg-green-700" 
                                onClick={() => handleUpdateStatus(booking.id, 'confirmed', 'confirmed')}
                                disabled={isLoading}
                              >
                                <Check className="w-4 h-4 mr-2" /> Confirm Payment
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredBookings?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">No bookings found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
