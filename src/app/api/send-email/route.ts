

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { logoBase64 } from '@/lib/logo-base64';


const getInvoiceHtml = (bookingData: any) => {
    const {
        bookingId = 'N/A',
        userName = 'N/A',
        userEmail = 'N/A',
        userPhoneNumber = 'N/A',
        courseName = 'N/A',
        lecturerName = 'N/A',
        date = 'N/A',
        time = 'N/A',
        classType = 'N/A',
        duration = 1,
        price = 0,
    } = bookingData;
    
    const numericPrice = typeof price === 'number' ? price : 0;

    return `
    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 800px; margin: 20px auto; padding: 20px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
        <table cellpadding="0" cellspacing="0" style="width: 100%; line-height: inherit; text-align: left;">
            <tr class="top">
                <td colspan="2" style="padding: 5px; vertical-align: top;">
                    <table style="width: 100%; line-height: inherit; text-align: left;">
                        <tr>
                            <td class="title" style="padding-bottom: 20px; font-size: 45px; line-height: 45px; color: #333;">
                                <img src="${logoBase64}" style="width:100%; max-width:100px;">
                            </td>
                            <td style="padding-bottom: 20px; text-align: right;">
                                <strong style="font-size: 20px;">Invoice #${bookingId}</strong><br>
                                Created: ${new Date().toLocaleDateString()}<br>
                                Status: <strong style="color: #27ae60;">Paid</strong>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="information">
                <td colspan="2" style="padding: 5px; vertical-align: top;">
                    <table style="width: 100%; line-height: inherit; text-align: left; border-top: 1px solid #eee; padding-top: 20px;">
                        <tr>
                            <td style="padding-bottom: 40px;">
                                SmartLabs<br>
                                3rd Floor, No. 326, Jana Jaya Building<br>
                                Rajagiriya, Sri Lanka
                            </td>
                            <td style="padding-bottom: 40px; text-align: right;">
                                <strong>Bill To:</strong><br>
                                ${userName}<br>
                                ${userEmail}<br>
                                ${userPhoneNumber}
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
            <tr class="heading" style="background: #eee; border-bottom: 1px solid #ddd; font-weight: bold;">
                <td style="padding: 10px; vertical-align: top;">Description</td>
                <td style="padding: 10px; vertical-align: top; text-align: right;">Amount (LKR)</td>
            </tr>
            <tr class="item" style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px; vertical-align: top;">
                    ${courseName} - ${lecturerName}<br>
                    <small style="color: #555;">Date: ${date} @ ${time} (${duration} Hour(s), ${classType})</small>
                </td>
                <td style="padding: 10px; vertical-align: top; text-align: right;">${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            </tr>
            <tr class="total">
                <td style="padding: 5px; vertical-align: top;"></td>
                <td style="padding: 10px 10px 40px; vertical-align: top; text-align: right; border-top: 2px solid #eee; font-weight: bold; font-size: 1.2em;">
                    Total: LKR ${numericPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
            </tr>
        </table>
        <div style="text-align: center; color: #777; font-size: 12px; margin-top: 20px;">
            <p>Thank you for choosing SmartLabs. This is a computer-generated invoice and does not require a signature.</p>
        </div>
    </div>
    `;
};


export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      type = 'admin_notification', // 'admin_notification' | 'confirmation' | 'reminder'
      bookingId,
      userId,
      userName,
      userEmail,
      userPhoneNumber,
      courseName,
      classType,
      lecturerName,
      date,
      time,
      price,
      duration,
      paymentMethod,
      receiptUrl,
    } = body;

    // Check for essential environment variables
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error('Missing SMTP credentials. Please set EMAIL_USER and EMAIL_PASS environment variables.');
      return NextResponse.json(
        { error: 'Server configuration error', details: 'Missing SMTP credentials on the server.' },
        { status: 500 }
      );
    }

    // Initialize Firebase (using Client SDK in Node environment) to fetch settings
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Create a transporter using SMTP settings from environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    let mailOptions;

    if (type === 'confirmation') {
        const invoiceHtml = getInvoiceHtml(body);

        // --- PDF INVOICE GENERATION from HTML ---
        const doc = new jsPDF();
        await doc.html(invoiceHtml, {
            autoPaging: 'text',
            x: 0,
            y: 0,
            width: 210, // A4 width in mm
            windowWidth: 800 // The width of the HTML element
        });
        const pdfBuffer = doc.output('arraybuffer');
        // --- END PDF INVOICE GENERATION ---

        mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmed & Invoice: ${courseName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2e7d32;">Booking Confirmed!</h2>
                <div style="background-color: #f9fff9; padding: 20px; border-radius: 8px; border: 1px solid #c8e6c9;">
                  <p>Hello <strong>${userName}</strong>,</p>
                  <p>Your booking for <strong>${courseName}</strong> has been successfully confirmed. Your invoice is attached to this email.</p>
                  
                  <hr style="border: 1px solid #eee;" />
                  
                  <h3 style="color: #555;">Class Details</h3>
                  <p><strong>Lecturer:</strong> ${lecturerName}</p>
                  <p><strong>Date:</strong> ${date}</p>
                  <p><strong>Time:</strong> ${time} (Asia/Colombo Time)</p>
                  <p><strong>Type:</strong> ${classType}</p>
                  <p><strong>Booking ID:</strong> ${bookingId}</p>
                  
                  <div style="margin-top: 20px; padding: 15px; background-color: #e8f5e9; border-radius: 5px;">
                    <p style="margin: 0; color: #1b5e20;"><strong>Next Steps:</strong> Please join the class on time. If it is an online class, the link will be available in your dashboard.</p>
                  </div>
                </div>
                <p style="color: #888; font-size: 12px; margin-top: 20px;">
                  Thank you for choosing SmartLabs.
                </p>
              </div>
            `,
            attachments: [
                {
                    filename: `invoice-${bookingId}.pdf`,
                    content: Buffer.from(pdfBuffer),
                    contentType: 'application/pdf',
                },
            ],
        };
    } else if (type === 'reminder') {
        mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: userEmail,
            subject: `Reminder: Class Tomorrow - ${courseName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #f57c00;">Upcoming Class Reminder</h2>
                <div style="background-color: #fff8e1; padding: 20px; border-radius: 8px; border: 1px solid #ffe0b2;">
                  <p>Hello <strong>${userName}</strong>,</p>
                  <p>This is a reminder that you have a class scheduled for tomorrow.</p>
                  
                  <hr style="border: 1px solid #eee;" />
                  
                  <h3 style="color: #555;">Class Details</h3>
                  <p><strong>Course:</strong> ${courseName}</p>
                  <p><strong>Lecturer:</strong> ${lecturerName}</p>
                  <p><strong>Date:</strong> ${date}</p>
                  <p><strong>Time:</strong> ${time} (Asia/Colombo Time)</p>
                  
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
    } else {
        // Default: Admin Notification
        let recipients: string[] = [];
        try {
            const settingsRef = doc(db, 'settings', 'admin');
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
                const data = settingsSnap.data();
                if (data.notificationEmails && Array.isArray(data.notificationEmails)) {
                    recipients = data.notificationEmails;
                }
            }
        } catch (error) {
            console.error('Error fetching admin settings:', error);
        }

        const defaultAdminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        const allRecipients = new Set<string>();
        recipients.forEach(email => allRecipients.add(email));
        if (defaultAdminEmail) allRecipients.add(defaultAdminEmail);
        const toEmails = Array.from(allRecipients).join(', ');

        if (!toEmails) console.warn('No recipient emails configured.');

        mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: toEmails,
          subject: `New Booking: ${courseName} - ${userName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New Booking Received</h2>
              <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
                <p><strong>Booking ID:</strong> ${bookingId}</p>
                <hr style="border: 1px solid #ddd;" />
                <h3 style="color: #555;">Student Details</h3>
                <p><strong>Name:</strong> ${userName}</p>
                <p><strong>Email:</strong> ${userEmail}</p>
                <p><strong>Phone:</strong> ${userPhoneNumber || 'Not Provided'}</p>
                <p><strong>User ID:</strong> ${userId}</p>
                <h3 style="color: #555;">Booking Information</h3>
                <p><strong>Course:</strong> ${courseName}</p>
                <p><strong>Type:</strong> ${classType}</p>
                <p><strong>Lecturer:</strong> ${lecturerName}</p>
                <p><strong>Date:</strong> ${date}</p>
                <p><strong>Time:</strong> ${time} (Asia/Colombo Time)</p>
                <p><strong>Price:</strong> ${price ? `Rs. ${price}` : '-'}</p>
                <h3 style="color: #555;">Payment Details</h3>
                <p><strong>Method:</strong> ${paymentMethod}</p>
                ${receiptUrl ? `<p><strong>Receipt:</strong> <a href="${receiptUrl}">View Receipt</a></p>` : ''}
              </div>
              <p style="color: #888; font-size: 12px; margin-top: 20px;">
                This email was automatically generated by the SmartLabs Booking System.
              </p>
            </div>
          `,
        };
    }

    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        if (error) {
          console.error('SMTP Connection Error:', error);
          reject(error);
        } else {
          console.log('Server is ready to take our messages');
          resolve(success);
        }
      });
    });

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ message: 'Email notification sent successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email notification', details: error.message },
      { status: 500 }
    );
  }
}
