const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Charity = require('../models/Charity');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/emailService');
const { PRIZE_POOL_FROM_SUBSCRIPTION } = require('../utils/constants');

// Global prize pool state — stored in DB via Subscription aggregation
// These helpers compute it dynamically from Subscription records

// ── POST /api/subscriptions/create-checkout-session ───────────────────────────
exports.createCheckoutSession = asyncHandler(async (req, res) => {
  const { plan } = req.body; // 'monthly' or 'yearly'
  const user = req.user;

  const priceId = plan === 'yearly'
    ? process.env.STRIPE_YEARLY_PRICE_ID
    : process.env.STRIPE_MONTHLY_PRICE_ID;

  if (!priceId || priceId.includes('placeholder')) {
    return res.status(500).json({
      success: false,
      message: 'Stripe price IDs not configured. Please set STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID in .env',
    });
  }

  // Create or reuse Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
      metadata: { userId: user._id.toString() },
    });
    customerId = customer.id;
    await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.CLIENT_URL}/dashboard?subscription=success`,
    cancel_url: `${process.env.CLIENT_URL}/subscribe?cancelled=true`,
    metadata: {
      userId: user._id.toString(),
      plan,
    },
    subscription_data: {
      metadata: {
        userId: user._id.toString(),
        plan,
      },
    },
  });

  res.json({ success: true, data: { sessionUrl: session.url, sessionId: session.id } });
});

// ── POST /api/subscriptions/webhook ───────────────────────────────────────────
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('❌ Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ success: false, message: `Webhook Error: ${err.message}` });
  }

  console.log(`📦 Stripe webhook received: ${event.type}`);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        const plan = session.metadata?.plan || 'monthly';

        if (!userId) break;

        const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);
        const user = await User.findById(userId);
        if (!user) break;

        const amount = stripeSubscription.items.data[0].price.unit_amount; // in cents
        const charityPercent = user.charityContributionPercent || 10;
        const charityAmount = amount * (charityPercent / 100);
        const remainingAfterCharity = amount - charityAmount;
        const prizePoolTotal = remainingAfterCharity * PRIZE_POOL_FROM_SUBSCRIPTION;

        // Update user subscription status
        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: 'active',
          stripeSubscriptionId: stripeSubscription.id,
          subscriptionPlan: plan,
          subscriptionStartDate: new Date(stripeSubscription.start_date * 1000),
          subscriptionRenewalDate: new Date(stripeSubscription.current_period_end * 1000),
        });

        // Record subscription payment
        await Subscription.create({
          userId,
          stripeSubscriptionId: stripeSubscription.id,
          stripePaymentIntentId: session.payment_intent,
          plan,
          amount,
          currency: stripeSubscription.currency,
          status: 'active',
          charityContribution: charityAmount,
          prizePoolContribution: prizePoolTotal,
          periodStart: new Date(stripeSubscription.current_period_start * 1000),
          periodEnd: new Date(stripeSubscription.current_period_end * 1000),
        });

        // Update charity total contributed
        if (user.selectedCharityId) {
          await Charity.findByIdAndUpdate(user.selectedCharityId, {
            $inc: { totalContributed: charityAmount / 100 }, // Convert cents to dollars
          });
        }
        
        const charity = user.selectedCharityId ? await Charity.findById(user.selectedCharityId) : { name: 'the general charity pool' };

        emailService.sendSubscriptionActivatedEmail({
          name: user.name,
          email: user.email,
          plan: plan,
          renewalDate: stripeSubscription.current_period_end * 1000,
          charityName: charity.name,
          charityAmount: (charityAmount / 100).toFixed(2)
        });

        console.log(`✅ Subscription activated for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const status = sub.status === 'active' ? 'active' :
          sub.status === 'past_due' ? 'lapsed' : 'inactive';

        await User.findByIdAndUpdate(userId, {
          subscriptionStatus: status,
          subscriptionRenewalDate: new Date(sub.current_period_end * 1000),
          renewalReminderSent: false
        });
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (!userId) break;
        const user = await User.findByIdAndUpdate(userId, { subscriptionStatus: 'cancelled' });
        
        if (user) {
          emailService.sendSubscriptionCancelledEmail({
            name: user.name,
            email: user.email,
            accessUntil: sub.current_period_end
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        // Find user by stripe customer ID
        const user = await User.findOne({ stripeCustomerId: invoice.customer });
        if (user) {
          await User.findByIdAndUpdate(user._id, { subscriptionStatus: 'lapsed' });
          emailService.sendPaymentFailedEmail({
            name: user.name,
            email: user.email,
            amount: (invoice.amount_due / 100).toFixed(2),
            retryDate: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString() : 'a later date'
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error('❌ Error processing webhook:', err.message);
  }

  res.json({ received: true });
};

// ── GET /api/subscriptions/status ───────────────────────────────────────────
exports.getStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select('subscriptionStatus subscriptionPlan subscriptionRenewalDate stripeSubscriptionId')
    .lean();

  // Calculate prize pool totals from subscription records
  const prizePoolAgg = await Subscription.aggregate([
    { $match: { status: 'active' } },
    {
      $group: {
        _id: null,
        totalPrizePool: { $sum: '$prizePoolContribution' },
        totalCharity: { $sum: '$charityContribution' },
      },
    },
  ]);

  const prizePool = prizePoolAgg[0] || { totalPrizePool: 0, totalCharity: 0 };

  res.json({
    success: true,
    data: {
      ...user,
      prizePool: {
        total: prizePool.totalPrizePool / 100,
        fiveMatch: (prizePool.totalPrizePool * 0.40) / 100,
        fourMatch: (prizePool.totalPrizePool * 0.35) / 100,
        threeMatch: (prizePool.totalPrizePool * 0.25) / 100,
      },
    },
  });
});

// ── POST /api/subscriptions/cancel ────────────────────────────────────────────
exports.cancelSubscription = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).lean();
  if (!user.stripeSubscriptionId) {
    return res.status(400).json({ success: false, message: 'No active subscription found' });
  }

  // Cancel at period end (user retains access until renewal date)
  await stripe.subscriptions.update(user.stripeSubscriptionId, {
    cancel_at_period_end: true,
  });

  res.json({
    success: true,
    message: 'Subscription will be cancelled at the end of the current period',
  });
});
