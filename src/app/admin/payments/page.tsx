'use client';

import { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, CheckCircle, XCircle, Eye, ExternalLink } from 'lucide-react';
import { Booking } from '@/types';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

export default function AdminPaymentsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Query only pending payments or where receiptUrl exists but status is pending
  const paymentsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(
      collection(firestore, 'bookings'),
      where('bookingStatus', '==', 'payment_pending'),
      orderBy('createdAt', 'desc')
    );
  }, [firestore]);

  const { data: bookings, isLoading } = useCollection<Booking>(paymentsQuery);

  const handleVerify = async (bookingId: string, action: 'approve' | 'reject') => {
    if (!firestore) return;
    setProcessingId(bookingId);
    try {
      const bookingRef = doc(firestore, 'bookings', bookingId);
      
      const updateData = action === 'approve' 
        ? { 
            paymentStatus: 'paid', 
            bookingStatus: 'confirmed',
            updatedAt: new Date()
          }
        : { 
            paymentStatus: 'failed', 
            bookingStatus: 'rejected',
            updatedAt: new Date()
          };

      await updateDocumentNonBlocking(bookingRef, updateData);
      
      toast({
        title: action === 'approve' ? 'Payment Approved' : 'Payment Rejected',
        description: `Booking has been ${action}d.`,
      });
    } catch (error) {
      toast({
        title: 'Error updating payment',
        variant: 'destructive',
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Payment Verification</h2>

      <Card>
        <CardHeader>
          <CardTitle>Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Receipt</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bookings?.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div className="font-medium">{booking.userName || 'Unknown User'}</div>
                      <div className="text-sm text-muted-foreground">{booking.userId}</div>
                    </TableCell>
                    <TableCell>
                      {booking.courseName}
                      <div className="text-xs text-muted-foreground">{booking.classType}</div>
                    </TableCell>
                    <TableCell>Rs. {booking.price}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2">
                            <Eye className="h-4 w-4" /> View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Payment Verification</DialogTitle>
                          </DialogHeader>
                          
                          <div className="grid md:grid-cols-2 gap-6 mt-4">
                            {/* Booking Details Card */}
                            <div>
                              <h3 className="font-semibold mb-2">Booking Details</h3>
                              <Card className="bg-secondary/10 border-primary/20">
                                <CardContent className="p-6 space-y-4">
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-semibold">Student:</span>
                                    <span>{booking.userName || 'Unknown'}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-semibold">Course:</span>
                                    <span>{booking.courseName}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-semibold">Class Type:</span>
                                    <span className="capitalize">{booking.classType || 'Online'} Class</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-semibold">Lecturer:</span>
                                    <span>{booking.lecturerName}</span>
                                  </div>
                                  <div className="flex justify-between items-center border-b pb-2">
                                    <span className="font-semibold">Date & Time:</span>
                                    <span>{booking.date} @ {booking.time}</span>
                                  </div>
                                  <div className="flex justify-between items-center text-xl font-bold pt-2">
                                    <span>Amount:</span>
                                    <span className="text-primary">LKR {booking.price}</span>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            {/* Receipt View */}
                            <div>
                              <h3 className="font-semibold mb-2">Payment Receipt</h3>
                              {booking.receiptUrl ? (
                                <div className="space-y-4">
                                    <div className="relative w-full h-[400px] border rounded-lg overflow-hidden bg-black/5">
                                      <Image 
                                        src={booking.receiptUrl} 
                                        alt="Receipt" 
                                        fill 
                                        className="object-contain"
                                      />
                                    </div>
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
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => handleVerify(booking.id, 'approve')}
                          disabled={!!processingId}
                        >
                          {processingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleVerify(booking.id, 'reject')}
                          disabled={!!processingId}
                        >
                          {processingId === booking.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {bookings?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">No pending payments found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
