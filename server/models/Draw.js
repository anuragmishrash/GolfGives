const mongoose = require('mongoose');

const drawResultSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid'],
    default: 'pending',
  },
}, { _id: true });

const drawSchema = new mongoose.Schema({
  month: {
    type: String, // Format: "2026-04"
    required: [true, 'Month is required'],
    unique: true,
    match: [/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'],
  },
  status: {
    type: String,
    enum: ['pending', 'simulated', 'published'],
    default: 'pending',
  },
  drawType: {
    type: String,
    enum: ['random', 'algorithmic'],
    default: 'random',
  },
  winningNumbers: {
    type: [Number],
    validate: {
      validator: function (nums) {
        return nums.length === 0 || nums.length === 5;
      },
      message: 'Draw must have exactly 5 winning numbers',
    },
    default: [],
  },
  jackpotRolledOver: {
    type: Boolean,
    default: false,
  },
  jackpotAmount: {
    type: Number,
    default: 0,
  },
  results: {
    type: [drawResultSchema],
    default: [],
  },
  prizePoolSnapshot: {
    fiveMatch: { type: Number, default: 0 },
    fourMatch: { type: Number, default: 0 },
    threeMatch: { type: Number, default: 0 },
  },
  simulationNote: {
    type: String,
    default: null,
  },
}, {
  timestamps: true,
});

// ── Indexes ────────────────────────────────────────────────────────────────────
// Note: month unique index declared at field level. Adding status index:
drawSchema.index({ status: 1 });

const Draw = mongoose.model('Draw', drawSchema);
module.exports = Draw;
