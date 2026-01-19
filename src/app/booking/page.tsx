'use client';

import { useState, useMemo, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  ChevronRight, 
  Monitor, 
  MapPin,
  CheckCircle2,
  Clock,
  User,
  Calendar
} from "lucide-react";

const courses = [
  { id: "pte", name: "PTE Academic", icon: "🎯" },
  { id: "ielts", name: "IELTS", icon: "📚" },
  { id: "celpip", name: "CELPIP", icon: "🍁" },
];

const timeSlots = [
  { time: "09:00 AM", available: true },
  { time: "10:00 AM", available: true },
  { time: "11:00 AM", available: false },
  { time: "12:00 PM", available: true },
  { time: "02:00 PM", available: true },
  { time: "03:00 PM", available: false },
  { time: "04:00 PM", available: true },
  { time: "05:00 PM", available: true },
  { time: "06:00 PM", available: true },
];

const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

function BookingContent() {
  const searchParams = useSearchParams();
  const initialCourse = searchParams.get("course") || "pte";
  
  const [selectedCourse, setSelectedCourse] = useState(initialCourse);
  const [classType, setClassType] = useState<"online" | "physical">("online");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const monthName = currentDate.toLocaleString("default", { month: "long" });

  const availableDates = useMemo(() => {
    const available = new Set<number>();
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const currentDay = today.getDate();

    for (let i = 1; i <= daysInMonth; i++) {
      if (year < currentYear || (year === currentYear && month < currentMonth) || (year === currentYear && month === currentMonth && i < currentDay)) {
        continue;
      }
      if (![3, 7, 12, 18, 25].includes(i)) {
        available.add(i);
      }
    }
    return available;
  }, [daysInMonth, month, year]);

  const prevMonth = () => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    if (year === currentYear && month === currentMonth) return;
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
      setSelectedDate(day);
      setSelectedTime(null);
    }
  };

  const handleConfirmBooking = () => {
    setStep(2);
  };

  const selectedCourseData = courses.find(c => c.id === selectedCourse);
  
  const today = new Date();
  const isPrevMonthDisabled = year === today.getFullYear() && month === today.getMonth();

  return (
    <Layout>
      <section className="py-24 bg-dots min-h-screen">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <span className="inline-block px-4 py-2 rounded-full bg-primary/10 text-primary font-medium text-sm mb-4">
              Book a Class
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">
              Schedule Your
              <span className="text-accent"> Individual Session</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Choose your course, preferred date, and time slot for personalized one-on-one coaching
            </p>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="booking-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="max-w-5xl mx-auto"
              >
                <div className="grid lg:grid-cols-3 gap-8">
                  {/* Left Column - Course & Type Selection */}
                  <div className="space-y-6">
                    {/* Course Selection */}
                    <div className="bg-white rounded-2xl p-6 border border-border">
                      <h3 className="font-display font-semibold mb-4">Select Course</h3>
                      <div className="space-y-3">
                        {courses.map((course) => (
                          <button
                            key={course.id}
                            onClick={() => setSelectedCourse(course.id)}
                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                              selectedCourse === course.id
                                ? "border-primary bg-primary/5"
                                : "border-border hover:border-primary/50"
                            }`}
                          >
                            <span className="text-2xl">{course.icon}</span>
                            <span className="font-medium">{course.name}</span>
                            {selectedCourse === course.id && (
                              <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Class Type */}
                    <div className="bg-white rounded-2xl p-6 border border-border">
                      <h3 className="font-display font-semibold mb-4">Class Type</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setClassType("online")}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            classType === "online"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <Monitor className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                          <p className="font-medium text-sm">Online</p>
                        </button>
                        <button
                          onClick={() => setClassType("physical")}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            classType === "physical"
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <MapPin className="w-6 h-6 mx-auto mb-2 text-amber-600" />
                          <p className="font-medium text-sm">Physical</p>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Middle Column - Calendar */}
                  <div className="bg-white rounded-2xl p-6 border border-border">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-display font-semibold">
                        {monthName} {year}
                      </h3>
                      <div className="flex gap-2">
                        <button
                          onClick={prevMonth}
                          disabled={isPrevMonthDisabled}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-5 h-5" />
                        </button>
                        <button
                          onClick={nextMonth}
                          className="p-2 rounded-lg hover:bg-secondary transition-colors"
                        >
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-2 mb-4">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                        <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {/* Empty cells for days before first day of month */}
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}

                      {/* Days of the month */}
                      {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const isAvailable = availableDates.has(day);
                        const isSelected = selectedDate === day;

                        return (
                          <button
                            key={day}
                            onClick={() => handleDateSelect(day)}
                            disabled={!isAvailable}
                            className={`py-3 rounded-xl text-sm font-medium transition-all ${
                              isSelected
                                ? "bg-accent text-accent-foreground"
                                : isAvailable
                                ? "hover:bg-primary/10 text-foreground"
                                : "text-muted-foreground/40 cursor-not-allowed"
                            }`}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    {/* Legend */}
                    <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mt-6 pt-4 border-t border-border text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-accent" />
                        <span>Selected</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-secondary" />
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded bg-muted" />
                        <span>Unavailable</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Time Slots */}
                  <div className="bg-white rounded-2xl p-6 border border-border">
                    <h3 className="font-display font-semibold mb-4">
                      {selectedDate ? (
                        <>Available Times - {monthName} {selectedDate}</>
                      ) : (
                        "Select a Date First"
                      )}
                    </h3>

                    {selectedDate ? (
                      <div className="space-y-3">
                        {timeSlots.map((slot) => (
                          <button
                            key={slot.time}
                            onClick={() => slot.available && setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                              selectedTime === slot.time
                                ? "border-primary bg-primary text-primary-foreground"
                                : slot.available
                                ? "border-border hover:border-primary/50"
                                : "border-border opacity-40 cursor-not-allowed"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium">{slot.time}</span>
                            </div>
                            {!slot.available && (
                              <span className="text-xs text-muted-foreground">Booked</span>
                            )}
                            {selectedTime === slot.time && (
                              <CheckCircle2 className="w-5 h-5" />
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="h-64 flex items-center justify-center text-muted-foreground">
                        <div className="text-center">
                          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p>Select a date to view available time slots</p>
                        </div>
                      </div>
                    )}

                    {/* Confirm Button */}
                    {selectedDate && selectedTime && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 pt-6 border-t border-border"
                      >
                        <div className="bg-secondary/50 rounded-xl p-4 mb-4">
                          <p className="text-sm text-muted-foreground mb-1">Your Selection</p>
                          <p className="font-semibold">
                            {selectedCourseData?.name} • {classType === "online" ? "Online" : "Physical"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {monthName} {selectedDate}, {year} at {selectedTime}
                          </p>
                        </div>
                        <Button 
                          className="w-full btn-accent"
                          size="lg"
                          onClick={handleConfirmBooking}
                        >
                          Confirm Booking
                        </Button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-lg mx-auto"
              >
                <div className="bg-white rounded-3xl p-8 text-center border border-border shadow-xl">
                  <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-10 h-10 text-success" />
                  </div>
                  <h2 className="font-display text-3xl font-bold mb-2">Booking Confirmed!</h2>
                  <p className="text-muted-foreground mb-8">
                    Your class has been successfully scheduled. Check your email for details.
                  </p>

                  <div className="bg-secondary/50 rounded-2xl p-6 mb-8 text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Course</p>
                        <p className="font-semibold">{selectedCourseData?.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Type</p>
                        <p className="font-semibold capitalize">{classType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-semibold">{monthName} {selectedDate}, {year}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-semibold">{selectedTime}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Link href="/dashboard" className="flex-1">
                      <Button variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        View Dashboard
                      </Button>
                    </Link>
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        setStep(1);
                        setSelectedDate(null);
                        setSelectedTime(null);
                      }}
                    >
                      Book Another
                    </Button>
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
