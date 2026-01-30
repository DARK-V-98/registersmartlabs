
'use client';

import { format } from 'date-fns';
import { Schedule, Booking } from '@/types';

export const MASTER_TIME_SLOTS = [
  "08:00 AM", "08:30 AM", "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM",
  "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM",
  "02:00 PM", "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM",
  "05:00 PM", "05:30 PM", "06:00 PM", "06:30 PM", "07:00 PM", "07:30 PM", "08:00 PM"
];

/**
 * Calculates available time slots for a given date based on all schedules for a lecturer.
 */
export const getAvailableSlots = (date: Date, allSchedulesForLecturer: Schedule[] | null) => {
    if (!allSchedulesForLecturer || !date) {
        return { hasAny: false, oneHour: [], twoHour: [] };
    }
    const dateStr = format(date, 'yyyy-MM-dd');
    const scheduleForDate = allSchedulesForLecturer.find(s => s.date === dateStr);

    // If there's no schedule document or no time slots defined by the admin for this day, nothing is available.
    if (!scheduleForDate || !scheduleForDate.timeSlots || scheduleForDate.timeSlots.length === 0) {
        return { hasAny: false, oneHour: [], twoHour: [] };
    }

    const adminDefinedStartTimes = new Set(scheduleForDate.timeSlots);
    const thirtyMinuteBookedSlots = new Set(scheduleForDate.bookedSlots || []);
    
    const validOneHourStarts: string[] = [];
    const validTwoHourStarts: string[] = [];

    // Iterate over all possible start times defined by the admin for that day.
    for (const startTime of adminDefinedStartTimes) {
        const startIndex = MASTER_TIME_SLOTS.indexOf(startTime);
        if (startIndex === -1) continue; // Should not happen if data is clean

        // Check for 1-hour availability (needs 2 consecutive 30-min slots)
        if (startIndex + 1 < MASTER_TIME_SLOTS.length) {
            const slot1 = MASTER_TIME_SLOTS[startIndex];
            const slot2 = MASTER_TIME_SLOTS[startIndex + 1];
            if (!thirtyMinuteBookedSlots.has(slot1) && !thirtyMinuteBookedSlots.has(slot2)) {
                validOneHourStarts.push(startTime);
            }
        }
      
        // Check for 2-hour availability (needs 4 consecutive 30-min slots)
        if (startIndex + 3 < MASTER_TIME_SLOTS.length) {
            const slot1 = MASTER_TIME_SLOTS[startIndex];
            const slot2 = MASTER_TIME_SLOTS[startIndex + 1];
            const slot3 = MASTER_TIME_SLOTS[startIndex + 2];
            const slot4 = MASTER_TIME_SLOTS[startIndex + 3];
            if (!thirtyMinuteBookedSlots.has(slot1) && !thirtyMinuteBookedSlots.has(slot2) && !thirtyMinuteBookedSlots.has(slot3) && !thirtyMinuteBookedSlots.has(slot4)) {
                validTwoHourStarts.push(startTime);
            }
        }
    }
    
    return { 
        hasAny: validOneHourStarts.length > 0 || validTwoHourStarts.length > 0, 
        oneHour: validOneHourStarts.sort(), 
        twoHour: validTwoHourStarts.sort()
    };
};

/**
 * Determines the specific 30-minute slot strings to block for a given booking.
 */
export const getSlotsForBooking = (booking: Booking): string[] => {
    const slots: string[] = [];
    if (!booking.time || !booking.duration) return [];
    
    const startTimeIndex = MASTER_TIME_SLOTS.indexOf(booking.time);
    if (startTimeIndex === -1) return [];
    
    const slotsToBookCount = booking.duration === 1 ? 2 : 4;
    for (let i = 0; i < slotsToBookCount; i++) {
        const slotIndex = startTimeIndex + i;
        if (slotIndex < MASTER_TIME_SLOTS.length) {
            slots.push(MASTER_TIME_SLOTS[slotIndex]);
        }
    }
    return slots;
};
