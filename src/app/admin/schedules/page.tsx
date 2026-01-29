
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Course, Lecturer, Schedule } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Trash, Calendar as CalendarIcon, Edit } from 'lucide-react';
import { format, eachDayOfInterval, getDay } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DateRange } from 'react-day-picker';
import { useUserProfile } from '@/hooks/useUserProfile';
import { logActivity } from '@/lib/logger';

const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
];

const WEEKDAYS = [
  { id: 1, label: 'Mon' }, { id: 2, label: 'Tue' }, { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' }, { id: 5, label: 'Fri' }, { id: 6, label: 'Sat' },
  { id: 0, label: 'Sun' }
];

export default function SchedulesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const { profile: adminProfile } = useUserProfile();
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);

  // Shared state
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedLecturer, setSelectedLecturer] = useState<string>('');

  // Single Day Editor State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [singleDaySlots, setSingleDaySlots] = useState<string[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);

  // Bulk Scheduler State
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([1,2,3,4,5]);
  const [bulkTimeSlots, setBulkTimeSlots] = useState<string[]>([]);

  // --- DATA FETCHING ---
  const { data: courses } = useCollection<Course>(
    query(collection(firestore, 'courses'), orderBy('name'))
  );

  const { data: allLecturers } = useCollection<Lecturer>(
    query(collection(firestore, 'lecturers'), orderBy('name'))
  );

  const availableLecturers = useMemo(() => {
    if (!selectedCourse || !allLecturers) return [];
    return allLecturers.filter(l => l.courses?.includes(selectedCourse));
  }, [selectedCourse, allLecturers]);


  // --- SINGLE DAY EDITOR LOGIC ---
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!firestore || !selectedCourse || !selectedLecturer || !selectedDate) {
        setCurrentSchedule(null);
        setSingleDaySlots([]);
        return;
      }
      setIsScheduleLoading(true);
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const scheduleId = `${selectedCourse}_${selectedLecturer}_${dateString}`;
      const scheduleRef = doc(firestore, 'schedules', scheduleId);
      
      try {
        const docSnap = await getDoc(scheduleRef);
        if (docSnap.exists()) {
          const scheduleData = docSnap.data() as Schedule;
          setCurrentSchedule(scheduleData);
          setSingleDaySlots(scheduleData.timeSlots || []);
        } else {
          setCurrentSchedule(null);
          setSingleDaySlots([]);
        }
      } catch (error) {
        console.error("Error fetching schedule:", error);
        toast({ title: 'Error loading schedule', variant: 'destructive' });
      } finally {
        setIsScheduleLoading(false);
      }
    };

    fetchSchedule();
  }, [selectedCourse, selectedLecturer, selectedDate, firestore, toast]);

  const toggleSingleDaySlot = (time: string) => {
    setSingleDaySlots(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time].sort());
  };

  const handleSaveSingleDay = async () => {
    if (!firestore || !selectedCourse || !selectedLecturer || !selectedDate || !adminProfile) {
      toast({ title: 'Please select all fields before saving', variant: 'destructive' });
      return;
    }
    if (hasBookings) {
      toast({ title: "Update Failed", description: "This schedule has bookings and cannot be changed.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const scheduleId = `${selectedCourse}_${selectedLecturer}_${dateString}`;
      const scheduleRef = doc(firestore, 'schedules', scheduleId);
      const newData: Partial<Schedule> & { updatedAt: Date } = {
        id: scheduleId, courseId: selectedCourse, lecturerId: selectedLecturer,
        date: dateString, timeSlots: singleDaySlots, updatedAt: new Date(),
      };
      if (!currentSchedule) newData.bookedSlots = [];
      await setDoc(scheduleRef, newData, { merge: true });

      logActivity(firestore, {
        actorId: adminProfile.id,
        actorName: adminProfile.name || 'Admin',
        actorEmail: adminProfile.email,
        action: 'schedule.update.single',
        entityType: 'schedule',
        entityId: scheduleId,
        details: { date: dateString, slotsCount: singleDaySlots.length },
      });

      toast({ title: "Schedule Saved", description: `Availability for ${dateString} has been updated.` });
      setCurrentSchedule(prev => ({ ...prev, ...newData } as Schedule));
    } catch (error) {
      console.error(error);
      toast({ title: 'Error saving schedule', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const hasBookings = currentSchedule?.bookedSlots && currentSchedule.bookedSlots.length > 0;


  // --- BULK SCHEDULER LOGIC ---
  const toggleWeekday = (weekday: number) => {
    setSelectedWeekdays(prev => prev.includes(weekday) ? prev.filter(d => d !== weekday) : [...prev, weekday]);
  }

  const toggleBulkSlot = (time: string) => {
    setBulkTimeSlots(prev => prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time].sort());
  };

  const handleBulkSave = async () => {
    if (!firestore || !selectedCourse || !selectedLecturer || !dateRange?.from || !adminProfile) {
      toast({ title: 'Missing Information', description: 'Please select a course, lecturer, and date range.', variant: 'destructive' });
      return;
    }
    const { from, to } = dateRange;
    const finalTo = to || from; // If no 'to' date, use 'from' for a single day
    
    setIsLoading(true);
    const batch = writeBatch(firestore);
    const daysToSchedule = eachDayOfInterval({ start: from, end: finalTo });
    const skippedDays: string[] = [];

    try {
      for (const day of daysToSchedule) {
        if (selectedWeekdays.includes(getDay(day))) {
          const dateString = format(day, 'yyyy-MM-dd');
          const scheduleId = `${selectedCourse}_${selectedLecturer}_${dateString}`;
          const scheduleRef = doc(firestore, 'schedules', scheduleId);

          const docSnap = await getDoc(scheduleRef);
          if (docSnap.exists() && docSnap.data().bookedSlots?.length > 0) {
            skippedDays.push(dateString);
            continue; // Skip this day as it has bookings
          }

          const newData = {
            id: scheduleId, courseId: selectedCourse, lecturerId: selectedLecturer, date: dateString,
            timeSlots: bulkTimeSlots, updatedAt: new Date(),
            bookedSlots: docSnap.exists() ? (docSnap.data().bookedSlots || []) : [],
          };
          batch.set(scheduleRef, newData, { merge: true });
        }
      }
      await batch.commit();

      logActivity(firestore, {
        actorId: adminProfile.id,
        actorName: adminProfile.name || 'Admin',
        actorEmail: adminProfile.email,
        action: 'schedule.update.bulk',
        entityType: 'schedule',
        entityId: 'multiple',
        details: {
          courseId: selectedCourse,
          lecturerId: selectedLecturer,
          range: `${format(from, 'yyyy-MM-dd')} to ${format(finalTo, 'yyyy-MM-dd')}`,
        },
      });

      toast({ title: 'Bulk Schedule Applied', description: 'Availability has been updated for the selected range.' });
      if (skippedDays.length > 0) {
        toast({
          title: 'Some Days Skipped',
          description: `Could not update ${skippedDays.join(', ')} because they have existing bookings.`,
          variant: 'destructive',
          duration: 9000,
        });
      }
    } catch (error) {
      console.error(error);
      toast({ title: 'Error applying bulk schedule', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>

       <Card>
          <CardHeader>
            <CardTitle>1. Select Context</CardTitle>
            <CardDescription>Choose the course and lecturer you want to manage schedules for.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select value={selectedCourse} onValueChange={(val) => {
                    setSelectedCourse(val);
                    setSelectedLecturer(''); // Reset lecturer on course change
                }}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courses?.map(course => <SelectItem key={course.id} value={course.id}>{course.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Lecturer</Label>
                <Select value={selectedLecturer} onValueChange={setSelectedLecturer} disabled={!selectedCourse}>
                  <SelectTrigger><SelectValue placeholder={selectedCourse ? "Select lecturer" : "Select a course first"} /></SelectTrigger>
                  <SelectContent>
                    {availableLecturers.map(lecturer => <SelectItem key={lecturer.id} value={lecturer.id}>{lecturer.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
          </CardContent>
        </Card>

      <Tabs defaultValue="single" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single"><Edit className="mr-2 h-4 w-4"/>Edit Single Day</TabsTrigger>
          <TabsTrigger value="bulk"><CalendarIcon className="mr-2 h-4 w-4"/>Bulk Scheduler</TabsTrigger>
        </TabsList>
        
        {/* Single Day Editor Tab */}
        <TabsContent value="single">
          <Card className="mt-4">
              <CardHeader>
                <CardTitle>2. Edit Single Day Availability</CardTitle>
                {!selectedCourse || !selectedLecturer ? <p className="text-sm text-muted-foreground pt-2">Please select a course and lecturer first.</p> : null}
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <div className="flex justify-center">
                  <Calendar
                      mode="single" selected={selectedDate} onSelect={setSelectedDate}
                      disabled={!selectedCourse || !selectedLecturer || ((date) => date < new Date(new Date().setHours(0,0,0,0)))}
                      initialFocus className="rounded-md border shadow-sm"
                    />
                </div>
                <div className="space-y-4">
                  {isScheduleLoading ? (
                    <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
                  ) : hasBookings ? (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>This schedule has active bookings and cannot be modified. To change availability, all existing bookings for this day must first be cancelled.</AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="flex justify-between items-center"><Label className="font-semibold">{currentSchedule ? 'Edit Available Start Times' : 'Set Available Start Times'}</Label>
                        <Button variant="ghost" size="sm" onClick={() => setSingleDaySlots([])} disabled={isLoading || hasBookings}><Trash className="w-4 h-4 mr-2"/> Clear All</Button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-2">
                          {TIME_SLOTS.map(time => (
                          <Button key={time} variant={singleDaySlots.includes(time) ? "default" : "outline"} className="w-full" onClick={() => toggleSingleDaySlot(time)} disabled={isLoading}>
                              {time}
                          </Button>
                          ))}
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
              <CardContent>
                  <Button className="w-full mt-4" onClick={handleSaveSingleDay} disabled={isLoading || isScheduleLoading || hasBookings || !selectedCourse || !selectedLecturer || !selectedDate}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Availability for {selectedDate ? format(selectedDate, 'MMM d') : ''}
                  </Button>
              </CardContent>
          </Card>
        </TabsContent>

        {/* Bulk Scheduler Tab */}
        <TabsContent value="bulk">
           <Card className="mt-4">
              <CardHeader>
                <CardTitle>2. Bulk Schedule Availability</CardTitle>
                 {!selectedCourse || !selectedLecturer ? <p className="text-sm text-muted-foreground pt-2">Please select a course and lecturer first.</p> : null}
              </CardHeader>
              <CardContent className="grid gap-8">
                  {/* Date Range & Weekday Picker */}
                  <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label className="font-semibold mb-2 block text-center">Select Date Range</Label>
                        <div className="flex justify-center">
                            <Calendar mode="range" selected={dateRange} onSelect={setDateRange} disabled={!selectedCourse || !selectedLecturer} className="rounded-md border shadow-sm" />
                        </div>
                      </div>
                      <div>
                        <Label className="font-semibold mb-2 block text-center">Apply to Weekdays</Label>
                        <div className="flex justify-center flex-wrap gap-2">
                          {WEEKDAYS.map(day => (
                            <div key={day.id} className="flex items-center space-x-2">
                                <Checkbox id={`day-${day.id}`} checked={selectedWeekdays.includes(day.id)} onCheckedChange={() => toggleWeekday(day.id)} />
                                <Label htmlFor={`day-${day.id}`} className="cursor-pointer">{day.label}</Label>
                            </div>
                          ))}
                        </div>
                      </div>
                  </div>

                  {/* Time Slot Picker for Bulk */}
                  <div>
                    <div className="flex justify-between items-center mb-2">
                        <Label className="font-semibold">Select Available Start Times for the Range</Label>
                        <Button variant="ghost" size="sm" onClick={() => setBulkTimeSlots([])} disabled={isLoading}><Trash className="w-4 h-4 mr-2"/> Clear All</Button>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 max-h-60 overflow-y-auto pr-2 border rounded-md p-4">
                      {TIME_SLOTS.map(time => (
                        <Button key={time} variant={bulkTimeSlots.includes(time) ? "default" : "outline"} onClick={() => toggleBulkSlot(time)} disabled={isLoading}>{time}</Button>
                      ))}
                    </div>
                  </div>
              </CardContent>
               <CardContent>
                  <Button className="w-full mt-4" onClick={handleBulkSave} disabled={isLoading || !dateRange || !selectedCourse || !selectedLecturer}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Apply Bulk Schedule
                  </Button>
                  <Alert className="mt-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                        Note: This will overwrite existing schedules for the selected days, but will automatically skip any days that already have student bookings.
                    </AlertDescription>
                  </Alert>
               </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
