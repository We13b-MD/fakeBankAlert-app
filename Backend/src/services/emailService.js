import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

export const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,     // STARTTLS (not SSL port 465 which Render blocks)
      family: 4,         // Force IPv4 to bypass Render's IPv6 issue
      auth: {
        user: process.env.EMAIL_USER || 'idundunmd13@gmail.com',
        pass: process.env.EMAIL_PASS || 'rokqnzgnvpldjuos'
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    const mailOptions = {
      from: `"FBA Detector Security" <idundunmd13@gmail.com>`,
      to: email,
      subject: 'Security: Your Account Verification OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #f8fafc;">
          <h2 style="color: #0f172a; text-align: center; border-bottom: 2px solid #0d9488; padding-bottom: 10px;">FBA Detector Security</h2>
          <p style="color: #334155; font-size: 16px;">Hello,</p>
          <p style="color: #334155; font-size: 16px;">To securely authenticate your account, please use the 6-digit confirmation code below. This code expires in 5 minutes.</p>
          <div style="background-color: #0d9488; color: white; padding: 15px; text-align: center; font-size: 28px; font-weight: bold; letter-spacing: 8px; border-radius: 8px; margin: 25px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            ${otp}
          </div>
          <p style="color: #64748b; font-size: 12px; text-align: center; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[SUCCESS] Email OTP sent successfully to ${email}`);

    return true;
  } catch (error) {
    console.error('[ERROR] Failed to send Email OTP:', error);
    throw new Error('Failed to send Email OTP');
  }
};
