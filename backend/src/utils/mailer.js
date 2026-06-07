const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const logger = require("./logger");

async function sendOtpEmail(toEmail, otpCode, type = "registration") {
  const isReset = type === "reset" || type === "password_reset";
  const subject = isReset
    ? "Your Password Reset OTP - Bharat Cyber Nyay Portal"
    : "Your Registration OTP - Bharat Cyber Nyay Portal";
  const bodyText = isReset
    ? "Please use the following One Time Password (OTP) to reset your password. This code will expire in 5 minutes."
    : "Please use the following One Time Password (OTP) to complete your registration. This code will expire in 5 minutes.";
  const mailOptions = {
    from: `"Bharat Cyber Nyay Portal" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0c4a6e; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Bharat Cyber Nyay Portal OTP</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #334155;">Hello,</p>
          <p style="font-size: 16px; color: #334155;">${bodyText}</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="display: inline-block; padding: 15px 30px; font-size: 24px; font-weight: bold; background-color: #f1f5f9; color: #0284c7; border-radius: 8px; letter-spacing: 4px;">
              ${otpCode}
            </span>
          </div>
          <p style="font-size: 14px; color: #64748b;">If you did not request this OTP, please ignore this email.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">© 2026 Bharat Cyber Nyay Portal. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info("OTP sent to email successfully", { email: toEmail });
  } catch (error) {
    logger.error("Error sending OTP email", error, { email: toEmail });
    throw new Error("Failed to send OTP email. Please check your SMTP configuration.");
  }
}

async function sendWelcomeEmail(toEmail, name) {
  const mailOptions = {
    from: `"Bharat Cyber Nyay Portal" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Welcome to Bharat Cyber Nyay Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0c4a6e; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Welcome to BCNP</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #334155;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">Thank you for registering on the <strong>Bharat Cyber Nyay Portal</strong>.</p>
          <p style="font-size: 16px; color: #334155;">Your account has been successfully created. You can now login to file cybercrime reports, track your case status, and communicate directly with assigned investigators.</p>
          <p style="font-size: 14px; color: #64748b; margin-top: 30px;">If you need assistance, please do not hesitate to contact our support team.</p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">© ${new Date().getFullYear()} Bharat Cyber Nyay Portal. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info("Welcome email sent successfully", { email: toEmail });
  } catch (error) {
    logger.error("Error sending welcome email", error, { email: toEmail });
  }
}

async function sendLoginAlertEmail(toEmail, name) {
  const loginTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
  const mailOptions = {
    from: `"Bharat Cyber Nyay Portal" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "New Login Detected - Bharat Cyber Nyay Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0c4a6e; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Login Alert</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #334155;">Hello <strong>${name}</strong>,</p>
          <p style="font-size: 16px; color: #334155;">We detected a successful login to your Bharat Cyber Nyay Portal account.</p>
          <p style="font-size: 16px; color: #334155; padding: 10px; background-color: #f1f5f9; border-radius: 6px;">
            <strong>Time:</strong> ${loginTime} IST
          </p>
          <p style="font-size: 14px; color: #dc2626; margin-top: 20px; font-weight: bold;">
            If this was not you, please reset your password immediately or contact our support team to secure your account.
          </p>
        </div>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; border-top: 1px solid #e2e8f0;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0;">© ${new Date().getFullYear()} Bharat Cyber Nyay Portal. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info("Login alert email sent successfully", { email: toEmail });
  } catch (error) {
    logger.error("Error sending login alert email", error, { email: toEmail });
  }
}

module.exports = {
  sendOtpEmail,
  sendWelcomeEmail,
  sendLoginAlertEmail
};
