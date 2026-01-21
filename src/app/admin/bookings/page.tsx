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
  DialogClose
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, Check, X, AlertTriangle, ExternalLink, FileText } from 'lucide-react';
import Image from 'next/image';

export default function AdminBookingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
    if (activeTab === 'rejected') return b.bookingStatus === 'rejected' || b.bookingStatus === 'cancelled';
    if (activeTab === 'requests') return b.bookingStatus === 'cancellation_requested';
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
      setIsDialogOpen(false);
    } catch (error) {
      toast({ title: 'Error updating booking', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status?: Booking['bookingStatus']) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'payment_pending': return 'secondary';
      case 'cancellation_requested': return 'default'; // yellow
      case 'cancelled':
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bookings Management</h2>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Payment Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="rejected">Rejected/Cancelled</TabsTrigger>
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
                         <div className="font-medium">{booking.userName}</div>
                         <div className="text-xs text-muted-foreground">{booking.userId}</div>
                      </TableCell>
                      <TableCell>
                        <div>{booking.courseName}</div>
                        <div className="text-xs text-muted-foreground">{booking.lecturerName}</div>
                      </TableCell>
                      <TableCell>
                        {booking.date} <br/> {booking.time}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusVariant(booking.bookingStatus)}
                          className={booking.bookingStatus === 'cancellation_requested' ? 'bg-yellow-400 text-yellow-900' : ''}
                        >
                          {booking.bookingStatus?.replace('_', ' ') || 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Dialog open={isDialogOpen && selectedBooking?.id === booking.id} onOpenChange={(open) => {
                          setIsDialogOpen(open);
                          if (!open) setSelectedBooking(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" onClick={() => {
                                setSelectedBooking(booking);
                                setIsDialogOpen(true);
                            }}>
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Booking Details</DialogTitle>
                            </DialogHeader>
                            <div className="grid md:grid-cols-2 gap-6 mt-4">
                                <div>
                                <h3 className="font-semibold mb-2">Booking & Student Details</h3>
                                <Card className="bg-secondary/10 border-primary/20">
                                <CardContent className="p-6 space-y-4">
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-semibold">Student:</span>
                                    <span className="text-right">{booking.userName || 'Unknown'}<br/><span className="text-xs text-muted-foreground">{booking.userId}</span></span>
                                  </div>
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-semibold">Course:</span>
                                    <span>{booking.courseName}</span>
                                  </div>
                                   <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-semibold">Lecturer:</span>
                                    <span>{booking.lecturerName}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-semibold">Class Type:</span>
                                    <span className="capitalize">{booking.classType || 'Online'}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-semibold">Date & Time:</span>
                                    <span>{booking.date} @ {booking.time}</span>
                                  </div>
                                   <div className="flex justify-between items-center border-b pb-2">
                                      <span className="font-semibold">Booking Status:</span>
                                      <Badge variant={getStatusVariant(booking.bookingStatus)} className={booking.bookingStatus === 'cancellation_requested' ? 'bg-yellow-400 text-yellow-900' : ''}>
                                          {booking.bookingStatus?.replace('_', ' ') || 'Unknown'}
                                      </Badge>
                                  </div>
                                  <div className="flex justify-between items-center border-b pb-2">
                                      <span className="font-semibold">Payment Status:</span>
                                      <span className="capitalize">{booking.paymentStatus?.replace('_', ' ')}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xl font-bold pt-2">
                                    <span>Amount:</span>
                                    <span className="text-primary">LKR {booking.price}</span>
                                  </div>
                                </CardContent>
                              </Card>
                                </div>
                                <div>
                                <h3 className="font-semibold mb-2">Payment Receipt</h3>
                                {booking.receiptUrl ? (
                                    <div className="space-y-4">
                                    {booking.receiptType?.startsWith('image/') ? (
                                        <div className="relative w-full h-[400px] border rounded-lg overflow-hidden bg-black/5">
                                        <Image 
                                            src={booking.receiptUrl} 
                                            alt="Receipt" 
                                            fill 
                                            className="object-contain"
                                        />
                                        </div>
                                    ) : booking.receiptType === 'application/pdf' ? (
                                        <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
                                            <FileText className="w-16 h-16 text-red-500 mb-4" />
                                            <p className="font-semibold">PDF Document</p>
                                            <p className="text-sm">Click "Open Original" to view.</p>
                                        </div>
                                    ) : (
                                        <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
                                            <span className="text-4xl mb-2">📄</span>
                                            <p>Receipt uploaded (unsupported preview)</p>
                                        </div>
                                    )}
                                    <div className="flex justify-end">
                                        <a href={booking.receiptUrl} target="_blank" rel="noopener noreferrer">
                                        <Button variant="secondary" size="sm">
                                            <ExternalLink className="mr-2 h-4 w-4" /> Open Original
                                        </Button>
                                        </a>
                                    </div>
                                    </div>
                                ) : (
                                    <div className="h-[400px] flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-muted-foreground bg-muted/10">
                                    <span className="text-4xl mb-2">📄</span>
                                    <p>No receipt uploaded</p>
                                    </div>
                                )}
                                </div>
                            </div>
                            <DialogFooter className="gap-2 sm:justify-between pt-6">
                             {booking.bookingStatus === 'cancellation_requested' ? (
                               <div className="w-full flex justify-between">
                                  <Button variant="outline" onClick={() => handleUpdateStatus(booking.id, 'confirmed', 'paid')} disabled={isLoading}>Deny Request</Button>
                                  <Button variant="destructive" onClick={() => handleUpdateStatus(booking.id, 'cancelled', 'rejected')} disabled={isLoading}><AlertTriangle className="w-4 h-4 mr-2"/>Approve Cancellation</Button>
                               </div>
                             ) : (
                                <>
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleUpdateStatus(booking.id, 'rejected', 'rejected')}
                                    disabled={isLoading}
                                  >
                                    <X className="w-4 h-4 mr-2" /> Reject
                                  </Button>
                                  <Button 
                                    className="bg-green-600 hover:bg-green-700" 
                                    onClick={() => handleUpdateStatus(booking.id, 'confirmed', 'paid')}
                                    disabled={isLoading || booking.bookingStatus === 'confirmed'}
                                  >
                                    <Check className="w-4 h-4 mr-2" /> Confirm Payment
                                  </Button>
                                </>
                             )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredBookings?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">No bookings found for this tab.</TableCell>
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
