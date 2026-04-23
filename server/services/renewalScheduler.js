const cron = require('node-cron');
const User = require('../models/User');
const emailService = require('./emailService');

function startRenewalScheduler() {
  // Runs every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] Checking upcoming subscription renewals...');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    try {
      const usersToRemind = await User.find({
        subscriptionStatus: 'active',
        subscriptionRenewalDate: { $gte: today, $lte: threeDaysFromNow },
        renewalReminderSent: { $ne: true }
      });

      console.log(`[Scheduler] Found ${usersToRemind.length} users to remind`);

      for (const user of usersToRemind) {
        await emailService.sendSubscriptionRenewalReminderEmail({
          name: user.name,
          email: user.email,
          plan: user.subscriptionPlan,
          renewalDate: user.subscriptionRenewalDate,
          amount: user.subscriptionPlan === 'monthly' ? '£9.99' : '£99.99'
        });
        
        await User.findByIdAndUpdate(user._id, { renewalReminderSent: true });
      }
    } catch (error) {
      console.error('[Scheduler] Renewal reminder error:', error);
    }
  });

  console.log('[Scheduler] Renewal reminder scheduler started');
}

module.exports = { startRenewalScheduler };
