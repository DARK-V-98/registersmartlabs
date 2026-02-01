
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useStorage, setDocumentNonBlocking, useDoc } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, query, where, orderBy, getDocs, Timestamp, doc, setDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, CreditCard, ChevronLeft, ChevronRight, User, Star, AlertTriangle, Info, Clock, GraduationCap } from 'lucide-react';
import { format } from 'date-fns';
import { Course, Lecturer, Schedule, AdminSettings, Booking } from '@/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getAvailableSlots, getSlotsForBooking } from '@/lib/availability';

const STEPS = [
  { id: 1, title: 'Select Lecturer' },
  { id: 2, title: 'Date & Time' },
  { id: 3, title: 'Course & Type' },
  { id: 4, title: 'Payment' },
];

export default function BookingPage() {
  const { user, profile, isLoading: isProfileLoading } = useUserProfile();
  const firestore = useFirestore();
  const storage = useStorage();
  const { toast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Selection State
  const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState(1); // 1 or 2 hours
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [classType, setClassType] = useState<'online' | 'physical'>('online');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);

  // Data Fetching
  const { data: allCourses } = useCollection<Course>(
    useMemoFirebase(() => firestore ? query(collection(firestore, 'courses'), where('status', '==', 'active')) : null, [firestore])
  );

  const { data: allLecturers } = useCollection<Lecturer>(
    useMemoFirebase(() => firestore ? query(collection(firestore, 'lecturers'), orderBy('name')) : null, [firestore])
  );

  const { data: settings } = useDoc<AdminSettings>(
    useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'admin') : null, [firestore])
  );
  
  const getCurrencySymbol = (currencyCode: string | undefined): string => {
      if (!currencyCode || !settings?.currencies) return currencyCode || '';
      const currency = settings.currencies.find(c => c.code === currencyCode);
      return currency?.symbol || currencyCode;
  }
  
  useEffect(() => {
      if (settings?.physicalClassesEnabled === false && classType === 'physical') {
          setClassType('online');
      }
  }, [settings, classType]);

  const { data: schedules } = useCollection<Schedule>(
    useMemoFirebase(() => {
        if (!firestore || !selectedLecturer) return null;
        return query(collection(firestore, 'schedules'), where('lecturerId', '==', selectedLecturer.id));
    }, [firestore, selectedLecturer])
  );
  
    useEffect(() => {
        if (!selectedLecturer) return;
        
        const isOnlineDisabled = selectedLecturer.onlineClassEnabled === false;
        const isPhysicalDisabled = selectedLecturer.physicalClassEnabled === false || settings?.physicalClassesEnabled === false;

        if (classType === 'online' && isOnlineDisabled && !isPhysicalDisabled) {
            setClassType('physical');
        } else if (classType === 'physical' && isPhysicalDisabled && !isOnlineDisabled) {
            setClassType('online');
        }
    }, [selectedLecturer, settings, classType]);


  // Clear dependent states when primary selections change
  useEffect(() => {
    setSelectedDate(undefined);
    setSelectedTime('');
    setSelectedCourse(null);
  }, [selectedLecturer]);

  useEffect(() => {
    setSelectedTime('');
  }, [selectedDate, duration]);

  const isDateFullyBooked = (date: Date) => {
      const { hasAny } = getAvailableSlots(date, schedules);
      return !hasAny;
  }

  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !schedules) return [];
    const { oneHour, twoHour } = getAvailableSlots(date, schedules);
    return duration === 1 ? oneHour : twoHour;
  }, [selectedDate, schedules, duration]);

  const handleNext = () => {
    if (step === 1 && !selectedLecturer) return;
    if (step === 2 && (!selectedDate || !selectedTime)) return;
    if (step === 3 && !selectedCourse) return;
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
        await setDoc(userRef, {
            favoriteLecturers: isFavorite ? arrayRemove(lecturerId) : arrayUnion(lecturerId)
        }, { merge: true });
        toast({ title: isFavorite ? 'Lecturer Unfavorited' : 'Lecturer Favorited' });
    } catch (error) {
        toast({ title: 'Error', description: 'Could not update favorites.', variant: 'destructive' });
    }
  };

  const currentPrice = useMemo(() => {
    if (isProfileLoading || !profile) return null; // Return null during load
    const userCurrency = profile.currency || 'LKR';
    if (!selectedLecturer || !selectedCourse || !userCurrency) return 0;
    
    const pricing = selectedLecturer.pricing?.[selectedCourse.id]?.[userCurrency];
    if (!pricing) return 0;

    const basePrice = classType === 'online' ? pricing.priceOnline : pricing.pricePhysical;
    const addHourPrice = classType === 'online' ? pricing.priceOnlineAddHour : pricing.pricePhysicalAddHour;
    return duration === 2 && addHourPrice ? (basePrice || 0) + (addHourPrice || 0) : (basePrice || 0);
  }, [selectedLecturer, selectedCourse, classType, duration, profile, isProfileLoading]);

  const handleSubmit = async () => {
    if (!user || !profile || !selectedCourse || !selectedLecturer || !selectedDate || !selectedTime || !receiptFile) return;

    setLoading(true);
    try {
      // Provisional Booking: Block slots immediately
      const slotsToBook = getSlotsForBooking({
        time: selectedTime,
        duration: duration
      } as Booking);

      if (slotsToBook.length !== (duration === 1 ? 2 : 4)) {
        throw new Error("Could not determine all slots to block. The time may have just been booked.");
      }

      const scheduleId = `${selectedLecturer.id}_${format(selectedDate, 'yyyy-MM-dd')}`;
      const scheduleRef = doc(firestore, 'schedules', scheduleId);
      await setDoc(scheduleRef, { bookedSlots: arrayUnion(...slotsToBook) }, { merge: true });

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
        price: currentPrice,
        currency: profile.currency || 'LKR'
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

        setDocumentNonBlocking(doc(firestore, 'bookings', bookingId), {
            receiptUrl: downloadUrl,
            receiptType: receiptFile.type
        }, { merge: true });
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

  if (isProfileLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const isOnlineDisabled = selectedLecturer?.onlineClassEnabled === false;
  const isPhysicalDisabled = selectedLecturer?.physicalClassEnabled === false || settings?.physicalClassesEnabled === false;

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
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-center">Select Your Lecturer</h2>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="favorites-only">Show Favorites Only</Label>
                        <Switch id="favorites-only" checked={showFavorites} onCheckedChange={setShowFavorites} />
                    </div>
                </div>
              {(allLecturers || []).length === 0 ? (
                <p className="text-center text-muted-foreground">No lecturers available at the moment.</p>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {(showFavorites ? (allLecturers || []).filter(l => profile?.favoriteLecturers?.includes(l.id)) : allLecturers)?.map(lecturer => (
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
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={lecturer.imageUrl} alt={lecturer.name} />
                        <AvatarFallback>{lecturer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-bold">{lecturer.name}</h3>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Select Date & Available Start Time</h2>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="flex justify-center">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today || isDateFullyBooked(date) || (settings?.disabledDates || []).includes(format(date, 'yyyy-MM-dd'));
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
                            The default class duration is 1 hour. If you need a 2-hour session, please use the switch above.
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
                    <p className="text-red-500">No available {duration}-hour slots for this date. Please try another date or duration.</p>
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

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-center">Select Course & Class Type</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(selectedLecturer?.courses || []).map(courseId => {
                  const course = allCourses?.find(c => c.id === courseId);
                  if (!course) return null;

                  const priceInfo = selectedLecturer?.pricing?.[course.id]?.[profile?.currency || 'LKR'];
                  let startingPrice: number | null = null;
                  if (priceInfo) {
                      const availablePrices: number[] = [];
                      if (selectedLecturer.onlineClassEnabled !== false && priceInfo.priceOnline > 0) {
                          availablePrices.push(priceInfo.priceOnline);
                      }
                      if (selectedLecturer.physicalClassEnabled !== false && settings?.physicalClassesEnabled !== false && priceInfo.pricePhysical > 0) {
                          availablePrices.push(priceInfo.pricePhysical);
                      }
                      if (availablePrices.length > 0) {
                          startingPrice = Math.min(...availablePrices);
                      }
                  }

                  return (
                    <Card
                      key={course.id}
                      onClick={() => setSelectedCourse(course)}
                      className={cn(
                        "cursor-pointer transition-all hover:border-primary/50 flex flex-col",
                        selectedCourse?.id === course.id ? "border-primary bg-primary/5 ring-2 ring-primary" : "border-border"
                      )}
                    >
                      <CardHeader>
                        <GraduationCap className="w-8 h-8 text-primary mb-2" />
                        <CardTitle>{course.name}</CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow">
                         {startingPrice !== null ? (
                            <p className="text-sm text-muted-foreground">
                                Starts from <span className="font-bold text-foreground">{getCurrencySymbol(profile?.currency)} {startingPrice.toLocaleString()}</span>
                            </p>
                          ) : (
                             <p className="text-sm text-muted-foreground">Pricing not set</p>
                          )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {selectedCourse && (
                <div className="pt-6 border-t">
                  <h3 className="text-lg font-bold text-center mb-4">Select Class Type</h3>
                  <RadioGroup value={classType} onValueChange={(v) => setClassType(v as 'online' | 'physical')} className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <div>
                      <RadioGroupItem value="online" id="online" className="peer sr-only" disabled={isOnlineDisabled} />
                      <Label htmlFor="online" className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4",
                        !isOnlineDisabled && "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                        "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                        isOnlineDisabled && "cursor-not-allowed opacity-50"
                      )}>
                        <span className="text-3xl mb-2">💻</span>
                        <span className="font-semibold">Online Class</span>
                        
                        {(selectedLecturer?.pricing?.[selectedCourse.id]?.[profile?.currency || 'LKR']?.priceOnline) ? (
                            <span className="font-bold text-primary">{getCurrencySymbol(profile?.currency)} {(selectedLecturer?.pricing?.[selectedCourse.id]?.[profile?.currency || 'LKR']?.priceOnline || 0).toLocaleString()}</span>
                        ) : (
                            <span className="font-bold text-muted-foreground">Not set</span>
                        )}

                        {isOnlineDisabled && <span className="text-xs text-destructive mt-1">(Unavailable for this lecturer)</span>}
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="physical" id="physical" className="peer sr-only" disabled={isPhysicalDisabled} />
                      <Label htmlFor="physical" className={cn(
                        "flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4",
                        !isPhysicalDisabled && "cursor-pointer hover:bg-accent hover:text-accent-foreground",
                        "peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary",
                        isPhysicalDisabled && "cursor-not-allowed opacity-50"
                      )}>
                        <span className="text-3xl mb-2">🏫</span>
                        <span className="font-semibold">Physical Class</span>

                         {(selectedLecturer?.pricing?.[selectedCourse.id]?.[profile?.currency || 'LKR']?.pricePhysical) ? (
                            <span className="font-bold text-primary">{getCurrencySymbol(profile?.currency)} {(selectedLecturer?.pricing?.[selectedCourse.id]?.[profile?.currency || 'LKR']?.pricePhysical || 0).toLocaleString()}</span>
                        ) : (
                            <span className="font-bold text-muted-foreground">Not set</span>
                        )}

                        {selectedLecturer?.physicalClassEnabled === false && <span className="text-xs text-destructive mt-1">(Unavailable for this lecturer)</span>}
                        {settings?.physicalClassesEnabled === false && selectedLecturer?.physicalClassEnabled !== false && <span className="text-xs text-destructive mt-1">(Globally unavailable)</span>}
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
             <div className="space-y-6 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-center">Payment Details</h2>
                
                <Card className="bg-secondary/10 border-primary/20">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold">Lecturer:</span>
                      <span>{selectedLecturer?.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold">Course:</span>
                      <span>{selectedCourse?.name}</span>
                    </div>
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-semibold">Class Type:</span>
                      <span className="capitalize">{classType} Class</span>
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
                      {currentPrice !== null ? (
                        <span className="text-primary">{getCurrencySymbol(profile?.currency)} {currentPrice.toLocaleString()}</span>
                      ) : (
                        <Loader2 className="h-5 w-5 animate-spin"/>
                      )}
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
            
            {step < 4 ? (
              <Button onClick={handleNext} disabled={
                (step === 1 && !selectedLecturer) ||
                (step === 2 && (!selectedDate || !selectedTime)) ||
                (step === 3 && !selectedCourse)
              }>
                Continue <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={!receiptFile || loading || currentPrice === null}>
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
