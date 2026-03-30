import axios from 'axios'
import crypto from 'crypto';

export const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString()
};

export const hashOtp = (otp) => {
  return crypto.createHash('sha256').update(otp).digest('hex')
};

// sends OTP via sms (Termii example)

// Sends OTP via SMS (Termii example)
/*export const sendOtp = async (phoneNumber, otp) => {
  if (process.env.PHONE_VERIFICATION_MODE === 'mock') {
    console.log(`[MOCK SMS] OTP sent to ${phoneNumber}`);
    return;
  }

  await axios.post('https://termii.com/api/sms/send', {
    to: phoneNumber,
    message: `Your verification code is ${otp}`,
    from: 'FakeBankAlert',
    channel: 'dnd',
  }, {
    headers: {
      Authorization: `Bearer ${process.env.TERMII_API_KEY}`,
    },
  });
};*/


export const sendOtp = async (phoneNumber, otp) => {
  if (process.env.PHONE_VERIFICATION_MODE === 'mock') {
    console.log(`[MOCK SMS] OTP sent to ${phoneNumber}: ${otp}`);
    return;
  }

  try {
    const response = await axios.post('https://api.ng.termii.com/api/sms/send', {
      api_key: process.env.TERMII_API_KEY,  // API key goes in BODY not header
      to: phoneNumber,                       // format: 2348012345678 (no + sign)
      from: process.env.TERMII_SENDER_ID,
      sms: `Your verification code is ${otp}. Valid for 5 minutes.`,
      type: 'plain',
      channel: 'generic',                   // generic works for all numbers
    });

    console.log('Termii response:', response.data);
    return response.data;

  } catch (err) {
    console.error('Termii SMS error:', err.response?.data || err.message);
    throw new Error('Failed to send OTP');
  }
};