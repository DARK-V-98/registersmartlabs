
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { logoBase64 } from '@/lib/logo-base64';

// Define a type for the autoTable method since it's not in the default jsPDF types
interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: any) => jsPDF;
  lastAutoTable: { finalY: number };
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
        // --- PDF INVOICE GENERATION ---
        const doc = new jsPDF() as jsPDFWithAutoTable;
        
        const primaryColor = '#0984e3'; // From globals.css --primary: 210 85% 55%; approx
        const mutedColor = '#747d8c';

        // --- Header ---
        if (logoBase64) {
            doc.addImage(logoBase64, 'PNG', 14, 15, 25, 25);
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(24);
        doc.setTextColor(primaryColor);
        doc.text('INVOICE', 205, 30, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(mutedColor);
        doc.text('SmartLabs', 14, 45);
        doc.text('3rd Floor, No. 326, Jana Jaya Building', 14, 50);
        doc.text('Rajagiriya, Sri Lanka', 14, 55);

        // --- Bill To & Invoice Details ---
        doc.setLineWidth(0.1);
        doc.line(14, 65, 205, 65);

        doc.setFontSize(10);
        doc.setTextColor('#000000');
        doc.setFont('helvetica', 'bold');
        doc.text('BILL TO', 14, 75);
        
        doc.setFont('helvetica', 'normal');
        doc.text(userName, 14, 80);
        doc.text(userEmail, 14, 85);
        if(userPhoneNumber) doc.text(userPhoneNumber, 14, 90);

        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE #', 140, 75);
        doc.text('DATE', 140, 82);
        doc.text('STATUS', 140, 89);
        
        doc.setFont('helvetica', 'normal');
        doc.text(bookingId, 170, 75);
        doc.text(new Date().toLocaleDateString(), 170, 82);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#27ae60');
        doc.text('PAID', 170, 89);

        doc.setTextColor('#000000');
        doc.line(14, 98, 205, 98);

        // --- Invoice Table ---
        const tableColumn = ["DESCRIPTION", "LECTURER", "DATE & TIME", "AMOUNT (LKR)"];
        const tableRows = [
            [
              `${courseName} (${duration} Hour(s), ${classType})`,
              lecturerName,
              `${date} @ ${time}`,
              price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            ]
        ];

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 105,
            theme: 'striped',
            styles: {
                font: 'helvetica',
                fontSize: 10,
            },
            headStyles: { 
                fillColor: [9, 132, 227], // primaryColor
                textColor: [255, 255, 255],
                fontStyle: 'bold',
            },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 14, right: 14 }
        });

        const finalY = doc.lastAutoTable.finalY || 150;

        // --- Totals ---
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('TOTAL', 140, finalY + 15);
        doc.text(`LKR ${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 205, finalY + 15, { align: 'right' });


        // --- Footer ---
        const pageHeight = doc.internal.pageSize.height;
        doc.setLineWidth(0.1);
        doc.line(14, pageHeight - 35, 205, pageHeight - 35);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(mutedColor);
        doc.text('Thank you for choosing SmartLabs!', 14, pageHeight - 25);
        doc.text('If you have any questions, please contact info@smartlabs.lk', 14, pageHeight - 20);
        doc.text('This is a computer-generated invoice and does not require a signature.', doc.internal.pageSize.width / 2, pageHeight - 10, { align: 'center'});

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
