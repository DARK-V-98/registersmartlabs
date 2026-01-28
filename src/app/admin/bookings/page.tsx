
'use client';

import { useState, useRef, useEffect } from 'react';
import { useFirestore, useCollection, updateDocumentNonBlocking, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, query, orderBy, doc, where, Timestamp, getDoc, arrayRemove } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Booking, Message, Schedule } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ExternalLink, FileText, Check, X, AlertTriangle, Send, RefreshCw, Plus, FileDown } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import Link from 'next/link';
import { logActivity } from '@/lib/logger';

const MASTER_TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
];

function ChatInterface({ bookingId }: { bookingId: string }) {
    const firestore = useFirestore();
    const { profile } = useUserProfile(); // Admin's profile
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !bookingId) return null;
        return query(collection(firestore, 'bookings', bookingId, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, bookingId]);
    
    const { data: messages } = useCollection<Message>(messagesQuery);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !profile || !firestore) return;
        setIsSending(true);
        try {
            await addDocumentNonBlocking(collection(firestore, 'bookings', bookingId, 'messages'), {
                text: newMessage,
                senderId: profile.id,
                senderName: 'Admin Support', // Consistent name for admin
                createdAt: Timestamp.now(),
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setIsSending(false);
        }
    };
    
    return (
        <div className="flex flex-col h-[400px] lg:h-[500px]">
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/50 rounded-lg">
                {messages?.map(msg => (
                    <div key={msg.id} className={cn("flex items-end gap-2", msg.senderName === 'Admin Support' ? 'justify-end' : 'justify-start')}>
                        <div className={cn(
                            "max-w-xs md:max-w-md p-3 rounded-2xl", 
                            msg.senderName === 'Admin Support' ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background border rounded-bl-none'
                        )}>
                            <p className="text-sm">{msg.text}</p>
                            <p className="text-xs opacity-70 mt-1">{msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'p') : ''}</p>
                        </div>
                    </div>
                ))}
                 {messages?.length === 0 && (
                    <div className="text-center text-muted-foreground pt-10">No messages yet.</div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="mt-4 flex gap-2">
                <Input 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    disabled={isSending}
                />
                <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                    {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                </Button>
            </div>
        </div>
    );
}

const getSlotsToRemoveForBooking = (booking: Booking) => {
    const slots = [];
    const startTimeIndex = MASTER_TIME_SLOTS.indexOf(booking.time);
    if (startTimeIndex === -1) return [];
    
    const slotsToBookCount = (booking.duration || 1) === 1 ? 2 : 4; // 1hr = 2 slots, 2hr = 4 slots
    for (let i = 0; i < slotsToBookCount; i++) {
        const slotIndex = startTimeIndex + i;
        if (slotIndex < MASTER_TIME_SLOTS.length) {
            slots.push(MASTER_TIME_SLOTS[slotIndex]);
        }
    }
    return slots;
};

const exportToCsv = (filename: string, rows: object[]) => {
    if (!rows || rows.length === 0) {
        return;
    }
    const separator = ',';
    const keys = Object.keys(rows[0]);
    const csvContent =
        keys.join(separator) +
        '\n' +
        rows.map(row => {
            return keys.map((k: any) => {
                let cell = (row as any)[k] === null || (row as any)[k] === undefined ? '' : (row as any)[k];
                cell = cell instanceof Date 
                    ? cell.toLocaleString() 
                    : cell.toString().replace(/"/g, '""');
                if (cell.search(/("|,|\n)/g) >= 0) {
                    cell = `"${cell}"`;
                }
                return cell;
            }).join(separator);
        }).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    if (typeof window !== 'undefined' && window.navigator.msSaveOrOpenBlob) {
        window.navigator.msSaveOrOpenBlob(blob, filename);
    } else {
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }
};


export default function AdminBookingsPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile: adminProfile } = useUserProfile();
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
    if (activeTab === 'pending') return b.bookingStatus === 'payment_pending' || b.bookingStatus === 're_upload_receipt';
    if (activeTab === 'confirmed') return b.bookingStatus === 'confirmed';
    if (activeTab === 'rejected') return b.bookingStatus === 'rejected' || b.bookingStatus === 'cancelled';
    if (activeTab === 'requests') return b.bookingStatus === 'cancellation_requested';
    return true;
  });
  
  const handleExport = () => {
    if (filteredBookings) {
        const dataToExport = filteredBookings.map(booking => ({
            id: booking.id,
            studentName: booking.userName,
            studentId: booking.userId,
            studentEmail: booking.userEmail,
            courseName: booking.courseName,
            lecturerName: booking.lecturerName,
            date: booking.date,
            time: booking.time,
            duration: booking.duration,
            classType: booking.classType,
            price: booking.price,
            bookingStatus: booking.bookingStatus,
            paymentStatus: booking.paymentStatus,
            createdAt: booking.createdAt?.toDate ? format(booking.createdAt.toDate(), 'yyyy-MM-dd HH:mm') : 'N/A',
        }));
        exportToCsv(`smartlabs_bookings_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.csv`, dataToExport);
    }
  };


  const handleUpdateStatus = async (booking: Booking, status: Booking['bookingStatus'], paymentStatus: Booking['paymentStatus']) => {
    if (!firestore || !adminProfile) return;
    setIsLoading(true);

    try {
      // 1. Update the booking document status
      updateDocumentNonBlocking(doc(firestore, 'bookings', booking.id), {
        bookingStatus: status,
        paymentStatus: paymentStatus
      });

      // 2. Log the activity
      logActivity(firestore, {
        actorId: adminProfile.id,
        actorName: adminProfile.name || 'Admin',
        action: `booking.${status}`,
        entityType: 'booking',
        entityId: booking.id,
        details: { from: booking.bookingStatus, to: status },
        targetUserId: booking.userId,
        targetUserName: booking.userName,
      });

      // 3. If rejected or cancelled, un-block the time slots
      if (status === 'rejected' || status === 'cancelled') {
        const scheduleId = `${booking.courseId}_${booking.lecturerId}_${booking.date}`;
        const scheduleRef = doc(firestore, 'schedules', scheduleId);
        
        const scheduleSnap = await getDoc(scheduleRef);
        if (scheduleSnap.exists()) {
          const slotsToRemove = getSlotsToRemoveForBooking(booking);
          
          if (slotsToRemove.length > 0) {
            updateDocumentNonBlocking(scheduleRef, {
              bookedSlots: arrayRemove(...slotsToRemove)
            });
          }
        }
      }

      // 4. Send confirmation email if status is confirmed
      if (status === 'confirmed') {
          if (booking.userEmail) {
             try {
                 fetch('/api/send-email', {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({
                         type: 'confirmation',
                         bookingId: booking.id,
                         userId: booking.userId,
                         userName: booking.userName,
                         userEmail: booking.userEmail,
                         courseName: booking.courseName,
                         classType: booking.classType,
                         lecturerName: booking.lecturerName,
                         date: booking.date,
                         time: booking.time,
                         price: booking.price,
                         paymentMethod: 'Bank Transfer',
                     })
                 });
             } catch (emailError) {
                 console.error("Failed to send confirmation email", emailError);
             }
          }
      }

      toast({ title: `Booking ${status}` });
      setSelectedBooking(prev => prev ? {...prev, bookingStatus: status, paymentStatus: paymentStatus} : null);
    } catch (error) {
      toast({ title: 'Error updating booking', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusVariant = (status?: Booking['bookingStatus']) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'payment_pending': return 'secondary';
      case 're_upload_receipt': return 'destructive';
      case 'cancellation_requested': return 'default'; // yellow
      case 'cancelled':
      case 'rejected': return 'destructive';
      default: return 'outline';
    }
  }
  
  const getStatusClass = (status?: Booking['bookingStatus']) => {
    switch (status) {
      case 'cancellation_requested': return 'bg-yellow-400 text-yellow-900';
      case 're_upload_receipt': return 'bg-orange-400 text-orange-900';
      default: return '';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bookings Management</h2>
        <div className="flex items-center gap-2">
            <Button onClick={handleExport} variant="outline" disabled={!filteredBookings || filteredBookings.length === 0}>
                <FileDown className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Link href="/admin/bookings/new">
              <Button><Plus className="mr-2 h-4 w-4" /> Manual Booking</Button>
            </Link>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Pending/Re-upload</TabsTrigger>
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
                          className={getStatusClass(booking.bookingStatus)}
                        >
                          {booking.bookingStatus?.replace(/_/g, ' ') || 'Unknown'}
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
                              <DialogTitle>Review Booking: {selectedBooking?.id}</DialogTitle>
                            </DialogHeader>
                            {selectedBooking && (
                                <Tabs defaultValue="details">
                                <TabsList className="grid w-full grid-cols-3">
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                    <TabsTrigger value="payment">Payment</TabsTrigger>
                                    <TabsTrigger value="chat">Chat</TabsTrigger>
                                </TabsList>
                                <TabsContent value="details" className="pt-4">
                                     <Card className="bg-secondary/10 border-primary/20">
                                        <CardContent className="p-6 space-y-4">
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-semibold">Student:</span>
                                            <span className="text-right">{selectedBooking.userName || 'Unknown'}<br/><span className="text-xs text-muted-foreground">{selectedBooking.userId}</span></span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-semibold">Course:</span>
                                            <span>{selectedBooking.courseName}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-semibold">Lecturer:</span>
                                            <span>{selectedBooking.lecturerName}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-semibold">Class Type:</span>
                                            <span className="capitalize">{selectedBooking.classType || 'Online'}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-semibold">Date & Time:</span>
                                            <span>{selectedBooking.date} @ {selectedBooking.time}</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-semibold">Duration:</span>
                                            <span>{selectedBooking.duration} Hour(s)</span>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-semibold">Booking Status:</span>
                                            <Badge variant={getStatusVariant(selectedBooking.bookingStatus)} className={getStatusClass(selectedBooking.bookingStatus)}>
                                                {selectedBooking.bookingStatus?.replace(/_/g, ' ') || 'Unknown'}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center border-b pb-2">
                                            <span className="font-semibold">Payment Status:</span>
                                            <span className="capitalize">{selectedBooking.paymentStatus?.replace('_', ' ')}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xl font-bold pt-2">
                                            <span>Amount:</span>
                                            <span className="text-primary">LKR {selectedBooking.price}</span>
                                        </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                                <TabsContent value="payment" className="pt-4">
                                     <h3 className="font-semibold mb-2">Payment Receipt</h3>
                                        {selectedBooking.receiptUrl ? (
                                            <div className="space-y-4">
                                            {selectedBooking.receiptType?.startsWith('image/') ? (
                                                <div className="relative w-full h-[300px] lg:h-[400px] border rounded-lg overflow-hidden bg-black/5">
                                                <Image 
                                                    src={selectedBooking.receiptUrl} 
                                                    alt="Receipt" 
                                                    fill 
                                                    className="object-contain"
                                                />
                                                </div>
                                            ) : selectedBooking.receiptType === 'application/pdf' ? (
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
                                                <a href={selectedBooking.receiptUrl} target="_blank" rel="noopener noreferrer">
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
                                </TabsContent>
                                <TabsContent value="chat" className="pt-4">
                                    <ChatInterface bookingId={selectedBooking.id} />
                                </TabsContent>
                                </Tabs>
                            )}
                            <DialogFooter className="gap-2 sm:justify-between pt-6">
                             {selectedBooking?.bookingStatus === 'cancellation_requested' ? (
                               <div className="w-full flex justify-between">
                                  <Button variant="outline" onClick={() => handleUpdateStatus(selectedBooking, 'confirmed', 'paid')} disabled={isLoading}>Deny Request</Button>
                                  <Button variant="destructive" onClick={() => handleUpdateStatus(selectedBooking, 'cancelled', 'rejected')} disabled={isLoading}><AlertTriangle className="w-4 h-4 mr-2"/>Approve Cancellation</Button>
                               </div>
                             ) : selectedBooking?.bookingStatus === 'payment_pending' || selectedBooking?.bookingStatus === 're_upload_receipt' ? (
                                <div className="w-full flex justify-between items-center">
                                  <Button 
                                    variant="destructive" 
                                    onClick={() => handleUpdateStatus(selectedBooking, 'rejected', 'rejected')}
                                    disabled={isLoading}
                                  >
                                    <X className="w-4 h-4 mr-2" /> Reject
                                  </Button>
                                  <Button 
                                    variant="outline"
                                    className="text-amber-600 border-amber-300 hover:bg-amber-50"
                                    onClick={() => handleUpdateStatus(selectedBooking, 're_upload_receipt', 'pending')}
                                    disabled={isLoading}
                                  >
                                    <RefreshCw className="w-4 h-4 mr-2" /> Request Re-upload
                                  </Button>
                                  <Button 
                                    className="bg-green-600 hover:bg-green-700" 
                                    onClick={() => handleUpdateStatus(selectedBooking, 'confirmed', 'paid')}
                                    disabled={isLoading || selectedBooking.bookingStatus === 'confirmed'}
                                  >
                                    <Check className="w-4 h-4 mr-2" /> Confirm Payment
                                  </Button>
                                </div>
                             ) : null}
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
