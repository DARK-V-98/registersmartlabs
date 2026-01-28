
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, addDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, doc, setDoc, getDoc, writeBatch } from 'firebase/firestore';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Course, Lecturer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash } from 'lucide-react';
import { format, eachDayOfInterval, getDay, isSameDay, addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

const TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
];

const DAYS_OF_WEEK = [
  { id: 0, label: 'Sun' },
  { id: 1, label: 'Mon' },
  { id: 2, label: 'Tue' },
  { id: 3, label: 'Wed' },
  { id: 4, label: 'Thu' },
  { id: 5, label: 'Fri' },
  { id: 6, label: 'Sat' },
];

export default function SchedulesPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [selectedLecturer, setSelectedLecturer] = useState<string>('');
  // const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: addDays(new Date(), 7)
  });
  const [selectedWeekDays, setSelectedWeekDays] = useState<number[]>([1, 2, 3, 4, 5]); // Default Mon-Fri
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);

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

  // Fetch Existing Schedule for Selected Date/Lecturer/Course
  // Actually, schedule should be per Lecturer/Date? Or Course/Lecturer/Date?
  // The requirement says "Schedules -> scheduleId -> courseId, lecturerId, date, timeSlots[]"
  // This implies a schedule document per unique combination. 
  // A simpler way is to key schedules by `${lecturerId}_${date}` if a lecturer can't be in two places.
  // But let's follow the schema: schedules collection.

  // Let's implement adding a schedule.
  
  const toggleSlot = (time: string) => {
    setSelectedSlots(prev => 
      prev.includes(time) ? prev.filter(t => t !== time) : [...prev, time]
    );
  };

  const toggleWeekDay = (dayId: number) => {
    setSelectedWeekDays(prev => 
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId]
    );
  };

  const handleSaveSchedule = async () => {
    if (!selectedCourse || !selectedLecturer || !dateRange?.from || !dateRange?.to || selectedSlots.length === 0) {
      toast({ title: 'Please select all fields, date range, and at least one time slot', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      // 1. Generate all dates in range
      const days = eachDayOfInterval({ start: dateRange.from, end: dateRange.to });
      
      // 2. Filter by selected week days
      const targetDates = days.filter(date => selectedWeekDays.includes(getDay(date)));

      if (targetDates.length === 0) {
        toast({ title: 'No matching days in the selected range', variant: 'destructive' });
        setIsLoading(false);
        return;
      }

      // 3. Batch write (chunk by 500 if needed, but for now assuming reasonable range)
      // Firestore batch limit is 500 operations.
      // If targetDates.length > 500, we need multiple batches.
      
      const batchSize = 450;
      const chunks = [];
      for (let i = 0; i < targetDates.length; i += batchSize) {
        chunks.push(targetDates.slice(i, i + batchSize));
      }

      let createdCount = 0;

      for (const chunk of chunks) {
        const batch = writeBatch(firestore);
        
        for (const date of chunk) {
            const dateString = format(date, 'yyyy-MM-dd');
            const scheduleId = `${selectedCourse}_${selectedLecturer}_${dateString}`;
            
            const scheduleData = {
                id: scheduleId,
                courseId: selectedCourse,
                lecturerId: selectedLecturer,
                date: dateString,
                timeSlots: selectedSlots,
                bookedSlots: [], // Reset booked slots? Or merge? 
                // Ideally we should check existing, but "set" overwrites. 
                // User requirement implies "setting availability". 
                // If there are existing bookings, we might lose them if we overwrite `bookedSlots`.
                // We should probably merge `timeSlots` but keep `bookedSlots`.
                // But setDoc with merge: true will merge fields.
                // However, `timeSlots` is an array. Arrays replace in merge.
                // So this will update available slots.
                // We must be careful NOT to overwrite `bookedSlots` if they exist.
                // Best approach: use { merge: true } but don't include bookedSlots in data if we want to preserve them?
                // No, if the document doesn't exist, we need to initialize bookedSlots.
                
                // Let's use setDoc with merge: true. 
                // If doc exists, bookedSlots won't be touched if we don't include it.
                // New docs won't have bookedSlots field. That might be an issue.
                // We can use a default value in our code when reading.
                
                createdAt: new Date(),
            };
            
            // Note: If we use merge: true, we can't easily set "default empty array" only if new.
            // But we can just set it. If it overwrites existing bookings, that's bad.
            // The safe way is to READ then WRITE, but that's slow for 8 months (240 reads).
            
            // Alternative: Just set timeSlots.
            // When Reading Schedules, if bookedSlots is undefined, treat as [].
            
            batch.set(doc(firestore, 'schedules', scheduleId), {
                courseId: selectedCourse,
                lecturerId: selectedLecturer,
                date: dateString,
                timeSlots: selectedSlots,
                updatedAt: new Date() 
                // We omit bookedSlots here to preserve existing data.
                // But for NEW docs, bookedSlots will be missing.
            }, { merge: true });
        }
        
        await batch.commit();
        createdCount += chunk.length;
      }
      
      toast({ title: `Schedule saved for ${createdCount} days successfully` });
      // Don't reset selection to allow easy tweaks
    } catch (error) {
      console.error(error);
      toast({ title: 'Error saving schedules', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Schedule Management</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Select Context</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Select Course</Label>
              <Select value={selectedCourse} onValueChange={setSelectedCourse}>
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
                  <SelectValue placeholder={selectedCourse ? "Select lecturer" : "Select course first"} />
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

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>2. Select Date & Days</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Select Date Range</Label>
              <div className="border rounded-md p-4 flex justify-center">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  initialFocus
                  numberOfMonths={1}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Days of Week</Label>
              <div className="grid grid-cols-4 gap-2">
                {DAYS_OF_WEEK.map(day => (
                  <div key={day.id} className="flex items-center space-x-2">
                    <Checkbox 
                        id={`day-${day.id}`} 
                        checked={selectedWeekDays.includes(day.id)}
                        onCheckedChange={() => toggleWeekDay(day.id)}
                    />
                    <label
                      htmlFor={`day-${day.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {day.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>3. Select Time Slots</CardTitle>
          </CardHeader>
          <CardContent>
             {!dateRange?.from || !selectedLecturer ? (
               <div className="text-center text-muted-foreground py-8">
                 Complete steps 1 and 2 to view time slots.
               </div>
             ) : (
               <div className="space-y-6">
                 <div className="grid grid-cols-3 gap-3">
                   {TIME_SLOTS.map(time => (
                     <Button
                       key={time}
                       variant={selectedSlots.includes(time) ? "default" : "outline"}
                       className="w-full"
                       onClick={() => toggleSlot(time)}
                     >
                       {time}
                     </Button>
                   ))}
                 </div>
                 
                 <div className="pt-4 border-t">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-medium">Selected: {selectedSlots.length} slots</span>
                      <span className="text-sm text-muted-foreground">
                        {dateRange?.from ? format(dateRange.from, 'MMM d') : ''} 
                        {dateRange?.to ? ` - ${format(dateRange.to, 'MMM d')}` : ''}
                      </span>
                    </div>
                    <Button className="w-full" onClick={handleSaveSchedule} disabled={isLoading || selectedSlots.length === 0}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Schedule
                    </Button>
                 </div>
               </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
