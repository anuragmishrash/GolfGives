const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { supabase } = require('../lib/supabase');
const asyncHandler = require('../utils/asyncHandler');
const emailService = require('../services/emailService');
const { PRIZE_POOL_FROM_SUBSCRIPTION } = require('../utils/constants');

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
  let customerId = user.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.full_name || user.name,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await supabase
      .from('profiles')
      .update({ stripe_customer_id: customerId })
      .eq('id', user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    client_reference_id: user.id, // CRITICAL: reliable user ID for webhook
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${process.env.FRONTEND_URL || process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL || process.env.CLIENT_URL}/subscribe?cancelled=true`,
    metadata: {
      userId: user.id,
      supabase_user_id: user.id, // double-stored for reliability
      plan,
    },
    subscription_data: {
      metadata: {
        userId: user.id,
        supabase_user_id: user.id,
        plan,
      },
    },
  });

  res.json({ success: true, data: { sessionUrl: session.url, sessionId: session.id } });
});

// Helper to process successful checkouts (used by webhook AND sync verify)
const activateSubscription = async (session) => {
  // Use client_reference_id as primary source (most reliable), metadata as fallback
  const userId = session.client_reference_id ||
                 session.metadata?.userId ||
                 session.metadata?.supabase_user_id;
  const plan = session.metadata?.plan || 'monthly';

  if (!userId) {
    console.error('[Webhook] No userId found in session:', session.id);
    return false;
  }

  // Check if we already activated this (idempotency)
  const { data: currentProfile } = await supabase
    .from('profiles')
    .select('subscription_status, stripe_subscription_id')
    .eq('id', userId)
    .single();

  if (currentProfile?.subscription_status === 'active' && currentProfile?.stripe_subscription_id) {
    return true; // Already processed
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(session.subscription);

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*, charities(name)')
    .eq('id', userId)
    .single();

  if (!profile) return false;

  const amount = stripeSubscription.items.data[0].price.unit_amount; // cents
  const charityPercent = profile.charity_percentage || 10;
  const charityAmount = amount * (charityPercent / 100);
  const remainingAfterCharity = amount - charityAmount;
  const prizePoolTotal = remainingAfterCharity * PRIZE_POOL_FROM_SUBSCRIPTION;

  // Update profile subscription fields
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      stripe_subscription_id: stripeSubscription.id,
      stripe_customer_id: stripeSubscription.customer,
      subscription_plan: plan,
      subscription_start_date: new Date(stripeSubscription.start_date * 1000).toISOString(),
      subscription_renewal_date: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    })
    .eq('id', userId);

  // Record subscription payment
  await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_subscription_id: stripeSubscription.id,
      stripe_payment_intent_id: session.payment_intent,
      plan,
      amount,
      currency: stripeSubscription.currency,
      status: 'active',
      charity_contribution: charityAmount,
      prize_pool_contribution: prizePoolTotal,
      period_start: new Date(stripeSubscription.current_period_start * 1000).toISOString(),
      period_end: new Date(stripeSubscription.current_period_end * 1000).toISOString(),
    });

  // Update charity total contributed
  if (profile.charity_id) {
    const { data: charityRow } = await supabase
      .from('charities')
      .select('total_contributed')
      .eq('id', profile.charity_id)
      .single();

    if (charityRow) {
      await supabase
        .from('charities')
        .update({ total_contributed: (charityRow.total_contributed || 0) + (charityAmount / 100) })
        .eq('id', profile.charity_id);
    }
  }

  const charityName = profile.charities?.name || 'the general charity pool';

  emailService.sendSubscriptionActivatedEmail({
    name: profile.full_name,
    email: profile.email,
    plan,
    renewalDate: stripeSubscription.current_period_end * 1000,
    charityName,
    charityAmount: (charityAmount / 100).toFixed(2),
  }).catch(console.error);

  console.log(`✅ Subscription activated for user ${userId}`);
  return true;
};

// ── GET /api/subscriptions/verify-session ───────────────────────────────────
exports.verifySession = asyncHandler(async (req, res) => {
  const { session_id } = req.query;
  if (!session_id) return res.status(400).json({ success: false, message: 'session_id required' });

  const session = await stripe.checkout.sessions.retrieve(session_id);
  
  if (session.payment_status !== 'paid') {
    return res.status(400).json({ success: false, message: 'Payment not completed' });
  }

  await activateSubscription(session);

  res.json({ success: true, message: 'Subscription activated' });
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
        await activateSubscription(session);
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const status = sub.status === 'active' ? 'active'
          : sub.status === 'past_due' ? 'lapsed'
          : 'inactive';

        await supabase
          .from('profiles')
          .update({
            subscription_status: status,
            subscription_renewal_date: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
            renewal_reminder_sent: false,
          })
          .eq('id', userId);
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        const userId = sub.metadata?.userId;
        if (!userId) break;

        const { data: profile } = await supabase
          .from('profiles')
          .update({ subscription_status: 'cancelled' })
          .eq('id', userId)
          .select()
          .single();

        if (profile) {
          emailService.sendSubscriptionCancelledEmail({
            name: profile.full_name,
            email: profile.email,
            accessUntil: sub.current_period_end,
          }).catch(console.error);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('stripe_customer_id', invoice.customer)
          .single();

        if (profile) {
          await supabase
            .from('profiles')
            .update({ subscription_status: 'lapsed' })
            .eq('id', profile.id);

          emailService.sendPaymentFailedEmail({
            name: profile.full_name,
            email: profile.email,
            amount: (invoice.amount_due / 100).toFixed(2),
            retryDate: invoice.next_payment_attempt
              ? new Date(invoice.next_payment_attempt * 1000).toLocaleDateString()
              : 'a later date',
          }).catch(console.error);
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
  const userId = req.user.id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan, subscription_renewal_date, stripe_subscription_id')
    .eq('id', userId)
    .single();

  // Aggregate prize pool from active subscription records
  const { data: poolData } = await supabase
    .from('subscriptions')
    .select('prize_pool_contribution, charity_contribution')
    .eq('status', 'active');

  const totals = (poolData || []).reduce((acc, row) => {
    acc.totalPrizePool += row.prize_pool_contribution || 0;
    acc.totalCharity += row.charity_contribution || 0;
    return acc;
  }, { totalPrizePool: 0, totalCharity: 0 });

  res.json({
    success: true,
    data: {
      subscriptionStatus: profile?.subscription_status,
      subscriptionPlan: profile?.subscription_plan,
      subscriptionRenewalDate: profile?.subscription_renewal_date,
      stripeSubscriptionId: profile?.stripe_subscription_id,
      prizePool: {
        total: totals.totalPrizePool / 100,
        fiveMatch: (totals.totalPrizePool * 0.40) / 100,
        fourMatch: (totals.totalPrizePool * 0.35) / 100,
        threeMatch: (totals.totalPrizePool * 0.25) / 100,
      },
    },
  });
});

// ── POST /api/subscriptions/cancel ────────────────────────────────────────────
exports.cancelSubscription = asyncHandler(async (req, res) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_subscription_id')
    .eq('id', req.user.id)
    .single();

  if (!profile?.stripe_subscription_id) {
    return res.status(400).json({ success: false, message: 'No active subscription found' });
  }

  // Cancel at period end (user retains access until renewal date)
  await stripe.subscriptions.update(profile.stripe_subscription_id, {
    cancel_at_period_end: true,
  });

  res.json({
    success: true,
    message: 'Subscription will be cancelled at the end of the current period',
  });
});

// ── POST /api/subscriptions/sync ────────────────────────────────────────────
// Fallback: called by PaymentSuccess page if webhook is delayed.
// Pulls status directly from Stripe and updates Supabase.
exports.syncSubscription = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id, stripe_subscription_id, subscription_status')
    .eq('id', userId)
    .single();

  // Already active — no sync needed
  if (profile?.subscription_status === 'active') {
    return res.json({ success: true, data: { subscription_status: 'active' } });
  }

  // No subscription on Stripe yet — try finding via session_id
  const { session_id } = req.body;
  if (session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(session_id);
      if (session.payment_status === 'paid') {
        await activateSubscription(session);
        return res.json({ success: true, data: { subscription_status: 'active' } });
      }
    } catch (err) {
      console.error('[Sync] session lookup failed:', err.message);
    }
  }

  // Fall back to stripe_subscription_id if already stored
  if (profile?.stripe_subscription_id) {
    const stripeSub = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
    const status = stripeSub.status === 'active' ? 'active' : 'inactive';

    await supabase
      .from('profiles')
      .update({
        subscription_status: status,
        subscription_renewal_date: new Date(stripeSub.current_period_end * 1000).toISOString(),
      })
      .eq('id', userId);

    return res.json({ success: true, data: { subscription_status: status } });
  }

  return res.json({ success: true, data: { subscription_status: profile?.subscription_status || 'inactive' } });
});
