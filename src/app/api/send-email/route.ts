
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define a type for the autoTable method since it's not in the default jsPDF types
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
}

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
        // --- PDF INVOICE GENERATION ---
        const doc = new jsPDF() as jsPDFWithAutoTable;
        
        // Header
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Invoice', 14, 22);

        // Sub-header Info
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Booking ID: ${bookingId}`, 14, 30);
        doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, 14, 35);
        
        doc.text('Bill To:', 140, 30);
        doc.text(userName, 140, 35);
        doc.text(userEmail, 140, 40);

        // Invoice Table
        const tableColumn = ["Item", "Details", "Amount (LKR)"];
        const tableRows = [
            ["Course", courseName, price.toLocaleString()],
            ["Lecturer", lecturerName, ""],
            ["Date & Time", `${date} @ ${time} (LKT)`, ""],
            ["Duration", `${duration} Hour(s)`, ""],
            ["Class Type", classType, ""],
            [{ content: 'Total', styles: { fontStyle: 'bold' } }, "", { content: price.toLocaleString(), styles: { fontStyle: 'bold' } }]
        ];

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 50,
            theme: 'striped',
            headStyles: { fillColor: [3, 169, 244] }, // A blue color
        });

        const finalY = (doc.lastAutoTable as any).finalY || 100;
        doc.setFontSize(10);
        doc.text('Payment Confirmed. Thank you for choosing SmartLabs!', 14, finalY + 15);
        doc.text('This is a computer-generated invoice and does not require a signature.', 14, finalY + 20);

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
        // Fetch admin settings for notification emails
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
            // Continue with default admin email if fetching fails
        }

        // Combine fetched recipients with env ADMIN_EMAIL if available, removing duplicates
        const defaultAdminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;
        const allRecipients = new Set<string>();
        
        // Add Firestore recipients
        recipients.forEach(email => allRecipients.add(email));
        
        // Add default admin email
        if (defaultAdminEmail) {
            allRecipients.add(defaultAdminEmail);
        }
        
        const toEmails = Array.from(allRecipients).join(', ');

        if (!toEmails) {
            console.warn('No recipient emails configured. Using fallback.');
        }

        mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: toEmails, // Send notification to all admins
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

    // Verify connection configuration
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

    // Send email
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
