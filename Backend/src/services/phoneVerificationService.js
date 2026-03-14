import axios from 'axios'
import crypto from 'crypto';

export const  generateOtp = () =>{
    return Math.floor(100000 + Math.random() * 900000).toString()
};

export const hashOtp = (otp) =>{
    return crypto.createHash('sha256').update(otp).digest('hex')
};

// sends OTP via sms (Termii example)

// Sends OTP via SMS (Termii example)
export const sendOtp = async (phoneNumber, otp) => {
  if (process.env.PHONE_VERIFICATION_MODE === 'mock') {
    console.log(`[MOCK SMS] OTP for ${phoneNumber}: ${otp}`);
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
};
