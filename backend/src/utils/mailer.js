const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const logger = require("./logger");

async function sendOtpEmail(toEmail, otpCode) {
  const mailOptions = {
    from: `"Bharat Cyber Nyay Portal" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: "Your Registration OTP - Bharat Cyber Nyay Portal",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #0c4a6e; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0;">Bharat Cyber Nyay Portal OTP</h2>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <p style="font-size: 16px; color: #334155;">Hello,</p>
          <p style="font-size: 16px; color: #334155;">Please use the following One Time Password (OTP) to complete your registration. This code will expire in 5 minutes.</p>
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

module.exports = {
  sendOtpEmail
};
