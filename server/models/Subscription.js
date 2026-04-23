const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
  },
  stripePaymentIntentId: {
    type: String,
    default: null,
  },
  plan: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true,
  },
  amount: {
    type: Number, // In cents
    required: true,
  },
  currency: {
    type: String,
    default: 'usd',
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'past_due', 'incomplete'],
    default: 'active',
  },
  charityContribution: {
    type: Number,
    default: 0,
  },
  prizePoolContribution: {
    type: Number,
    default: 0,
  },
  periodStart: {
    type: Date,
    required: true,
  },
  periodEnd: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ stripeSubscriptionId: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);
module.exports = Subscription;
