import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as nodemailer from "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// Get email credentials from environment configuration
const gmailEmail = functions.config().gmail.email;
const gmailPassword = functions.config().gmail.password;

// Nodemailer transport for sending emails
const mailTransport = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPassword,
  },
});

/**
 * Sends a notification email to all registered admin emails when a new
 * booking is created.
 */
export const sendBookingNotificationToAdmin = functions.firestore
  .document("bookings/{bookingId}")
  .onCreate(async (snap) => {
    const booking = snap.data();

    // Get admin notification emails from Firestore settings
    const recipients: string[] = [];
    try {
      const settingsRef = db.doc("settings/admin");
      const settingsSnap = await settingsRef.get();
      if (settingsSnap.exists) {
        const settingsData = settingsSnap.data();
        if (
          settingsData?.notificationEmails &&
          Array.isArray(settingsData.notificationEmails)
        ) {
          recipients.push(...settingsData.notificationEmails);
        }
      }
    } catch (error) {
      functions.logger.error(
        "Error fetching admin notification emails:",
        error
      );
    }

    // Fallback to the sender email if no recipients are configured
    if (recipients.length === 0) {
      recipients.push(gmailEmail);
      functions.logger.warn("No admin emails configured. Sending to default.");
    }

    const mailOptions = {
      from: `"smartlabs Bookings" <${gmailEmail}>`,
      to: recipients.join(","),
      subject: `New Booking: ${booking.courseName} - ${booking.userName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px;">
          <h2>New Booking Received for Review</h2>
          <p>A new class booking requires your attention. Here are the details:</p>
          <table style="width: 100%; border-collapse: collapse;">
              <tbody>
                  <tr><td style="padding: 8px; font-weight: bold;">Booking ID:</td><td>${
                    snap.id
                  }</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Student:</td><td>${
                    booking.userName
                  }</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Student Phone:</td><td>${
                    booking.userPhoneNumber || "Not Provided"
                  }</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Course:</td><td>${
                    booking.courseName
                  }</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Date & Time:</td><td>${
                    booking.date
                  } at ${booking.time}</td></tr>
                  <tr><td style="padding: 8px; font-weight: bold;">Price:</td><td>LKR ${booking.price?.toLocaleString()}</td></tr>
              </tbody>
          </table>
          <p>Please log in to the admin dashboard to confirm this booking.</p>
        </div>
      `,
    };

    try {
      await mailTransport.sendMail(mailOptions);
      functions.logger.log(
        "Admin booking notification sent to:",
        recipients.join(",")
      );
    } catch (error) {
      functions.logger.error(
        "There was an error sending the admin notification:",
        error
      );
    }

    return null;
  });

/**
 * Sends a confirmation email to the user when their booking status is
 * updated to 'confirmed'.
 */
export const sendBookingConfirmationToUser = functions.firestore
  .document("bookings/{bookingId}")
  .onUpdate(async (change) => {
    // This Cloud Function is intentionally left blank.
    // The confirmation email with invoice is now handled by the /api/send-email
    // route, triggered from the admin panel. This prevents duplicate emails.
    return null;
  });
