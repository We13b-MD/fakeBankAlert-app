/*import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    bankName: {
      type: String,
      required: true,
      trim: true,
    },

    accountNumber: {
      type: String,
      required: true,
      trim: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    transactionType: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },

    description: {
      type: String,
      trim: true,
    },

    timestamp: {
      type: Date,
      default: Date.now,
    },

    balanceAfterTransaction: {
      type: Number,
    },

    alertType: {
      type: String,
      enum: ['sms', 'email', 'push'], // optional for future features
      default: 'sms',
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Alert', alertSchema);*/


import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    bankName: { type: String, required: true, trim: true },
    accountNumber: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    transactionType: { type: String, enum: ['credit', 'debit'], required: true },
    description: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
    balanceAfterTransaction: { type: Number },
    alertType: { type: String, enum: ['sms', 'email', 'push'], default: 'sms' },

    // NEW FIELDS FOR DETECTION
    extracted: {
      bank: String,
      amount: String,
      reference: String,
      account: String,
    },
    warnings: { type: [String], default: [] },
    confidence: { type: Number, default: 0 },
    ocrText: { type: String },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('Alert', alertSchema);

