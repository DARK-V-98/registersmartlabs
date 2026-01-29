
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { addDays, format } from 'date-fns';
import { Booking } from '@/types';

export const dynamic = 'force-dynamic'; // Prevent caching

export async function GET(req: Request) {
  try {
    // Initialize Firebase
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // Calculate tomorrow's date string
    const tomorrow = addDays(new Date(), 1);
    const dateString = format(tomorrow, 'yyyy-MM-dd');
    
    console.log(`Checking reminders for date: ${dateString}`);

    const bookingsRef = collection(db, 'bookings');
    const q = query(
        bookingsRef, 
        where('date', '==', dateString),
        where('bookingStatus', '==', 'confirmed') // Only remind confirmed bookings
    );

    const snapshot = await getDocs(q);
    const bookings = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Booking));
    
    const results = [];
    
    // Create Transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    for (const booking of bookings) {
        if (booking.reminderSent) {
          results.push({ id: booking.id, status: 'skipped_already_sent' });
          continue;
        }
        
        if (!booking.userEmail) {
            results.push({ id: booking.id, status: 'skipped_no_email' });
            continue;
        }

        // Send Email
         const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: booking.userEmail,
            subject: `Reminder: Your class for ${booking.courseName} is tomorrow!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #007bff; color: white; padding: 20px;">
                  <h2 style="margin: 0;">Upcoming Class Reminder</h2>
                </div>
                <div style="padding: 20px 30px;">
                  <p>Hello <strong>${booking.userName}</strong>,</p>
                  <p>This is a friendly reminder that you have a class scheduled for tomorrow.</p>
                  
                  <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
                    <h3 style="color: #333; margin-top: 0;">Class Details</h3>
                    <p><strong>Course:</strong> ${booking.courseName}</p>
                    <p><strong>Lecturer:</strong> ${booking.lecturerName}</p>
                    <p><strong>Date:</strong> ${booking.date}</p>
                    <p><strong>Time:</strong> ${booking.time} <strong style="color: #d9534f;">(Sri Lanka Time, LKT)</strong></p>
                  </div>
                  
                  <p>Please be ready a few minutes before your session begins. If you have any questions, you can reply to this email or contact us through your dashboard.</p>
                  
                  <div style="margin-top: 30px; text-align: center;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/bookings/${booking.id}" style="background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block;">View Booking Details</a>
                  </div>
                </div>
                <div style="background-color: #f1f1f1; text-align: center; padding: 15px; font-size: 12px; color: #666;">
                  <p>Thank you for choosing SmartLabs!</p>
                </div>
              </div>
            `,
        };

        try {
            await transporter.sendMail(mailOptions);
            
            // Update Firestore
            await updateDoc(doc(db, 'bookings', booking.id), {
                reminderSent: true
            });
            
            results.push({ id: booking.id, status: 'sent' });
        } catch (err: any) {
            console.error(`Failed to send reminder to ${booking.id}:`, err);
            results.push({ id: booking.id, status: 'failed', error: err.message });
        }
    }

    return NextResponse.json({ 
        success: true, 
        date: dateString,
        processed: results.length, 
        results 
    });

  } catch (error: any) {
    console.error('Cron Job Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
