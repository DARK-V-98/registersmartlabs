'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, orderBy, doc } from 'firebase/firestore';
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
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download, History, X, Info } from 'lucide-react';
import { Booking, Course } from '@/types';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

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

const CourseDetailsDialog = ({ courseId }: { courseId: string }) => {
    const firestore = useFirestore();
    const courseRef = useMemoFirebase(() => firestore ? doc(firestore, 'courses', courseId) : null, [firestore, courseId]);
    const { data: course, isLoading } = useDoc<Course>(courseRef);

    return (
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{isLoading ? 'Loading...' : course?.name}</DialogTitle>
            </DialogHeader>
            {isLoading ? <Loader2 className="animate-spin" /> :
                course ? (
                    <div className="space-y-4">
                        <p><strong>Price:</strong> LKR {course.price.toLocaleString()}</p>
                        <p><strong>Status:</strong> <span className="capitalize">{course.status}</span></p>
                        {/* Add more course details here if needed */}
                    </div>
                ) : <p>Course details not found.</p>
            }
        </DialogContent>
    );
};

export default function MyBookingsPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const bookingsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'bookings'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
  }, [user, firestore]);

  const { data: bookings, isLoading } = useCollection<Booking>(bookingsQuery);

  const generateInvoice = (booking: Booking) => {
    const doc = new jsPDF();
    
    doc.text("Booking Invoice", 14, 20);
    doc.setFontSize(12);
    doc.text(`Booking ID: ${booking.id}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 36);

    (doc as any).autoTable({
      startY: 45,
      head: [['Description', 'Details']],
      body: [
        ['Student', booking.userName || 'N/A'],
        ['Course', booking.courseName || 'N/A'],
        ['Lecturer', booking.lecturerName || 'N/A'],
        ['Class Date', booking.date],
        ['Class Time', booking.time],
        ['Class Type', booking.classType || 'Online'],
        ['Status', getStatusLabel(booking.bookingStatus)],
        ['Price', `LKR ${booking.price?.toLocaleString() || '0'}`],
      ],
      theme: 'grid',
    });

    doc.save(`invoice-${booking.id}.pdf`);
  };

  const handleRebook = (booking: Booking) => {
    router.push(`/dashboard/book?courseId=${booking.courseId}&lecturerId=${booking.lecturerId}`);
  };

  const handleCancellationRequest = async (bookingId: string) => {
    if (!firestore) return;
    try {
      await updateDocumentNonBlocking(doc(firestore, 'bookings', bookingId), {
        bookingStatus: 'cancellation_requested'
      });
      toast({ title: 'Cancellation Requested', description: 'An admin will review your request shortly.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Could not submit cancellation request.', variant: 'destructive' });
    }
  };


  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <Dialog onOpenChange={(open) => !open && setSelectedCourseId(null)}>
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
                {bookings?.map((booking) => {
                    const isUpcoming = new Date(`${booking.date} ${booking.time}`) > new Date();
                    return (
                        <TableRow key={booking.id}>
                            <TableCell className="font-medium">
                                <DialogTrigger asChild>
                                    <button onClick={() => setSelectedCourseId(booking.courseId)} className="hover:underline flex items-center gap-2">
                                        {booking.courseName || 'Unknown Course'} <Info className="w-3 h-3 text-muted-foreground" />
                                    </button>
                                </DialogTrigger>
                                <div className="text-xs text-muted-foreground capitalize">{booking.classType || 'online'} Class</div>
                            </TableCell>
                            <TableCell>{booking.lecturerName || 'Unknown Lecturer'}</TableCell>
                            <TableCell>
                                {booking.date} <br/> 
                                <span className="text-xs text-muted-foreground">{booking.time}</span>
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className={getStatusColor(booking.bookingStatus)}>
                                {getStatusLabel(booking.bookingStatus)}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                {!isUpcoming && (
                                    <Button variant="outline" size="sm" onClick={() => handleRebook(booking)}>
                                        <History className="w-4 h-4 mr-2" />
                                        Book Again
                                    </Button>
                                )}
                                {isUpcoming && booking.bookingStatus === 'confirmed' && (
                                     <Button variant="destructive" size="sm" onClick={() => handleCancellationRequest(booking.id)}>
                                        <X className="w-4 h-4 mr-2" />
                                        Cancel
                                    </Button>
                                )}
                                {booking.paymentStatus === 'paid' && booking.bookingStatus === 'confirmed' && (
                                    <Button variant="secondary" size="sm" onClick={() => generateInvoice(booking)}>
                                        <Download className="w-4 h-4 mr-2" />
                                        Invoice
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    )
                })}
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
      {selectedCourseId && <CourseDetailsDialog courseId={selectedCourseId} />}
    </Dialog>
  );
}
