/**
 * setup-stripe.js
 * Run this once to create Stripe products and prices in test mode.
 * 
 * Usage: node setup-stripe.js
 * Then copy the printed Price IDs to your .env file.
 */

require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function setup() {
  if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('placeholder')) {
    console.error('❌ Set STRIPE_SECRET_KEY in .env first');
    process.exit(1);
  }

  console.log('🔧 Setting up Stripe products...\n');

  try {
    // Monthly product
    const monthlyProduct = await stripe.products.create({
      name: 'GolfGives Monthly',
      description: 'Monthly golf performance + charity + draw subscription',
    });
    const monthlyPrice = await stripe.prices.create({
      product: monthlyProduct.id,
      unit_amount: 999, // £9.99 in pence
      currency: 'gbp',
      recurring: { interval: 'month' },
    });

    // Yearly product
    const yearlyProduct = await stripe.products.create({
      name: 'GolfGives Yearly',
      description: 'Yearly golf performance + charity + draw subscription (save 17%)',
    });
    const yearlyPrice = await stripe.prices.create({
      product: yearlyProduct.id,
      unit_amount: 9999, // £99.99 in pence
      currency: 'gbp',
      recurring: { interval: 'year' },
    });

    console.log('✅ Products created!\n');
    console.log('Add these to your server/.env:\n');
    console.log(`STRIPE_MONTHLY_PRICE_ID=${monthlyPrice.id}`);
    console.log(`STRIPE_YEARLY_PRICE_ID=${yearlyPrice.id}`);
    console.log('\n📌 Also run the Stripe webhook listener:');
    console.log('stripe listen --forward-to localhost:5000/api/subscriptions/webhook');
    console.log('\nCopy the webhook secret and add to .env as STRIPE_WEBHOOK_SECRET=whsec_...');

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

setup();
