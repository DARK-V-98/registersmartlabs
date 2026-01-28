
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
  TableFooter,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, BarChart, FileDown } from 'lucide-react';
import { Booking, Lecturer } from '@/types';
import { addDays, format, startOfMonth, endOfMonth } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface PayoutReport {
  lecturerId: string;
  lecturerName: string;
  classCount: number;
  totalHours: number;
  totalRevenue: number;
  payoutRate: number;
  totalPayout: number;
}

export default function PayoutsPage() {
  const { profile, isLoading: isProfileLoading } = useUserProfile();
  const firestore = useFirestore();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const lecturersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, 'lecturers'), orderBy('name'));
  }, [firestore]);

  const bookingsQuery = useMemoFirebase(() => {
    if (!firestore || !dateRange?.from || !dateRange.to) return null;
    
    // Note: Firestore does not support range queries on different fields.
    // We query by status and then filter by date on the client.
    // For large datasets, a 'completedAt' timestamp would be more efficient.
    return query(
      collection(firestore, 'bookings'),
      where('bookingStatus', '==', 'confirmed'),
      orderBy('date', 'asc')
    );
  }, [firestore, dateRange]);

  const { data: lecturers, isLoading: isLecturersLoading } = useCollection<Lecturer>(lecturersQuery);
  const { data: bookings, isLoading: isBookingsLoading } = useCollection<Booking>(bookingsQuery);

  const reportData = useMemo((): PayoutReport[] => {
    if (!lecturers || !bookings || !dateRange?.from || !dateRange?.to) return [];

    const filteredBookings = bookings.filter(b => {
      const bookingDate = new Date(b.date);
      return bookingDate >= dateRange.from! && bookingDate <= dateRange.to!;
    });

    const report: PayoutReport[] = lecturers.map(lecturer => {
      const lecturerBookings = filteredBookings.filter(b => b.lecturerId === lecturer.id);
      const totalHours = lecturerBookings.reduce((sum, b) => sum + (b.duration || 0), 0);
      const totalRevenue = lecturerBookings.reduce((sum, b) => sum + (b.price || 0), 0);
      const payoutRate = lecturer.payoutRate || 0;
      const totalPayout = totalRevenue * (payoutRate / 100);

      return {
        lecturerId: lecturer.id,
        lecturerName: lecturer.name,
        classCount: lecturerBookings.length,
        totalHours,
        totalRevenue,
        payoutRate,
        totalPayout,
      };
    });

    return report;
  }, [lecturers, bookings, dateRange]);

  const totals = useMemo(() => {
    return reportData.reduce((acc, report) => ({
      classCount: acc.classCount + report.classCount,
      totalHours: acc.totalHours + report.totalHours,
      totalRevenue: acc.totalRevenue + report.totalRevenue,
      totalPayout: acc.totalPayout + report.totalPayout,
    }), { classCount: 0, totalHours: 0, totalRevenue: 0, totalPayout: 0 });
  }, [reportData]);

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Lecturer Payout Report', 14, 20);
    doc.setFontSize(10);
    doc.text(`Period: ${format(dateRange!.from!, 'PPP')} - ${format(dateRange!.to!, 'PPP')}`, 14, 26);

    const tableColumn = ["Lecturer", "Classes", "Hours", "Revenue (LKR)", "Rate (%)", "Payout (LKR)"];
    const tableRows: any[][] = [];

    reportData.forEach(report => {
      const rowData = [
        report.lecturerName,
        report.classCount,
        report.totalHours.toFixed(1),
        report.totalRevenue.toLocaleString(),
        report.payoutRate.toFixed(0),
        report.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
      ];
      tableRows.push(rowData);
    });
    
    // Add Totals row
    tableRows.push([
        { content: 'Totals', styles: { fontStyle: 'bold' } },
        { content: totals.classCount, styles: { fontStyle: 'bold' } },
        { content: totals.totalHours.toFixed(1), styles: { fontStyle: 'bold' } },
        { content: totals.totalRevenue.toLocaleString(), styles: { fontStyle: 'bold' } },
        '',
        { content: totals.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), styles: { fontStyle: 'bold' } },
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 32,
    });
    
    doc.save(`payout_report_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (isProfileLoading) {
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

  const isLoading = isLecturersLoading || isBookingsLoading;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold flex items-center gap-2"><BarChart/> Lecturer Payouts</h2>
            <p className="text-muted-foreground">Generate reports on completed classes and lecturer earnings.</p>
        </div>
        <div className="flex gap-4">
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
            <Button onClick={exportPDF} disabled={reportData.length === 0}><FileDown className="mr-2 h-4 w-4"/>Export PDF</Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lecturer</TableHead>
                  <TableHead className="text-center">Classes</TableHead>
                  <TableHead className="text-center">Hours</TableHead>
                  <TableHead className="text-right">Total Revenue (LKR)</TableHead>
                  <TableHead className="text-center">Rate</TableHead>
                  <TableHead className="text-right">Total Payout (LKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reportData.map((report) => (
                  <TableRow key={report.lecturerId}>
                    <TableCell className="font-medium">{report.lecturerName}</TableCell>
                    <TableCell className="text-center">{report.classCount}</TableCell>
                    <TableCell className="text-center">{report.totalHours.toFixed(1)}</TableCell>
                    <TableCell className="text-right">{report.totalRevenue.toLocaleString()}</TableCell>
                    <TableCell className="text-center">{report.payoutRate}%</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{report.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                ))}
                {reportData.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">No completed bookings found for the selected date range.</TableCell>
                    </TableRow>
                )}
              </TableBody>
              <TableFooter>
                <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead>Totals</TableHead>
                    <TableHead className="text-center">{totals.classCount}</TableHead>
                    <TableHead className="text-center">{totals.totalHours.toFixed(1)}</TableHead>
                    <TableHead className="text-right">{totals.totalRevenue.toLocaleString()}</TableHead>
                    <TableHead></TableHead>
                    <TableHead className="text-right text-primary">{totals.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableHead>
                </TableRow>
              </TableFooter>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
