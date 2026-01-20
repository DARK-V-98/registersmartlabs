
'use client';

import { useState, useMemo, Suspense, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Monitor, 
  MapPin,
  CheckCircle,
  Clock,
  User,
  Calendar,
  CreditCard,
  MessageCircle,
} from "lucide-react";
import { useUser, useFirestore, addDocumentNonBlocking, useDoc, useMemoFirebase } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { collection, serverTimestamp, doc, Timestamp } from "firebase/firestore";
import { format } from 'date-fns';

const courses = [
  { id: "pte", name: "PTE Academic", icon: "🎯" },
  { id: "ielts", name: "IELTS", icon: "📚" },
  { id: "celpip", name: "CELPIP", icon: "🍁" },
];

const allTimeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
  "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM", "06:00 PM",
];

interface AdminSettings {
  bankDetails?: string;
  whatsappNumber?: string;
  disabledDates?: string[];
}

interface Schedule {
  bookedSlots: string[];
}

const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

function BookingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const settingsRef = useMemoFirebase(() => firestore ? doc(firestore, 'settings', 'admin') : null, [firestore]);
  const { data: settings } = useDoc<AdminSettings>(settingsRef);
  
  const initialCourse = searchParams.get("course") || "pte";
  
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);
  const [classType, setClassType] = useState<"online" | "physical">("online");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString("default", { month: "long" });
  
  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push("/login?redirect=/booking");
    }
  }, [isUserLoading, user, router]);

  const scheduleRef = useMemoFirebase(() => {
    if (!firestore || !selectedDate) return null;
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    return doc(firestore, 'schedules', dateString);
  }, [firestore, selectedDate]);

  const { data: schedule } = useDoc<Schedule>(scheduleRef);

  const adminDisabledDates = useMemo(() => new Set(settings?.disabledDates || []), [settings]);
  const bookedTimes = useMemo(() => new Set(schedule?.bookedSlots || []), [schedule]);

  const availableDates = useMemo(() => {
    const available = new Set<number>();
    const today = new Date();
    today.setHours(0,0,0,0);

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      if (date < today) continue;
      const dateString = format(date, 'yyyy-MM-dd');
      if (adminDisabledDates.has(dateString)) continue;
      available.add(i);
    }
    return available;
  }, [daysInMonth, month, year, adminDisabledDates]);

  const timeSlots = useMemo(() => {
    return allTimeSlots.map(time => ({
      time,
      available: !bookedTimes.has(time),
    }));
  }, [bookedTimes]);


  const prevMonth = () => {
    const today = new Date();
    if (year === today.getFullYear() && month === today.getMonth()) return;
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const handleDateSelect = (day: number) => {
    if (availableDates.has(day)) {
      setSelectedDate(new Date(year, month, day));
      setSelectedTime(null);
    }
  };

  const handleConfirmBooking = async () => {
    if (!user || !firestore || !selectedDate || !selectedTime) return;

    const enrollmentData = {
      userId: user.uid,
      courseId: selectedCourse,
      courseName: courses.find(c => c.id === selectedCourse)?.name,
      courseIcon: courses.find(c => c.id === selectedCourse)?.icon,
      date: selectedDate,
      time: selectedTime,
      classType: classType,
      status: 'pending',
      enrollmentDate: serverTimestamp(),
    };

    const collectionRef = collection(firestore, `bookings`);
    await addDocumentNonBlocking(collectionRef, enrollmentData);
    
    setStep(2);
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  const today = new Date();
  const isPrevMonthDisabled = year === today.getFullYear() && month === today.getMonth();

  if (isUserLoading || !user) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading booking page...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <section className="py-24 bg-dots min-h-screen">
        <div className="container mx-auto px-4">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="booking-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <div className="text-center max-w-3xl mx-auto mb-12">
                  <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">Schedule Your Session</h1>
                  <p className="text-lg text-muted-foreground">Choose your course, date, and time.</p>
                </div>
                <div className="max-w-5xl mx-auto grid lg:grid-cols-3 gap-8">
                  <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 border border-border">
                      <h3 className="font-display font-semibold mb-4">1. Select Course</h3>
                      <div className="space-y-3">
                        {courses.map((course) => (
                          <button
                            key={course.id} onClick={() => setSelectedCourse(course.id)}
                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${selectedCourse === course.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                            <span className="text-2xl">{course.icon}</span>
                            <span className="font-medium">{course.name}</span>
                            {selectedCourse === course.id && <CheckCircle className="w-5 h-5 text-primary ml-auto" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 border border-border">
                      <h3 className="font-display font-semibold mb-4">2. Class Type</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setClassType("online")} className={`p-4 rounded-xl border-2 transition-all ${classType === "online" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                          <Monitor className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                          <p className="font-medium text-sm">Online</p>
                        </button>
                        <button onClick={() => setClassType("physical")} className={`p-4 rounded-xl border-2 transition-all ${classType === "physical" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                          <MapPin className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                          <p className="font-medium text-sm">Physical</p>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-display font-semibold">3. {monthName} {year}</h3>
                      <div className="flex gap-2">
                        <button onClick={prevMonth} disabled={isPrevMonthDisabled} className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-secondary transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-7 gap-2 mb-4 text-center text-sm font-medium text-muted-foreground">
                      {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => <div key={d}>{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const isAvailable = availableDates.has(day);
                        const isSelected = selectedDate?.getDate() === day && selectedDate?.getMonth() === month;
                        return (
                          <button key={day} onClick={() => handleDateSelect(day)} disabled={!isAvailable}
                            className={`py-3 rounded-xl text-sm font-medium transition-all ${
                              isSelected ? "bg-accent text-accent-foreground" : 
                              isAvailable ? "hover:bg-primary/10 text-foreground" : 
                              "text-muted-foreground/40 cursor-not-allowed bg-red-50"
                            }`}>
                            {day}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 border border-border">
                    <h3 className="font-display font-semibold mb-4">
                      {selectedDate ? `4. Available Times - ${monthName} ${selectedDate.getDate()}` : "4. Select a Date"}
                    </h3>
                    {selectedDate ? (
                      <div className="space-y-3">
                        {timeSlots.map((slot) => (
                          <button key={slot.time} onClick={() => slot.available && setSelectedTime(slot.time)} disabled={!slot.available}
                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                              selectedTime === slot.time ? "border-primary bg-primary text-primary-foreground" : 
                              slot.available ? "border-border hover:border-primary/50" : 
                              "border-border opacity-40 cursor-not-allowed"
                            }`}>
                            <span className="font-medium">{slot.time}</span>
                            {!slot.available && <span className="text-xs text-red-600">Booked</span>}
                          </button>
                        ))}
                        {selectedDate && selectedTime && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-6 pt-6 border-t border-border">
                            <Button className="w-full btn-accent" size="lg" onClick={handleConfirmBooking}>Confirm & Proceed</Button>
                          </motion.div>
                        )}
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>Select a date to view slots</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div key="confirmation" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto">
                <div className="bg-white rounded-3xl p-8 text-center border border-border shadow-xl">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="w-10 h-10 text-primary" />
                  </div>
                  <h2 className="font-display text-3xl font-bold mb-2">Booking Pending</h2>
                  <p className="text-muted-foreground mb-8">
                    Your booking request has been received. Please complete the payment to confirm your spot.
                  </p>

                  <div className="bg-secondary/50 rounded-2xl p-6 mb-8 text-left space-y-4">
                     <div>
                        <h3 className="font-semibold text-lg mb-4">Payment Instructions</h3>
                        <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                          <li>Transfer the course fee to the bank account below.</li>
                          <li>Send a screenshot of the receipt to our WhatsApp number.</li>
                          <li>Your booking will be confirmed once we verify the payment.</li>
                        </ol>
                     </div>
                     <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm font-semibold">Bank Details:</p>
                        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{settings?.bankDetails || 'Not available'}</p>
                     </div>
                     <div className="bg-white p-4 rounded-lg">
                        <p className="text-sm font-semibold">WhatsApp Number:</p>
                        <a href={`https://wa.me/${settings?.whatsappNumber}`} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-2">
                          <MessageCircle className="w-4 h-4"/> {settings?.whatsappNumber || 'Not available'}
                        </a>
                     </div>
                  </div>

                  <div className="flex gap-4">
                    <Link href="/dashboard" className="flex-1">
                      <Button variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        View My Bookings
                      </Button>
                    </Link>
                    <Button className="flex-1" onClick={() => { setStep(1); setSelectedDate(null); setSelectedTime(null); }}>Book Another</Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </Layout>
  );
}

const BookingPage = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <BookingContent />
  </Suspense>
);

export default BookingPage;
