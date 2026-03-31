import axios from 'axios'
import crypto from 'crypto';

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
};

export const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex')
};

// Sends OTP via SMS (Termii)
export const sendOtp = async (phoneNumber, otp) => {
  if (process.env.PHONE_VERIFICATION_MODE === 'mock') {
    console.log(`[MOCK SMS] OTP for ${phoneNumber} sent`);
    return;
  }

  try {
    const response = await axios.post('https://api.ng.termii.com/api/sms/send', {
      api_key: process.env.TERMII_API_KEY,
      to: phoneNumber,
      from: process.env.TERMII_SENDER_ID,
      sms: `Your verification code is ${otp}. Valid for 5 minutes.`,
      type: 'plain',
      channel: 'generic',
    });

    return response.data;

  } catch (err) {
    console.error('Termii SMS error:', err.response?.data || err.message);
    throw new Error('Failed to send OTP');
  }
};