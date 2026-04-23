const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Score sub-schema
const scoreSchema = new mongoose.Schema({
  score: {
    type: Number,
    required: true,
    min: [1, 'Score must be between 1 and 45'],
    max: [45, 'Score must be between 1 and 45'],
  },
  date: {
    type: Date,
    required: true,
  },
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  passwordHash: {
    type: String,
    required: true,
    select: false, // Never return password in queries
  },
  role: {
    type: String,
    enum: ['subscriber', 'admin'],
    default: 'subscriber',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'lapsed'],
    default: 'inactive',
  },
  stripeCustomerId: {
    type: String,
    default: null,
  },
  stripeSubscriptionId: {
    type: String,
    default: null,
  },
  subscriptionPlan: {
    type: String,
    enum: ['monthly', 'yearly', null],
    default: null,
  },
  subscriptionStartDate: {
    type: Date,
    default: null,
  },
  subscriptionRenewalDate: {
    type: Date,
    default: null,
  },
  renewalReminderSent: {
    type: Boolean,
    default: false,
  },
  selectedCharityId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Charity',
    default: null,
  },
  charityContributionPercent: {
    type: Number,
    default: 10,
    min: [10, 'Minimum charity contribution is 10%'],
    max: [50, 'Maximum charity contribution is 50%'],
  },
  scores: {
    type: [scoreSchema],
    validate: {
      validator: function (scores) {
        return scores.length <= 5;
      },
      message: 'Maximum 5 scores allowed (rolling window)',
    },
  },
  totalWinnings: {
    type: Number,
    default: 0,
  },
  refreshToken: {
    type: String,
    default: null,
    select: false,
  },
}, {
  timestamps: true,
});

// ── Indexes ────────────────────────────────────────────────────────────────────
// Note: email unique index is declared via schema field. Adding non-unique indexes:
userSchema.index({ stripeCustomerId: 1 });
userSchema.index({ subscriptionStatus: 1 });

// ── Methods ────────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (plainPassword) {
  const user = await User.findById(this._id).select('+passwordHash');
  return bcrypt.compare(plainPassword, user.passwordHash);
};

// Virtual: isEligibleForDraw (5 scores + active subscription)
userSchema.virtual('isEligibleForDraw').get(function () {
  return this.subscriptionStatus === 'active' && this.scores.length === 5;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
