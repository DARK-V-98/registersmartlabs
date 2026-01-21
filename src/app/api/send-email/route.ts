import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      bookingId,
      userId,
      userName,
      userEmail,
      courseName,
      classType,
      lecturerName,
      date,
      time,
      price,
      paymentMethod,
      receiptUrl,
    } = body;

    // --- Step 1: Initialize Firebase to access Firestore ---
    // This ensures we can connect to the database to fetch notification settings.
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // --- Step 2: Fetch Notification Emails from Firestore ---
    // The list of emails is stored in the 'admin' document within the 'settings' collection.
    const recipients: string[] = [];
    try {
        const settingsRef = doc(db, 'settings', 'admin');
        const settingsSnap = await getDoc(settingsRef);

        if (settingsSnap.exists()) {
            const settingsData = settingsSnap.data();
            // Ensure the 'notificationEmails' field exists and is an array.
            if (settingsData.notificationEmails && Array.isArray(settingsData.notificationEmails)) {
                recipients.push(...settingsData.notificationEmails);
                console.log(`Found ${settingsData.notificationEmails.length} recipient(s) in Firestore.`);
            }
        } else {
            console.log("Admin settings document not found. No recipients fetched from Firestore.");
        }
    } catch (error) {
        console.error('Error fetching admin settings from Firestore:', error);
        // We can continue and fall back to the default email even if this fails.
    }

    // --- Step 3: Configure and Send Email ---
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // Use 'true' for port 465, 'false' for 587
      auth: {
        user: process.env.EMAIL_USER, // Your Gmail address from environment variables
        pass: process.env.EMAIL_PASS, // Your Gmail App Password from environment variables
      },
    });

    // Combine recipients from Firestore with a fallback email from environment variables.
    // A Set is used to prevent sending duplicate emails.
    const defaultAdminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
    const allRecipients = new Set(recipients);
    if (defaultAdminEmail) {
        allRecipients.add(defaultAdminEmail);
    }
    
    const toEmails = Array.from(allRecipients);

    if (toEmails.length === 0) {
        console.error('No recipient emails are configured in Firestore or environment variables.');
        throw new Error('No recipient emails configured');
    }

    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'smartlabs'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: toEmails.join(', '), // Nodemailer can send to multiple addresses in a comma-separated string
      subject: `New Booking: ${courseName} - ${userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden;">
          <div style="background-color: #f7f7f7; padding: 20px; text-align: center;">
            <h2 style="color: #333; margin: 0;">New Booking Received</h2>
          </div>
          <div style="padding: 20px;">
            <p>A new class booking requires your attention. Here are the details:</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <tbody style="border-top: 1px solid #eee; border-bottom: 1px solid #eee;">
                    <tr><td style="padding: 10px; font-weight: bold; background-color: #fdfdfd;">Booking ID:</td><td style="padding: 10px;">${bookingId}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; background-color: #fdfdfd;">Student Name:</td><td style="padding: 10px;">${userName}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; background-color: #fdfdfd;">Student Email:</td><td style="padding: 10px;">${userEmail}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; background-color: #fdfdfd;">User ID:</td><td style="padding: 10px;">${userId}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; background-color: #fdfdfd;">Course:</td><td style="padding: 10px;">${courseName}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; background-color: #fdfdfd;">Lecturer:</td><td style="padding: 10px;">${lecturerName}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; background-color: #fdfdfd;">Class Type:</td><td style="padding: 10px;">${classType}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; background-color: #fdfdfd;">Date & Time:</td><td style="padding: 10px;">${date} at ${time}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; background-color: #fdfdfd;">Price:</td><td style="padding: 10px;">LKR ${price ? price.toLocaleString() : '-'}</td></tr>
                    <tr><td style="padding: 10px; font-weight: bold; background-color: #fdfdfd;">Payment Method:</td><td style="padding: 10px;">${paymentMethod}</td></tr>
                </tbody>
            </table>
            ${receiptUrl ? `<div style="margin-top: 20px; text-align: center;"><a href="${receiptUrl}" style="background-color: #007bff; color: white; padding: 10px 15px; text-decoration: none; border-radius: 5px; display: inline-block;">View Uploaded Receipt</a></div>` : ''}
          </div>
          <div style="background-color: #f7f7f7; padding: 15px; text-align: center; color: #888; font-size: 12px;">
            This is an automated notification from the smartlabs Booking System.
          </div>
        </div>
      `,
    };

    // Verify SMTP connection
    await transporter.verify();
    
    // Send email
    await transporter.sendMail(mailOptions);
    console.log('Booking notification sent successfully to:', toEmails.join(', '));

    return NextResponse.json({ message: 'Email notification sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to send email notification:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification', details: error.message },
      { status: 500 }
    );
  }
}
