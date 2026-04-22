const nodemailer = require("nodemailer");

let transporter = null;
let usingTestAccount = false;

// Initialize transporter: try SMTP (Gmail) first, fall back to Ethereal test account for local/dev
(async function initTransporter() {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      throw new Error('Missing EMAIL_USER or EMAIL_PASSWORD environment variables');
    }

    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.verify();
    console.log("✅ SMTP transporter is ready to send emails using:", process.env.EMAIL_USER);
  } catch (err) {
    console.warn('⚠️ SMTP setup failed:', err.message);
    console.warn('Fallback: Creating Ethereal test account for local email testing.');

    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      usingTestAccount = true;
      console.log('✅ Ethereal test account created. Emails will be previewed locally.');
      console.log(`Ethereal user: ${testAccount.user}`);
      console.log(`Ethereal pass: ${testAccount.pass}`);
    } catch (ethErr) {
      console.error('❌ Failed to create test account:', ethErr.message);
      throw ethErr;
    }
  }
  })();
  
  async function sendWelcomeEmail(studentName, studentEmail, studentPRN, frontendUrl) {
    try {
      if (!transporter) {
        throw new Error('Email transporter not initialized');
      }

      // Allow frontendUrl override or use env
      const siteUrl = frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

      if (!studentEmail) {
        throw new Error('No recipient email provided to sendWelcomeEmail');
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER || 'no-reply@smartcomplaint.example.com',
        to: studentEmail,
        subject: "Welcome to Smart Complaint Management System",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
            <h2 style="color: #2c3e50; text-align: center;">Welcome to Smart Complaint Management System</h2>
            
            <p style="color: #555; font-size: 16px;">Dear <strong>${studentName}</strong>,</p>
            
            <p style="color: #555; font-size: 16px;">
              Thank you for signing up! We're excited to have you as part of our community. Your account has been successfully created.
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3 style="color: #2c3e50; margin-top: 0;">Your Account Details</h3>
              <p style="color: #555;"><strong>Name:</strong> ${studentName}</p>
              <p style="color: #555;"><strong>PRN:</strong> ${studentPRN}</p>
              <p style="color: #555;"><strong>Email:</strong> ${studentEmail}</p>
            </div>
            
            <p style="color: #555; font-size: 16px;">
              You can now log in to the system using your PRN and password to submit and track your complaints.
            </p>
            
            <h3 style="color: #2c3e50;">Features Available:</h3>
            <ul style="color: #555; font-size: 14px;">
              <li>Submit new complaints</li>
              <li>Track complaint status in real-time</li>
              <li>Receive notifications on updates</li>
              <li>View complaint history</li>
            </ul>
            
            <p style="color: #555; font-size: 16px; margin-top: 20px;">
              If you have any questions or need assistance, please don't hesitate to contact our support team.
            </p>
            
            <p style="color: #555; font-size: 16px;">
              Best regards,<br/>
              <strong>Smart Complaint Management System Team</strong>
            </p>
  
            <p style="margin-top: 16px;">
              <a href="${siteUrl}" target="_blank" rel="noopener noreferrer" style="color:#0ea5e9; text-decoration:none;">Visit our website</a>
            </p>
            
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">
              This is an automated email. Please do not reply to this email address.
            </p>
  
            <div style="border-top:1px solid #eef2f6; padding-top:12px; display:flex; justify-content:space-between; align-items:center; gap:12px;">
              <div style="color:#94a3b8; font-size:12px;">© ${new Date().getFullYear()} Smart Complaint Management</div>
              <div style="font-size:12px; color:#94a3b8;">This is an automated message — please do not reply</div>
            </div>
          </div>
        `,
      };
  
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Welcome email sent:", info.response);
      return { success: true, message: "Welcome email sent successfully" };
    } catch (error) {
      console.error("❌ Email sending error:", error);
      return { success: false, message: "Failed to send welcome email", error };
    }
  }
async function sendStatusUpdateEmail(
  studentName,
  studentEmail,
  complaintId,
  complaintTitle,
  newStatus,
  remarks,
  frontendUrl
) {
  try {
    if (!transporter) {
      throw new Error('Email transporter not initialized');
    }

    if (!studentEmail) {
      throw new Error('No recipient email provided');
    }

    const siteUrl =
      frontendUrl || process.env.FRONTEND_URL || 'http://localhost:5173';

    const statusColor =
      newStatus === "Resolved"
        ? "#16a34a"
        : newStatus === "In Progress"
        ? "#f59e0b"
        : "#ef4444";

    const mailOptions = {
      from:
        process.env.EMAIL_FROM ||
        process.env.EMAIL_USER ||
        "no-reply@smartcomplaint.example.com",
      to: studentEmail,
      subject: `Complaint Status Updated - ${complaintId}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #2c3e50; text-align: center;">
            Complaint Status Update
          </h2>

          <p>Dear <strong>${studentName}</strong>,</p>

          <p>Your complaint status has been updated. Here are the details:</p>

          <div style="background:#f8fafc; padding:15px; border-radius:6px; margin:20px 0;">
            <p><strong>Complaint ID:</strong> ${complaintId}</p>
            <p><strong>Problem:</strong> ${complaintTitle}</p>
            <p>
              <strong>Status:</strong> 
              <span style="color:${statusColor}; font-weight:bold;">
                ${newStatus}
              </span>
            </p>
            ${
              remarks
                ? `<p><strong>Remarks:</strong> ${remarks}</p>`
                : ""
            }
          </div>

          <p>You can log in to track further updates.</p>

          <p style="margin-top: 16px;">
            <a href="${siteUrl}" 
               style="background:#0ea5e9;color:white;padding:10px 15px;border-radius:5px;text-decoration:none;">
               View Complaint
            </a>
          </p>

          <p style="margin-top:20px;">
            Best regards,<br/>
            <strong>Smart Complaint Management System</strong>
          </p>

          <hr/>
          <p style="font-size:12px;color:#999;text-align:center;">
            This is an automated email. Please do not reply.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Status update email sent:", info.response);

    return { success: true };
  } catch (error) {
    console.error("❌ Status email error:", error);
    return { success: false, error };
  }
}
module.exports = { sendWelcomeEmail, sendStatusUpdateEmail };
