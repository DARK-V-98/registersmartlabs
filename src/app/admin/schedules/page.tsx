
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Course, Lecturer, Schedule } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertTriangle, Trash } from 'lucide-react';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '@/components/ui/alert';


const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
];

export default function SchedulesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedLecturer, setSelectedLecturer] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [currentSchedule, setCurrentSchedule] = useState<Schedule | null>(null);

  // Fetch Courses
  const { data: courses } = useCollection<Course>(
    query(collection(firestore, 'courses'), orderBy('name'))
  );

  // Fetch Lecturers
  const lecturersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'lecturers'), orderBy('name'));
  }, [firestore]);
  
  const { data: allLecturers } = useCollection<Lecturer>(lecturersQuery);

  // Filter Lecturers by Selected Course
  const availableLecturers = useMemo(() => {
    if (!selectedCourse || !allLecturers) return [];
    return allLecturers.filter(l => l.courses?.includes(selectedCourse));
  }, [selectedCourse, allLecturers]);

  // Effect to fetch the schedule for the selected context
  useEffect(() => {
    const fetchSchedule = async () => {
      if (!firestore || !selectedCourse || !selectedLecturer || !selectedDate) {
        setCurrentSchedule(null);
        setSelectedSlots([]);
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
          setSelectedSlots(scheduleData.timeSlots || []);
        } else {
          setCurrentSchedule(null);
          setSelectedSlots([]);
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

  const toggleSlot = (time: string) => {
    setSelectedSlots(prev => 
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time].sort()
    );
  };
  
  const handleSaveSchedule = async () => {
    if (!firestore || !selectedCourse || !selectedLecturer || !selectedDate) {
      toast({ title: 'Please select all fields before saving', variant: 'destructive' });
      return;
    }

    // Safety check: prevent saving if bookings exist
    if (currentSchedule?.bookedSlots && currentSchedule.bookedSlots.length > 0) {
      toast({ title: "Update Failed", description: "This schedule has bookings and cannot be changed.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const scheduleId = `${selectedCourse}_${selectedLecturer}_${dateString}`;
      const scheduleRef = doc(firestore, 'schedules', scheduleId);

      const newData: Partial<Schedule> & { updatedAt: Date } = {
        id: scheduleId,
        courseId: selectedCourse,
        lecturerId: selectedLecturer,
        date: dateString,
        timeSlots: selectedSlots,
        updatedAt: new Date(),
      };
      
      // If this is a new schedule, initialize bookedSlots
      if (!currentSchedule) {
          newData.bookedSlots = [];
      }

      await setDoc(scheduleRef, newData, { merge: true });
      
      toast({ title: "Schedule Saved", description: `Availability for ${dateString} has been updated.` });
      // After saving, update the local `currentSchedule` state to reflect the change
      setCurrentSchedule(prev => ({
          ...prev,
          ...newData,
          id: scheduleId,
      } as Schedule));

    } catch (error) {
      console.error(error);
      toast({ title: 'Error saving schedule', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const hasBookings = currentSchedule?.bookedSlots && currentSchedule.bookedSlots.length > 0;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>1. Select Context</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6">
              <div className="space-y-2">
                <Label>Select Course</Label>
                <Select value={selectedCourse} onValueChange={(val) => {
                    setSelectedCourse(val);
                    setSelectedLecturer(''); // Reset lecturer on course change
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.map(course => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Select Lecturer</Label>
                <Select value={selectedLecturer} onValueChange={setSelectedLecturer} disabled={!selectedCourse}>
                  <SelectTrigger>
                    <SelectValue placeholder={selectedCourse ? "Select lecturer" : "Select a course first"} />
                  </SelectTrigger>
                  <SelectContent>
                    {availableLecturers.map(lecturer => (
                      <SelectItem key={lecturer.id} value={lecturer.id}>{lecturer.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>2. Select Date & Availability</CardTitle>
              {!selectedCourse || !selectedLecturer ? (
                 <p className="text-sm text-muted-foreground pt-2">Please select a course and lecturer to manage dates.</p>
              ) : null}
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="flex justify-center">
                 <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    disabled={!selectedCourse || !selectedLecturer || ((date) => date < new Date(new Date().setHours(0,0,0,0)))}
                    initialFocus
                    className="rounded-md border shadow-sm"
                  />
              </div>

              <div className="space-y-4">
                {isScheduleLoading ? (
                  <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>
                ) : hasBookings ? (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This schedule has active bookings and cannot be modified. To change availability, all existing bookings for this day must first be cancelled.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                        <Label className="font-semibold">{currentSchedule ? 'Edit Availability' : 'Set Availability'}</Label>
                        <Button variant="ghost" size="sm" onClick={() => setSelectedSlots([])} disabled={isLoading || hasBookings}>
                            <Trash className="w-4 h-4 mr-2"/> Clear All
                        </Button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-80 overflow-y-auto pr-2">
                        {TIME_SLOTS.map(time => (
                        <Button
                            key={time}
                            variant={selectedSlots.includes(time) ? "default" : "outline"}
                            className="w-full"
                            onClick={() => toggleSlot(time)}
                            disabled={isLoading}
                        >
                            {time}
                        </Button>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
             <CardContent>
                <Button 
                  className="w-full mt-4" 
                  onClick={handleSaveSchedule} 
                  disabled={isLoading || isScheduleLoading || hasBookings || !selectedCourse || !selectedLecturer || !selectedDate}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Availability for {selectedDate ? format(selectedDate, 'MMM d') : ''}
                </Button>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}
