
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, useDoc } from '@/firebase';
import { collection, query, where, orderBy, Timestamp, doc, setDoc, arrayUnion } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, ChevronLeft, User, Search, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Course, Lecturer, Schedule, UserProfile, AdminSettings } from '@/types';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUserProfile } from '@/hooks/useUserProfile';
import { logActivity } from '@/lib/logger';
import { getAvailableSlots, getSlotsForBooking } from '@/lib/availability';

export default function ManualBookingPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  const { profile: adminProfile } = useUserProfile();

  const [loading, setLoading] = useState(false);
  const [openUserSearch, setOpenUserSearch] = useState(false);

  // Selection State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [classType, setClassType] = useState<'online' | 'physical'>('online');
  const [selectedLecturer, setSelectedLecturer] = useState<Lecturer | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [duration, setDuration] = useState(1);
  const [price, setPrice] = useState('');

  // Data Fetching
  const { data: courses, isLoading: coursesLoading } = useCollection<Course>(query(collection(firestore, 'courses'), where('status', '==', 'active')));
  const { data: users, isLoading: usersLoading } = useCollection<UserProfile>(query(collection(firestore, 'users')));
  const { data: allLecturers, isLoading: lecturersLoading } = useCollection<Lecturer>(query(collection(firestore, 'lecturers'), orderBy('name')));
  const { data: settings } = useDoc<AdminSettings>(
    useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'admin') : null, [firestore])
  );

  const { data: schedules } = useCollection<Schedule>(
    useMemoFirebase(() => {
        if (!firestore || !selectedLecturer) return null;
        return query(
          collection(firestore, 'schedules'),
          where('lecturerId', '==', selectedLecturer.id)
        );
      }, [firestore, selectedLecturer])
  );
  
  const availableLecturers = useMemo(() => {
    if (!selectedCourse || !allLecturers) return [];
    return allLecturers.filter(l => l.courses?.includes(selectedCourse.id));
  }, [selectedCourse, allLecturers]);
  
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate || !schedules) return [];
    const { oneHour, twoHour } = getAvailableSlots(selectedDate, schedules);
    return duration === 1 ? oneHour : twoHour;
  }, [selectedDate, schedules, duration]);

  useEffect(() => {
      if (!selectedCourse || !selectedLecturer || !selectedUser?.currency) {
          setPrice('');
          return;
      }
      const pricing = selectedLecturer.pricing?.[selectedCourse.id]?.[selectedUser.currency];
      if (!pricing) {
        setPrice('0');
        return;
      }
      const basePrice = classType === 'online' ? pricing.priceOnline : pricing.pricePhysical;
      const addHourPrice = classType === 'online' ? pricing.priceOnlineAddHour : pricing.pricePhysicalAddHour;
      const finalPrice = duration === 2 && addHourPrice ? (basePrice || 0) + (addHourPrice || 0) : (basePrice || 0);
      setPrice(finalPrice.toString());
  }, [selectedUser, selectedCourse, selectedLecturer, classType, duration]);
  
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

  // Clear dependent fields when a primary selection changes
  useEffect(() => {
      setSelectedTime('');
  }, [duration, selectedDate]);
  
  useEffect(() => {
      setSelectedLecturer(null);
      setSelectedDate(undefined);
      setSelectedTime('');
  }, [selectedCourse]);

  const handleSubmit = async () => {
    if (!selectedUser || !selectedCourse || !selectedLecturer || !selectedDate || !selectedTime || !price || !adminProfile) {
        toast({ title: 'Missing Fields', description: 'Please fill out all required fields.', variant: 'destructive' });
        return;
    }
    setLoading(true);
    try {
      const slotsToBook = getSlotsForBooking({
        time: selectedTime,
        duration: duration,
      } as Booking);

      if (slotsToBook.length !== (duration === 1 ? 2 : 4)) {
        throw new Error("Could not determine all slots to block. The time may have just been booked.");
      }
      
      const scheduleId = `${selectedLecturer.id}_${format(selectedDate, 'yyyy-MM-dd')}`;
      const scheduleRef = doc(firestore, 'schedules', scheduleId);
      await setDoc(scheduleRef, { bookedSlots: arrayUnion(...slotsToBook) }, { merge: true });

      const bookingData = {
        userId: selectedUser.id,
        userName: selectedUser.name,
        userEmail: selectedUser.email,
        userPhoneNumber: selectedUser.phoneNumber,
        courseId: selectedCourse.id,
        courseName: selectedCourse.name,
        lecturerId: selectedLecturer.id,
        lecturerName: selectedLecturer.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        duration: duration,
        classType,
        paymentStatus: 'paid', // Manually booked assumes paid
        bookingStatus: 'confirmed', // Manually booked is auto-confirmed
        createdAt: Timestamp.now(),
        price: parseFloat(price),
        currency: selectedUser.currency || 'LKR'
      };

      const docRef = await addDocumentNonBlocking(collection(firestore, 'bookings'), bookingData);
      
      if (docRef) {
        logActivity(firestore, {
          actorId: adminProfile.id,
          actorName: adminProfile.name || 'Admin',
          actorEmail: adminProfile.email,
          action: 'booking.create.manual',
          entityType: 'booking',
          entityId: docRef.id,
          details: { 
            studentName: selectedUser.name, 
            courseName: selectedCourse.name,
            date: bookingData.date,
          },
          targetUserId: selectedUser.id,
          targetUserName: selectedUser.name,
        });
      }

      toast({ title: 'Booking Created Successfully!', description: `${selectedUser.name}'s booking has been confirmed.` });
      router.push(`/admin/bookings`);

    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error creating booking', description: error.message, variant: 'destructive' });
      setLoading(false);
    }
  };

  const isOnlineDisabled = selectedLecturer?.onlineClassEnabled === false;
  const isPhysicalDisabled = selectedLecturer?.physicalClassEnabled === false || settings?.physicalClassesEnabled === false;

  return (
    <div className="space-y-6">
      <Button variant="outline" onClick={() => router.back()}>
        <ChevronLeft className="mr-2 h-4 w-4" /> Back to Bookings
      </Button>
      <Card>
        <CardHeader>
          <CardTitle>Create Manual Booking</CardTitle>
          <CardDescription>Manually add a booking for a student.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
                {/* Column 1 */}
                <div className="space-y-4">
                    {/* Student Select */}
                    <div className="space-y-2">
                        <Label>Select Student</Label>
                        <Popover open={openUserSearch} onOpenChange={setOpenUserSearch}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={openUserSearch} className="w-full justify-between">
                                    {selectedUser ? `${selectedUser.name} (${selectedUser.email})` : "Select student..."}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                <Command>
                                    <CommandInput placeholder="Search students..." className="h-9" />
                                    <CommandList>
                                        <CommandEmpty>No student found.</CommandEmpty>
                                        <CommandGroup>
                                            {users?.map(user => (
                                                <CommandItem key={user.id} onSelect={() => { setSelectedUser(user); setOpenUserSearch(false); }}>
                                                    {user.name} ({user.email})
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Course Select */}
                    <div className="space-y-2">
                        <Label>Select Course</Label>
                         <Select 
                            value={selectedCourse?.id}
                            onValueChange={(courseId) => {
                                const course = courses?.find(c => c.id === courseId);
                                setSelectedCourse(course || null);
                            }}>
                            <SelectTrigger>{selectedCourse ? selectedCourse.name : "Select course"}</SelectTrigger>
                            <SelectContent>
                                {courses?.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                         </Select>
                    </div>

                     {/* Lecturer Select */}
                    <div className="space-y-2">
                        <Label>Select Lecturer</Label>
                         <Select 
                            value={selectedLecturer?.id}
                            disabled={!selectedCourse} 
                            onValueChange={(lecturerId) => {
                                const lecturer = availableLecturers.find(l => l.id === lecturerId);
                                setSelectedLecturer(lecturer || null);
                                // Reset dependent selections
                                setSelectedDate(undefined);
                                setSelectedTime('');
                            }}>
                            <SelectTrigger>{selectedLecturer ? selectedLecturer.name : "Select lecturer"}</SelectTrigger>
                            <SelectContent>
                                {availableLecturers.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                            </SelectContent>
                         </Select>
                    </div>
                    
                    {/* Time Select */}
                    <div className="space-y-2">
                        <Label>Select Start Time</Label>
                         <Select 
                            value={selectedTime}
                            disabled={!selectedDate || availableTimeSlots.length === 0} 
                            onValueChange={setSelectedTime}
                          >
                            <SelectTrigger>{selectedTime || "Select a start time"}</SelectTrigger>
                            <SelectContent>
                                {availableTimeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                            </SelectContent>
                         </Select>
                    </div>
                    
                </div>
                {/* Column 2 */}
                <div className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        {/* Class Type */}
                        <div className="space-y-2">
                            <Label>Class Type</Label>
                            <RadioGroup value={classType} onValueChange={(v) => setClassType(v as 'online' | 'physical')} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="online" id="online" disabled={isOnlineDisabled} />
                                    <Label htmlFor="online" className={cn(isOnlineDisabled && "text-muted-foreground opacity-50")}>Online</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="physical" id="physical" disabled={isPhysicalDisabled} />
                                    <Label htmlFor="physical" className={cn(isPhysicalDisabled && "text-muted-foreground opacity-50")}>Physical</Label>
                                </div>
                            </RadioGroup>
                        </div>
                         {/* Duration */}
                        <div className="space-y-2">
                            <Label>Duration</Label>
                             <RadioGroup value={duration.toString()} onValueChange={(v) => setDuration(parseInt(v))} className="flex gap-4">
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="1" id="1h" />
                                    <Label htmlFor="1h">1 Hour</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <RadioGroupItem value="2" id="2h" />
                                    <Label htmlFor="2h">2 Hours</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    </div>
                     {/* Calendar */}
                    <div className="space-y-2">
                        <Label>Select Date</Label>
                        <Calendar 
                            mode="single" 
                            selected={selectedDate} 
                            onSelect={setSelectedDate} 
                            disabled={!selectedLecturer}
                            className="rounded-md border w-full justify-center" 
                        />
                    </div>
                     <div className="space-y-2">
                        <Label>Price Override ({selectedUser?.currency || 'LKR'})</Label>
                        <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Auto-calculated price" />
                     </div>
                </div>
            </div>

            <div className="flex justify-end pt-6 border-t">
                <Button onClick={handleSubmit} disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
                    Create Confirmed Booking
                </Button>
            </div>

        </CardContent>
      </Card>
    </div>
  );
}
