import User from '../models/User.js'
import { generateOtp, hashOtp, sendOtp } from '../services/phoneVerificationService.js'

export const startPhoneVerification = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.isPhoneVerified) {
      return res.status(400).json({
        message: 'Phone number already verified',
      });
    }

    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({
        message: 'Invalid phone number',
      });
    }

    const otp = generateOtp();
    const otpHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    user.phoneNumber = phoneNumber;
    user.phoneVerification = { otpHash, expiresAt };

    await user.save();
    await sendOtp(phoneNumber, otp);

    return res.status(200).json({
      message: 'OTP sent to phone number',
    });
  } catch (err) {
    console.error('Start verification error:', err);
    return res.status(500).json({
      message: 'Failed to send OTP',
    });
  }
};


// Confirm OTP
export const confirmPhoneVerification = async (req, res) => {
  try {
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const user = await User.findById(req.user._id);

    if (!user || !user.phoneVerification) {
      return res.status(400).json({
        message: 'No verification in progress',
      });
    }

    if (user.phoneVerification.expiresAt < new Date()) {
      return res.status(400).json({
        message: 'OTP expired',
      });
    }

    // Hash the provided OTP using the same method used when generating
    const providedOtpHash = hashOtp(otp);

    if (providedOtpHash !== user.phoneVerification.otpHash) {
      return res.status(400).json({
        message: 'Invalid OTP',
      });
    }

    user.isPhoneVerified = true;
    user.phoneVerification = undefined;

    await user.save();

    return res.status(200).json({
      message: 'Phone number verified successfully',
    });
  } catch (err) {
    console.error('OTP verification error:', err);
    return res.status(500).json({
      message: 'OTP verification failed',
    });
  }
};
