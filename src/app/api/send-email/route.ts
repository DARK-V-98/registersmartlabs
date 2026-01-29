

import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import jsPDF from 'jspdf';


const getInvoiceHtml = (bookingData: any) => {
    // Ensure safe data with fallbacks
    const safeData = {
        bookingId: bookingData.bookingId || 'N/A',
        userName: bookingData.userName || 'N/A',
        userEmail: bookingData.userEmail || 'N/A',
        userPhoneNumber: bookingData.userPhoneNumber || '',
        courseName: bookingData.courseName || 'N/A',
        lecturerName: bookingData.lecturerName || 'N/A',
        date: bookingData.date || 'N/A',
        time: bookingData.time || 'N/A',
        classType: bookingData.classType || 'N/A',
        duration: bookingData.duration || 1,
        price: typeof bookingData.price === 'number' ? bookingData.price : 0,
    };

    return `
    <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; max-width: 800px; margin: 20px auto; padding: 0; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.05); border-radius: 8px; overflow: hidden;">
        <div style="background-color: hsl(210, 30%, 96%); color: hsl(220, 15%, 25%); padding: 40px;">
            <table cellpadding="0" cellspacing="0" style="width: 100%;">
                <tr>
                    <td>
                        <h1 style="font-size: 32px; margin: 0; font-weight: bold;">INVOICE</h1>
                    </td>
                    <td style="text-align: right;">
                        <strong style="font-size: 24px;">SmartLabs</strong>
                    </td>
                </tr>
            </table>
        </div>
        <div style="padding: 30px;">
            <table cellpadding="0" cellspacing="0" style="width: 100%; line-height: inherit; text-align: left; font-size: 14px;">
                <tr class="top">
                    <td colspan="2" style="padding-bottom: 30px; vertical-align: top;">
                        <table style="width: 100%; line-height: inherit; text-align: left;">
                            <tr>
                                <td style="vertical-align: top;">
                                    <strong style="color: #555;">Bill To:</strong><br>
                                    ${safeData.userName}<br>
                                    ${safeData.userEmail}<br>
                                    ${safeData.userPhoneNumber}
                                </td>
                                <td style="text-align: right; vertical-align: top;">
                                    <strong>Invoice #:</strong> ${safeData.bookingId}<br>
                                    <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
                                    <strong>Status:</strong> <span style="color: #27ae60; font-weight: bold;">PAID</span>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
                
                <tr class="heading" style="background: hsl(210, 30%, 96%); font-weight: bold;">
                    <td style="padding: 12px; vertical-align: top; border-bottom: 1px solid #ddd;">Description</td>
                    <td style="padding: 12px; vertical-align: top; text-align: right; border-bottom: 1px solid #ddd;">Amount (LKR)</td>
                </tr>
                <tr class="item">
                    <td style="padding: 12px; vertical-align: top; border-bottom: 1px solid #eee;">
                        <strong>${safeData.courseName}</strong> - ${safeData.lecturerName}<br>
                        <small style="color: #555;">Date: ${safeData.date} @ ${safeData.time} (${safeData.duration} Hour(s), ${safeData.classType} class)</small>
                    </td>
                    <td style="padding: 12px; vertical-align: top; text-align: right; border-bottom: 1px solid #eee;">${safeData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr class="total">
                    <td style="padding: 5px; vertical-align: top;"></td>
                    <td style="padding: 20px 12px 0; vertical-align: top; text-align: right; border-top: 2px solid #333; font-weight: bold; font-size: 1.3em;">
                        Total: LKR ${safeData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                </tr>
            </table>
        </div>
         <div style="background-color: #f7f7f7; color: #777; font-size: 12px; text-align: center; padding: 20px; border-top: 1px solid #eee;">
            <p>Thank you for choosing SmartLabs. This is a computer-generated invoice and does not require a signature.</p>
            <p>If you have any questions, please contact us at info@smartlabs.lk</p>
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
        // Use a rich HTML template for the email body
        const invoiceHtml = getInvoiceHtml(body);

        // --- MANUAL PDF INVOICE GENERATION ---
        const doc = new jsPDF();
        
        // Ensure data is safe for PDF generation
        const safeData = {
          bookingId: bookingId || 'N/A',
          userName: userName || 'N/A',
          userEmail: userEmail || 'N/A',
          userPhoneNumber: userPhoneNumber || '',
          courseName: courseName || 'N/A',
          lecturerName: lecturerName || 'N/A',
          date: date || 'N/A',
          time: time || 'N/A',
          classType: classType || 'N/A',
          duration: duration || 1,
          price: typeof price === 'number' ? price : 0,
        };

        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();

        // --- PDF DESIGN ---
        const headingColor = '#1F2937'; // Dark Gray
        const textColor = '#4B5563'; // Gray
        const lightGrayColor = '#F3F4F6';

        // Header Background
        doc.setFillColor(lightGrayColor);
        doc.rect(0, 0, pageWidth, 50, 'F');
        
        // Titles
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(headingColor);
        doc.text('INVOICE', 20, 30);
        
        doc.setFontSize(16);
        doc.text('SmartLabs', pageWidth - 20, 30, { align: 'right' });


        // Billing Information Section
        let yPos = 70;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(headingColor);
        doc.text('Bill To', 20, yPos);
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor);
        doc.text(safeData.userName, 20, yPos + 6);
        doc.text(safeData.userEmail, 20, yPos + 11);
        if (safeData.userPhoneNumber) {
          doc.text(safeData.userPhoneNumber, 20, yPos + 16);
        }

        // Invoice Details
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(headingColor);
        doc.text('Invoice #:', pageWidth - 60, yPos);
        doc.text('Date:', pageWidth - 60, yPos + 6);
        doc.text('Status:', pageWidth - 60, yPos + 12);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor);
        doc.text(safeData.bookingId, pageWidth - 20, yPos, { align: 'right' });
        doc.text(new Date().toLocaleDateString(), pageWidth - 20, yPos + 6, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.setTextColor('#22C55E'); // Green
        doc.text('PAID', pageWidth - 20, yPos + 12, { align: 'right' });

        // Table Header
        yPos += 30;
        doc.setFillColor(lightGrayColor);
        doc.rect(15, yPos, pageWidth - 30, 10, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(headingColor);
        doc.text('DESCRIPTION', 20, yPos + 7);
        doc.text('AMOUNT (LKR)', pageWidth - 20, yPos + 7, { align: 'right' });
        yPos += 10;

        // Table Item
        doc.setDrawColor(lightGrayColor);
        doc.line(15, yPos, pageWidth - 15, yPos); // Line under header
        yPos += 5;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(headingColor);
        doc.text(`${safeData.courseName} - ${safeData.lecturerName}`, 20, yPos + 5);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(textColor);
        doc.setFontSize(8);
        doc.text(`Date: ${safeData.date} @ ${safeData.time} (${safeData.duration} Hour(s), ${safeData.classType} class)`, 20, yPos + 10);
        
        doc.setFontSize(10);
        doc.text(safeData.price.toLocaleString('en-LK', { minimumFractionDigits: 2 }), pageWidth - 20, yPos + 5, { align: 'right' });
        yPos += 15;
        doc.line(15, yPos, pageWidth - 15, yPos); // Line under item
        yPos += 10;
        
        // Total
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(headingColor);
        doc.text('Total', pageWidth - 60, yPos);
        doc.text(`LKR ${safeData.price.toLocaleString('en-LK', { minimumFractionDigits: 2 })}`, pageWidth - 20, yPos, { align: 'right' });
        
        // Footer
        const finalY = pageHeight - 30 > yPos ? pageHeight - 30 : yPos + 30;
        doc.setFillColor(lightGrayColor);
        doc.rect(0, finalY, pageWidth, 30, 'F');
        doc.setFontSize(9);
        doc.setTextColor(textColor);
        doc.text('Thank you for choosing SmartLabs. This is a computer-generated invoice.', pageWidth / 2, finalY + 12, { align: 'center' });
        doc.text('If you have any questions, please contact us at info@smartlabs.lk', pageWidth / 2, finalY + 18, { align: 'center' });

        const pdfBuffer = doc.output('arraybuffer');
        // --- END PDF GENERATION ---


        mailOptions = {
            from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
            to: userEmail,
            subject: `Booking Confirmed & Invoice: ${courseName}`,
            html: invoiceHtml,
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

    if (!mailOptions.to) {
        console.warn('No recipients for email, skipping send.');
        return NextResponse.json({ message: 'Email skipped, no recipients.' }, { status: 200 });
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
