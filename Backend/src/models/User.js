import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String },

    email: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      lowercase: true,
    },

    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    password: {
      type: String,
    },

    // 🔐 Phone verification
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },

    phoneVerification: {
      otpHash: String,
      expiresAt: Date,
    },

    // Google OAuth Authentication
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    googleEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    avatar: { type: String },

    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('User', userSchema);
