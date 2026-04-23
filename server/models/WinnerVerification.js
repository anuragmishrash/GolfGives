const mongoose = require('mongoose');

const winnerVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  drawId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Draw',
    required: true,
  },
  matchType: {
    type: String,
    enum: ['5-match', '4-match', '3-match'],
    required: true,
  },
  prizeAmount: {
    type: Number,
    required: true,
  },
  proofScreenshotUrl: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  adminNote: {
    type: String,
    default: null,
  },
  submittedAt: {
    type: Date,
    default: null,
  },
  reviewedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

winnerVerificationSchema.index({ userId: 1 });
winnerVerificationSchema.index({ drawId: 1 });
winnerVerificationSchema.index({ status: 1 });

const WinnerVerification = mongoose.model('WinnerVerification', winnerVerificationSchema);
module.exports = WinnerVerification;
