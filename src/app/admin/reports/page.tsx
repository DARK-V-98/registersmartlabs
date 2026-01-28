'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { useUserProfile } from '@/hooks/useUserProfile';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, LineChart } from 'lucide-react';
import { Booking, UserProfile, Course, Lecturer } from '@/types';
import { format, startOfYear, endOfYear, getMonth, getYear, parseISO } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  ResponsiveContainer,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
  CartesianGrid,
} from 'recharts';

// Revenue data types
interface MonthlyRevenue {
  month: string;
  revenue: number;
}
interface RevenueByItem {
  name: string;
  revenue: number;
}

// Cohort data types
interface Cohort {
    month: string;
    totalUsers: number;
    data: CohortMonthData[];
}
interface CohortMonthData {
    month: number;
    activeUsers: number;
    retention: number;
}


const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-background border rounded-lg shadow-lg">
        <p className="font-bold">{label}</p>
        <p className="text-primary">{`Revenue: LKR ${payload[0].value.toLocaleString()}`}</p>
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const firestore = useFirestore();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfYear(new Date()),
    to: endOfYear(new Date()),
  });

  // Data queries
  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !dateRange?.from || !dateRange.to) return null;
    return query(
      collection(firestore, 'bookings'),
      where('bookingStatus', '==', 'confirmed'),
      orderBy('date', 'asc')
    );
  }, [firestore, dateRange]);
  
  const usersQuery = useMemoFirebase(() => {
      if(!firestore) return null;
      return query(collection(firestore, 'users'), orderBy('createdAt', 'asc'));
  }, [firestore]);
  
  const coursesQuery = useMemoFirebase(() => {
      if(!firestore) return null;
      return query(collection(firestore, 'courses'));
  }, [firestore]);
  
  const lecturersQuery = useMemoFirebase(() => {
      if(!firestore) return null;
      return query(collection(firestore, 'lecturers'));
  }, [firestore]);

  const { data: bookings, isLoading: isBookingsLoading } = useCollection<Booking>(bookingsQuery);
  const { data: users, isLoading: isUsersLoading } = useCollection<UserProfile>(usersQuery);
  const { data: courses, isLoading: isCoursesLoading } = useCollection<Course>(coursesQuery);
  const { data: lecturers, isLoading: isLecturersLoading } = useCollection<Lecturer>(lecturersQuery);


  const filteredBookings = useMemo(() => {
    if (!bookings || !dateRange?.from || !dateRange?.to) return [];
    return bookings.filter(b => {
      const bookingDate = parseISO(b.date);
      return bookingDate >= dateRange.from! && bookingDate <= dateRange.to!;
    });
  }, [bookings, dateRange]);


  const revenueData = useMemo((): { monthly: MonthlyRevenue[], byCourse: RevenueByItem[], byLecturer: RevenueByItem[] } => {
    if (!filteredBookings || !courses || !lecturers) return { monthly: [], byCourse: [], byLecturer: [] };

    // Monthly Revenue
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: format(new Date(0, i), 'MMM'),
      revenue: 0,
    }));
    filteredBookings.forEach(booking => {
      const monthIndex = getMonth(parseISO(booking.date));
      monthly[monthIndex].revenue += booking.price || 0;
    });

    // Revenue by Course
    const courseMap = new Map<string, number>();
    filteredBookings.forEach(booking => {
      const current = courseMap.get(booking.courseId) || 0;
      courseMap.set(booking.courseId, current + (booking.price || 0));
    });
    const byCourse = Array.from(courseMap.entries()).map(([courseId, revenue]) => ({
      name: courses.find(c => c.id === courseId)?.name || 'Unknown',
      revenue,
    })).sort((a,b) => b.revenue - a.revenue);

    // Revenue by Lecturer
    const lecturerMap = new Map<string, number>();
    filteredBookings.forEach(booking => {
      const current = lecturerMap.get(booking.lecturerId) || 0;
      lecturerMap.set(booking.lecturerId, current + (booking.price || 0));
    });
    const byLecturer = Array.from(lecturerMap.entries()).map(([lecturerId, revenue]) => ({
      name: lecturers.find(l => l.id === lecturerId)?.name || 'Unknown',
      revenue,
    })).sort((a,b) => b.revenue - a.revenue);

    return { monthly, byCourse, byLecturer };
  }, [filteredBookings, courses, lecturers]);
  
  
  const cohortData = useMemo((): Cohort[] => {
      if (!users || !bookings) return [];

      const cohorts: Record<string, { total: number, users: Set<string> }> = {};
      users.forEach(user => {
          if(!user.createdAt?.toDate) return;
          const cohortMonth = format(user.createdAt.toDate(), 'yyyy-MM');
          if (!cohorts[cohortMonth]) {
              cohorts[cohortMonth] = { total: 0, users: new Set() };
          }
          cohorts[cohortMonth].total++;
          cohorts[cohortMonth].users.add(user.id);
      });

      const cohortAnalysis: Cohort[] = Object.keys(cohorts).sort().map(month => {
          const cohortUsers = cohorts[month].users;
          const cohortStartDate = new Date(month);

          const monthlyActivity: Record<number, Set<string>> = {};

          bookings.forEach(booking => {
              if (cohortUsers.has(booking.userId)) {
                  const bookingDate = parseISO(booking.date);
                  const monthDiff = (getYear(bookingDate) - getYear(cohortStartDate)) * 12 + (getMonth(bookingDate) - getMonth(cohortStartDate));
                  if(monthDiff >= 0) {
                      if (!monthlyActivity[monthDiff]) {
                        monthlyActivity[monthDiff] = new Set();
                      }
                      monthlyActivity[monthDiff].add(booking.userId);
                  }
              }
          });
          
          const data: CohortMonthData[] = Array.from({length: 12}, (_, i) => {
              const activeUsers = monthlyActivity[i]?.size || 0;
              return {
                  month: i,
                  activeUsers,
                  retention: cohorts[month].total > 0 ? (activeUsers / cohorts[month].total) * 100 : 0
              };
          });

          return {
              month: format(cohortStartDate, 'MMM yyyy'),
              totalUsers: cohorts[month].total,
              data
          };
      });

      return cohortAnalysis.reverse();

  }, [users, bookings]);


  if (isProfileLoading || isBookingsLoading || isUsersLoading || isCoursesLoading || isLecturersLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;
  }
  
  if (profile?.role !== 'developer' && profile?.role !== 'superadmin') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
          <CardDescription>You do not have permission to view this page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><LineChart/> Analytics & Reports</h2>
            <p className="text-muted-foreground">Key metrics and performance insights for your platform.</p>
        </div>
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline">
                    {dateRange?.from ? (
                        dateRange.to ? (
                        <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                        </>
                        ) : (
                        format(dateRange.from, "LLL dd, y")
                        )
                    ) : (
                        <span>Pick a date</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
                />
            </PopoverContent>
        </Popover>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
            <h3 className="font-semibold mb-4">Monthly Revenue</h3>
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData.monthly}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis tickFormatter={(value) => `LKR ${value / 1000}k`} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
                <div>
                    <h3 className="font-semibold mb-4">Top Courses by Revenue</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData.byCourse.slice(0, 5)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `LKR ${value / 1000}k`}/>
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
                 <div>
                    <h3 className="font-semibold mb-4">Top Lecturers by Revenue</h3>
                     <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                             <BarChart data={revenueData.byLecturer.slice(0, 5)} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" tickFormatter={(value) => `LKR ${value / 1000}k`}/>
                                <YAxis dataKey="name" type="category" width={80} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
            <CardTitle>Cohort Analysis: User Retention</CardTitle>
            <CardDescription>Percentage of users from a signup cohort who booked a class in the months following signup.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Cohort</TableHead>
                        <TableHead>Users</TableHead>
                        {Array.from({length: 12}).map((_, i) => (
                           <TableHead key={i}>Month {i}</TableHead> 
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {cohortData.map(cohort => (
                        <TableRow key={cohort.month}>
                            <TableCell>{cohort.month}</TableCell>
                            <TableCell>{cohort.totalUsers}</TableCell>
                            {cohort.data.map(d => (
                                <TableCell key={d.month} style={{ backgroundColor: `hsla(var(--primary), ${d.retention / 100})`}}>
                                    {d.retention.toFixed(1)}%
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </CardContent>
      </Card>

    </div>
  );
}
