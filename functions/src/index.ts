/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Get the Gmail email and password from the environment configuration
// These are set using the Firebase CLI:
// firebase functions:config:set gmail.email="your-email@gmail.com"
// firebase functions:config:set gmail.password="your-16-digit-app-password"
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

// Create a Nodemailer transporter for sending emails via Gmail
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

// The email address you want notifications sent to.
// Make sure this is the same email you used to generate the App Password.
const ADMIN_EMAIL = gmailEmail;

/**
 * Cloud Function that triggers when a new document is created in the 'bookings' collection.
 * It sends an email notification with the booking details.
 */
export const sendBookingNotificationEmail = functions.firestore
  .document("bookings/{bookingId}")
  .onCreate(async (snap) => {
    // Get the data from the newly created booking document
    const booking = snap.data();

    // Check if booking data exists
    if (!booking) {
      functions.logger.error("No data associated with the event");
      return;
    }

    // Email content
    const mailOptions = {
      from: `"SmartLabs Bookings" <${gmailEmail}>`,
      to: ADMIN_EMAIL,
      subject: `New Booking Received: ${booking.courseName}`,
      html: `
        <h1>New Booking Received!</h1>
        <p>A new class has been booked. Here are the details:</p>
        <table style="border-collapse: collapse; width: 100%; font-family: sans-serif;">
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 12px; font-weight: bold;">Student Name:</td>
                <td style="padding: 12px;">${booking.userName || "N/A"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd; background-color: #f9f9f9;">
                <td style="padding: 12px; font-weight: bold;">Course:</td>
                <td style="padding: 12px;">${booking.courseName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 12px; font-weight: bold;">Lecturer:</td>
                <td style="padding: 12px;">${booking.lecturerName}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd; background-color: #f9f9f9;">
                <td style="padding: 12px; font-weight: bold;">Date & Time:</td>
                <td style="padding: 12px;">${booking.date} at ${booking.time}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 12px; font-weight: bold;">Class Type:</td>
                <td style="padding: 12px;">${booking.classType}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd; background-color: #f9f9f9;">
                <td style="padding: 12px; font-weight: bold;">Price:</td>
                <td style="padding: 12px;">LKR ${booking.price?.toLocaleString() || "0"}</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
                <td style="padding: 12px; font-weight: bold;">Booking Status:</td>
                <td style="padding: 12px;">${booking.bookingStatus.replace(/_/g, " ")}</td>
            </tr>
        </table>
        <p style="margin-top: 20px;">Please log in to the admin dashboard to review and confirm this booking.</p>
      `,
    };

    try {
      await mailTransport.sendMail(mailOptions);
      functions.logger.log("New booking email sent successfully to:", ADMIN_EMAIL);
    } catch (error) {
      functions.logger.error(
        "There was an error while sending the notification email:",
        error
      );
    }
  });
