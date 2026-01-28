
'use client';

import { useState, useRef, useEffect } from 'react';
import { useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, useStorage } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, query, orderBy, doc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, ArrowLeft, History, X, Download, UploadCloud, AlertTriangle, MessageSquare } from 'lucide-react';
import { Booking, Message, AdminSettings } from '@/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import Link from 'next/link';

const getStatusColor = (status?: string) => {
    switch (status) {
        case 'confirmed': return 'bg-green-100 text-green-800 border-green-200';
        case 'payment_pending': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 're_upload_receipt': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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

const ReUploadReceipt = ({ booking, onUploadComplete }: { booking: Booking, onUploadComplete: () => void }) => {
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const { user } = useUserProfile();
    const storage = useStorage();
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setReceiptFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!receiptFile || !user || !storage || !firestore) return;
        setIsUploading(true);
        try {
            const fileExtension = receiptFile.name.split('.').pop();
            const storageRef = ref(storage, `payments/${user.uid}/${booking.id}.${fileExtension}`);
            await uploadBytes(storageRef, receiptFile);
            const downloadUrl = await getDownloadURL(storageRef);

            await updateDocumentNonBlocking(doc(firestore, 'bookings', booking.id), {
                receiptUrl: downloadUrl,
                receiptType: receiptFile.type,
                bookingStatus: 'payment_pending',
                updatedAt: Timestamp.now(),
            });

            toast({ title: "Receipt Uploaded", description: "Your new receipt has been submitted for review." });
            onUploadComplete();
        } catch (error) {
            toast({ title: "Upload Failed", description: "Could not upload your receipt.", variant: "destructive" });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Card className="bg-yellow-50 border-yellow-200 mt-6">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800"><AlertTriangle /> Action Required: Re-upload Receipt</CardTitle>
                <CardDescription className="text-yellow-700">An admin has reviewed your payment and requires a new receipt. Please upload a clear, full-sized image of your bank transfer receipt.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col sm:flex-row gap-4">
                <Input type="file" accept="image/*,application/pdf" onChange={handleFileChange} disabled={isUploading} />
                <Button onClick={handleUpload} disabled={isUploading || !receiptFile}>
                    {isUploading ? <Loader2 className="animate-spin" /> : <UploadCloud />}
                    <span className="ml-2">Submit New Receipt</span>
                </Button>
            </CardContent>
        </Card>
    );
};

export default function BookingDetailPage({ params }: { params: { bookingId: string } }) {
    const { bookingId } = params;
    const firestore = useFirestore();
    const { user, profile } = useUserProfile();
    const router = useRouter();
    const { toast } = useToast();
    
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const bookingRef = useMemoFirebase(() => {
        if (!firestore || !bookingId) return null;
        return doc(firestore, 'bookings', bookingId);
    }, [firestore, bookingId, refreshKey]);

    const { data: booking, isLoading: isBookingLoading } = useDoc<Booking>(bookingRef);

    const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'admin') : null, [firestore]);
    const { data: settings } = useDoc<AdminSettings>(settingsRef);

    const messagesQuery = useMemoFirebase(() => {
        if (!firestore || !bookingId) return null;
        return query(collection(firestore, 'bookings', bookingId, 'messages'), orderBy('createdAt', 'asc'));
    }, [firestore, bookingId]);

    const { data: messages, isLoading: areMessagesLoading } = useCollection<Message>(messagesQuery);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    const handleSendMessage = async () => {
        if (!newMessage.trim() || !user || !profile || !firestore) return;
        setIsSending(true);
        try {
            await addDocumentNonBlocking(collection(firestore, 'bookings', bookingId, 'messages'), {
                text: newMessage,
                senderId: user.uid,
                senderName: profile.name || user.displayName || user.email?.split('@')[0] || 'Student',
                createdAt: Timestamp.now(),
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            toast({ title: "Error", description: "Could not send message.", variant: "destructive" });
        } finally {
            setIsSending(false);
        }
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
            setRefreshKey(k => k + 1); // Refresh data
        } catch (error) {
            toast({ title: 'Error', description: 'Could not submit cancellation request.', variant: "destructive" });
        }
    };

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
                ['Class Time', `${booking.time} (LKT)`],
                ['Class Type', booking.classType || 'Online'],
                ['Duration', `${booking.duration} Hour(s)`],
                ['Status', getStatusLabel(booking.bookingStatus)],
                ['Price', `LKR ${booking.price?.toLocaleString() || '0'}`],
            ],
            theme: 'grid',
        });
        doc.save(`invoice-${booking.id}.pdf`);
    };

    if (isBookingLoading) {
        return <div className="flex h-full items-center justify-center p-8"><Loader2 className="animate-spin" /></div>;
    }
    
    if (!booking) {
        return <div className="text-center p-8">Booking not found.</div>;
    }

    const isUpcoming = new Date(`${booking.date} ${booking.time}`) > new Date();

    return (
        <div className="space-y-6">
            <Button variant="outline" onClick={() => router.push('/dashboard/bookings')} className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to All Bookings
            </Button>
            
            {booking.bookingStatus === 're_upload_receipt' && (
                <ReUploadReceipt booking={booking} onUploadComplete={() => setRefreshKey(k => k + 1)} />
            )}
            
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                            <CardTitle className="text-2xl">{booking.courseName}</CardTitle>
                            <CardDescription>Booking ID: {booking.id}</CardDescription>
                        </div>
                        <Badge variant="outline" className={cn("w-fit", getStatusColor(booking.bookingStatus))}>
                            {getStatusLabel(booking.bookingStatus)}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <Label>Lecturer</Label>
                        <p className="font-medium">{booking.lecturerName}</p>
                    </div>
                    <div className="space-y-1">
                        <Label>Date & Time</Label>
                        <p className="font-medium">{booking.date} at {booking.time} (LKT)</p>
                    </div>
                    <div className="space-y-1">
                        <Label>Class Type</Label>
                        <p className="font-medium capitalize">{booking.classType}</p>
                    </div>
                     <div className="space-y-1">
                        <Label>Duration</Label>
                        <p className="font-medium">{booking.duration} Hour(s)</p>
                    </div>
                    <div className="space-y-1">
                        <Label>Price</Label>
                        <p className="font-medium">LKR {booking.price?.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2 flex sm:items-end justify-end gap-2">
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
                    </div>
                </CardContent>
            </Card>

            {(booking.bookingStatus === 'payment_pending' || booking.bookingStatus === 're_upload_receipt') && settings?.whatsappContactUrl && (
                <Card>
                    <CardContent className="p-6 text-center">
                        <h3 className="font-semibold mb-2">Need help with your payment?</h3>
                        <p className="text-muted-foreground mb-4">Contact our support team directly on WhatsApp for assistance.</p>
                        <Link href={settings.whatsappContactUrl} target="_blank" rel="noopener noreferrer">
                            <Button className="bg-green-500 hover:bg-green-600 text-white">
                                <MessageSquare className="w-4 h-4 mr-2" />
                                Contact Admin on WhatsApp
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Chat with Admin</CardTitle>
                    <CardDescription>Ask questions or get your class link here.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col h-[500px] border rounded-lg">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
                            {areMessagesLoading && <Loader2 className="animate-spin mx-auto" />}
                            {messages?.map(msg => (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.senderId === user?.uid ? 'justify-end' : 'justify-start')}>
                                    <div className={cn(
                                        "max-w-xs md:max-w-md p-3 rounded-2xl", 
                                        msg.senderId === user?.uid ? 'bg-primary text-primary-foreground rounded-br-none' : 'bg-background border rounded-bl-none'
                                    )}>
                                        <p className="text-sm font-bold">{msg.senderName}</p>
                                        <p className="text-sm">{msg.text}</p>
                                        <p className="text-xs opacity-70 mt-1">{msg.createdAt?.toDate ? format(msg.createdAt.toDate(), 'p') : ''}</p>
                                    </div>
                                </div>
                            ))}
                            {messages?.length === 0 && !areMessagesLoading && (
                                <div className="text-center text-muted-foreground pt-10">No messages yet. Start the conversation!</div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                        <div className="p-4 flex gap-2 border-t bg-background">
                            <Input 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                placeholder="Type your message..."
                                disabled={isSending}
                            />
                            <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                                {isSending ? <Loader2 className="animate-spin" /> : <Send />}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

    