"use client";

import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";

export default function Home() {
  const [date, setDate] = React.useState<Date | undefined>(new Date());

  // Example event days for highlighting
  const eventDays = React.useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    return [
      new Date(currentYear, currentMonth, 8),
      new Date(currentYear, currentMonth, 15),
      new Date(currentYear, currentMonth, 23),
      new Date(currentYear, currentMonth + 1, 4),
      new Date(currentYear, currentMonth - 1, 28),
    ];
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-background p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-lg text-center mb-8">
        <h1 className="text-4xl font-headline font-bold text-primary tracking-tight sm:text-5xl">
          SimpleCal
        </h1>
        <p className="mt-3 text-lg text-foreground/80">
          An interactive calendar to track your important dates.
        </p>
      </div>
      <Card className="w-full max-w-max p-2 sm:p-4 rounded-2xl shadow-xl">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          modifiers={{ events: eventDays }}
          modifiersClassNames={{
            events: "event-day",
          }}
          classNames={{
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary/90 focus:bg-primary/90",
            day_today: "text-primary bg-primary/10",
          }}
          showOutsideDays
        />
      </Card>
      <footer className="mt-8 text-center text-sm text-muted-foreground">
        <p>Days with events are marked with a purple dot.</p>
        <p className="hidden sm:block">Use arrow keys or click the chevrons to navigate months.</p>
      </footer>
    </main>
  );
}
