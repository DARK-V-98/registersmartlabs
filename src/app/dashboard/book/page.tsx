
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useStorage, updateDocumentNonBlocking, useDoc } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, CreditCard, ChevronLeft, ChevronRight, User, Star, AlertTriangle, Info, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Course, Lecturer, Schedule, AdminSettings } from '@/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';

const STEPS = [
  { id: 1, title: 'Select Course' },
  { id: 2, title: 'Class Type' },
  { id: 3, title: 'Select Lecturer' },
  { id: 4, title: 'Date & Time' },
  { id: 5, title: 'Payment' },
];


export default function BookingPage() {
  const { user, profile } = useUserProfile();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Selection State
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [classType, setClassType] = useState<'online' | 'physical'>('online');
  const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState(1); // 1 or 2 hours
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // Data Fetching
  const { data: courses } = useCollection<Course>(
    query(collection(firestore, 'courses'), where('status', '==', 'active'))
  );

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'admin') : null, [firestore]);
  const { data: settings } = useDoc<AdminSettings>(settingsRef);

  const lecturersQuery = useMemoFirebase(() => {
    if (!firestore || !selectedCourse) return null;
    return query(collection(firestore, 'lecturers'), orderBy('name'));
  }, [firestore, selectedCourse]);

  const { data: allLecturers } = useCollection<Lecturer>(lecturersQuery);
  
  useEffect(() => {
      if (settings?.physicalClassesEnabled === false && classType === 'physical') {
          setClassType('online');
      }
  }, [settings, classType]);

  const availableLecturers = useMemo(() => {
    if (!selectedCourse || !allLecturers) return [];
    let lecturers = allLecturers.filter(l => l.courses?.includes(selectedCourse.id));
    if (showFavorites) {
        lecturers = lecturers.filter(l => profile?.favoriteLecturers?.includes(l.id));
    }
    return lecturers;
  }, [selectedCourse, allLecturers, showFavorites, profile]);

  const schedulesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedCourse || !selectedLecturer) return null;
    return query(
      collection(firestore, 'schedules'),
      where('courseId', '==', selectedCourse.id),
      where('lecturerId', '==', selectedLecturer.id)
    );
  }, [firestore, selectedCourse, selectedLecturer]);

  const { data: schedules } = useCollection<Schedule>(schedulesQuery);

  const isDateFullyBooked = (date: Date): boolean => {
    if (!schedules || !date) return false;
    const dateStr = format(date, 'yyyy-MM-dd');
    const scheduleForDate = schedules.find(s => s.date === dateStr);
    if (!scheduleForDate || !scheduleForDate.timeSlots || scheduleForDate.timeSlots.length === 0) {
        return true; 
    }
    const takenSlots = new Set(scheduleForDate.bookedSlots || []);
    const availableSlots = scheduleForDate.timeSlots.filter(t => !takenSlots.has(t));
    return availableSlots.length < 2; // Can't even fit a 1-hour class
  };

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !schedules) return [];
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const schedule = schedules.find(s => s.date === dateStr);
    if (!schedule || !schedule.timeSlots) return [];

    const takenSlots = new Set(schedule.bookedSlots || []);
    const slotsNeeded = duration * 2; // 1hr = 2 slots, 2hr = 4 slots

    // Filter possible start times
    return schedule.timeSlots.filter((startTime, index) => {
      // Create an array of all slots required for this booking
      const requiredSlots = [];
      for (let i = 0; i < slotsNeeded; i++) {
        const nextSlotIndex = index + i;
        if (nextSlotIndex >= schedule.timeSlots.length) {
          return false; // Not enough slots left in the day for this duration
        }
        requiredSlots.push(schedule.timeSlots[nextSlotIndex]);
      }
      
      // Check if any of the required slots are already taken
      for (const slot of requiredSlots) {
        if (takenSlots.has(slot)) {
          return false;
        }
      }

      return true;
    });
  }, [selectedDate, schedules, duration]);


  const handleNext = () => {
    if (step === 1 && !selectedCourse) return;
    if (step === 2 && !classType) return;
    if (step === 3 && !selectedLecturer) return;
    if (step === 4 && (!selectedDate || !selectedTime)) return;
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    setStep(prev => prev - 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleToggleFavorite = async (lecturerId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !firestore) return;
    const userRef = doc(firestore, 'users', user.uid);
    const isFavorite = profile?.favoriteLecturers?.includes(lecturerId);

    try {
        await updateDocumentNonBlocking(userRef, {
            favoriteLecturers: isFavorite ? arrayRemove(lecturerId) : arrayUnion(lecturerId)
        });
        toast({ title: isFavorite ? 'Lecturer Unfavorited' : 'Lecturer Favorited' });
    } catch (error) {
        toast({ title: 'Error', description: 'Could not update favorites.', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!user || !profile || !selectedCourse || !selectedLecturer || !selectedDate || !selectedTime || !receiptFile || !schedules) return;

    setLoading(true);
    try {
      const basePrice = classType === 'online' ? selectedCourse.priceOnline : selectedCourse.pricePhysical;
      const addHourPrice = classType === 'online' ? selectedCourse.priceOnlineAddHour : selectedCourse.pricePhysicalAddHour;
      const finalPrice = duration === 2 ? basePrice + addHourPrice : basePrice;

      // Provisional Booking: Block slots immediately
      const scheduleForDate = schedules.find(s => s.date === format(selectedDate, 'yyyy-MM-dd'));
      const allTimeSlotsForDay = scheduleForDate?.timeSlots || [];
      const startTimeIndex = allTimeSlotsForDay.indexOf(selectedTime);
      const slotsToBook = [];
      if (startTimeIndex !== -1) {
        for (let i = 0; i < duration * 2; i++) {
            slotsToBook.push(allTimeSlotsForDay[startTimeIndex + i]);
        }
      }

      if (slotsToBook.length !== duration * 2) {
        throw new Error("Could not determine slots to block.");
      }

      const scheduleId = `${selectedCourse.id}_${selectedLecturer.id}_${format(selectedDate, 'yyyy-MM-dd')}`;
      const scheduleRef = doc(firestore, 'schedules', scheduleId);
      await updateDoc(scheduleRef, { bookedSlots: arrayUnion(...slotsToBook) });

      // Create Booking Document
      const bookingData = {
        userId: user.uid,
        userName: profile?.name || user.displayName || user.email?.split('@')[0] || 'Student',
        userEmail: user.email,
        userPhoneNumber: profile?.phoneNumber || '',
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        lecturerId: selectedLecturer.id,
        lecturerName: selectedLecturer.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        duration: duration,
        classType,
        paymentStatus: 'pending',
        bookingStatus: 'payment_pending',
        createdAt: Timestamp.now(),
        price: finalPrice
      };

      const docRef = await addDocumentNonBlocking(collection(firestore, 'bookings'), bookingData);
      
      if (!docRef) throw new Error("Failed to create booking reference");
      
      const bookingId = docRef.id;
      let downloadUrl = '';

      if (storage) {
        const fileExtension = receiptFile.name.split('.').pop();
        const storageRef = ref(storage, `payments/${user.uid}/${bookingId}.${fileExtension}`);
        await uploadBytes(storageRef, receiptFile);
        downloadUrl = await getDownloadURL(storageRef);

        await updateDoc(doc(firestore, 'bookings', bookingId), {
            receiptUrl: downloadUrl,
            receiptType: receiptFile.type
        });
      }
      
      // Send Email Notification
      try {
          await fetch('/api/send-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...bookingData, bookingId, receiptUrl: downloadUrl })
          });
      } catch (error) {
          console.error('Failed to send email notification', error);
      }
      
      toast({ title: 'Booking submitted successfully!', description: 'Your booking is pending confirmation.' });
      router.push(`/dashboard/bookings/${bookingId}`);

    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error creating booking', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  const currentPrice = useMemo(() => {
    if (!selectedCourse) return 0;
    const basePrice = classType === 'online' ? selectedCourse.priceOnline : selectedCourse.pricePhysical;
    const addHourPrice = classType === 'online' ? selectedCourse.priceOnlineAddHour : selectedCourse.pricePhysicalAddHour;
    return duration === 2 ? basePrice + addHourPrice : basePrice;
  }, [selectedCourse, classType, duration]);

  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-secondary -z-10" />
          {STEPS.map((s) => (
            <div key={s.id} className={cn(
              "flex flex-col items-center gap-2 bg-background px-2",
              step >= s.id ? "text-primary" : "text-muted-foreground"
            )}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold text-sm transition-colors",
                step >= s.id ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground bg-background"
              )}>
                {step > s.id ? <CheckCircle className="w-5 h-5" /> : s.id}
              </div>
              <span className="text-xs font-medium hidden sm:block">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="min-h-[400px]">
        <CardContent className="p-6">
          
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Select Your Course</h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {courses?.map(course => (
                  <div
                    key={course.id}
                    onClick={() => setSelectedCourse(course)}
                    className={cn(
                      "cursor-pointer rounded-xl border-2 p-6 transition-all hover:border-primary/50",
                      selectedCourse?.id === course.id ? "border-primary bg-primary/5" : "border-border"
                    )}
                  >
                    <h3 className="font-bold text-lg mb-2">{course.name}</h3>
                    <p className="text-muted-foreground">from LKR {course.priceOnline?.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Select Class Type</h2>
              <RadioGroup value={classType} onValueChange={(v) => setClassType(v as 'online' | 'physical')} className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                <div>
                  <RadioGroupItem value="online" id="online" className="peer sr-only" />
                  <Label
                    htmlFor="online"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
                  >
                    <span className="text-3xl mb-2">💻</span>
                    <span className="font-semibold">Online Class</span>
                    <span className="font-bold text-primary">LKR {selectedCourse?.priceOnline.toLocaleString()}</span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="physical" id="physical" className="peer sr-only" disabled={settings?.physicalClassesEnabled === false} />
                  <Label
                    htmlFor="physical"
                    className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4",
                        "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                        settings?.physicalClassesEnabled === false 
                            ? "cursor-not-allowed opacity-50" 
                            : "cursor-pointer hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <span className="text-3xl mb-2">🏫</span>
                    <span className="font-semibold">Physical Class</span>
                    <span className="font-bold text-primary">LKR {selectedCourse?.pricePhysical.toLocaleString()}</span>
                    {settings?.physicalClassesEnabled === false && <span className="text-xs text-destructive mt-1">(Currently unavailable)</span>}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-center">Select Lecturer</h2>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="favorites-only">Show Favorites Only</Label>
                        <Switch id="favorites-only" checked={showFavorites} onCheckedChange={setShowFavorites} />
                    </div>
                </div>
              {availableLecturers.length === 0 ? (
                <p className="text-center text-muted-foreground">No lecturers available for this course{showFavorites && ' or filter'}.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {availableLecturers.map(lecturer => (
                    <div
                      key={lecturer.id}
                      onClick={() => setSelectedLecturer(lecturer)}
                      className={cn(
                        "flex items-center gap-4 cursor-pointer rounded-xl border-2 p-4 transition-all hover:border-primary/50 relative",
                        selectedLecturer?.id === lecturer.id ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                       <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={(e) => handleToggleFavorite(lecturer.id, e)}>
                         <Star className={cn("w-5 h-5 text-gray-300", profile?.favoriteLecturers?.includes(lecturer.id) && "fill-yellow-400 text-yellow-400")} />
                       </Button>
                      <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                        <User className="h-6 w-6" />
                      </div>
                      <div>
                        <h3 className="font-bold">{lecturer.name}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Select Date & Time</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                       setSelectedDate(date);
                       setSelectedTime('');
                    }}
                    disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today || isDateFullyBooked(date);
                    }}
                    initialFocus
                    className="rounded-md border shadow"
                  />
                </div>
                <div>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">Available Start Times</h3>
                        <div className="flex items-center space-x-2">
                            <Label htmlFor="duration-switch">2-hour class</Label>
                            <Switch id="duration-switch" checked={duration === 2} onCheckedChange={(checked) => setDuration(checked ? 2 : 1)} />
                        </div>
                    </div>
                    <Alert className="mb-4 bg-green-50 border-green-200 text-green-800">
                        <Clock className="h-4 w-4 text-green-800" />
                        <AlertDescription>
                            Classes are 1 hour by default. For a 2-hour session, use the switch above. The system will book two consecutive hours from your selected start time.
                        </AlertDescription>
                    </Alert>
                    <Alert className="mb-4 bg-blue-50 border-blue-200">
                        <Info className="h-4 w-4 text-blue-700" />
                        <AlertDescription className="text-blue-700">
                            All times shown are in Sri Lanka Time (LKT, UTC+5:30).
                        </AlertDescription>
                    </Alert>
                  {!selectedDate ? (
                    <p className="text-muted-foreground">Please select a date first.</p>
                  ) : availableTimeSlots.length === 0 ? (
                    <p className="text-red-500">No available {duration}-hour slots for this date.</p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableTimeSlots.map(time => (
                        <Button
                          key={time}
                          variant={selectedTime === time ? "default" : "outline"}
                          onClick={() => setSelectedTime(time)}
                          className="w-full"
                        >
                          {time}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
             <div className="space-y-6 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-center">Payment Details</h2>
                
                <Card className="bg-secondary/10 border-primary/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold">Course:</span>
                      <span>{selectedCourse?.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold">Class Type:</span>
                      <span className="capitalize">{classType} Class</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold">Lecturer:</span>
                      <span>{selectedLecturer?.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold">Date & Time:</span>
                      <span>{selectedDate ? format(selectedDate, 'PPP') : ''} @ {selectedTime} (LKT)</span>
                    </div>
                     <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold">Duration:</span>
                      <span>{duration} Hour(s)</span>
                    </div>
                    <div className="flex justify-between items-center text-xl font-bold pt-2">
                      <span>Total Amount:</span>
                      <span className="text-primary">LKR {currentPrice.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
                    <h4 className="font-bold flex items-center gap-2"><AlertTriangle className="w-5 h-5"/>Important Payment Instructions</h4>
                    <ul className="list-disc pl-5 mt-2 text-sm space-y-1">
                      <li>Use your <span className="font-bold">Full Name</span> as the payment reference.</li>
                      <li>Upload a <span className="font-bold">clear, full-sized screenshot</span> of the receipt.</li>
                      <li>Unclear receipts may be rejected, requiring you to re-upload.</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <h4 className="font-semibold text-blue-900 mb-2 flex items-center"><CreditCard className="w-4 h-4 mr-2"/> Bank Transfer Details</h4>
                    <p className="text-sm text-blue-800 whitespace-pre-wrap">{settings?.bankDetails}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt">Upload Payment Receipt</Label>
                    <Input id="receipt" type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
                  </div>
                </div>
             </div>
          )}

          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button variant="outline" onClick={handleBack} disabled={step === 1 || loading}>
              <ChevronLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            
            {step < 5 ? (
              <Button onClick={handleNext} disabled={
                (step === 1 && !selectedCourse) ||
                (step === 2 && !classType) ||
                (step === 3 && !selectedLecturer) ||
                (step === 4 && (!selectedDate || !selectedTime))
              }>
                Continue <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!receiptFile || loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Submit Booking
              </Button>
            )}
          </div>

        </CardContent>
      </Card>
    </div>
  );
}
