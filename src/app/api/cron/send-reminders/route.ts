import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { addDays, format } from 'date-fns';

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
    const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
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
        if ((booking as any).reminderSent) continue;
        
        if (!(booking as any).userEmail) {
            results.push({ id: booking.id, status: 'skipped_no_email' });
            continue;
        }

        // Send Email
         const mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: (booking as any).userEmail,
            subject: `Reminder: Class Tomorrow - ${(booking as any).courseName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f57c00;">Upcoming Class Reminder</h2>
                <div style="background-color: #fff8e1; padding: 20px; border-radius: 8px; border: 1px solid #ffe0b2;">
                  <p>Hello <strong>${(booking as any).userName}</strong>,</p>
                  <p>This is a reminder that you have a class scheduled for tomorrow.</p>
                  
                  <hr style="border: 1px solid #eee;" />
                  
                  <h3 style="color: #555;">Class Details</h3>
                  <p><strong>Course:</strong> ${(booking as any).courseName}</p>
                  <p><strong>Lecturer:</strong> ${(booking as any).lecturerName}</p>
                  <p><strong>Date:</strong> ${(booking as any).date}</p>
                  <p><strong>Time:</strong> ${(booking as any).time}</p>
                  
                  <div style="margin-top: 20px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard" style="background-color: #ff9800; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Go to Dashboard</a>
                  </div>
                </div>
                <p style="color: #888; font-size: 12px; margin-top: 20px;">
                  See you in class!
                </p>
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
    console.error('Cron Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
