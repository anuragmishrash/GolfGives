const cron = require('node-cron');
const { supabase } = require('../lib/supabase');
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
      const { data: usersToRemind, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, subscription_plan, subscription_renewal_date')
        .eq('subscription_status', 'active')
        .eq('renewal_reminder_sent', false)
        .gte('subscription_renewal_date', today.toISOString())
        .lte('subscription_renewal_date', threeDaysFromNow.toISOString());

      if (error) {
        console.error('[Scheduler] Error fetching users:', error.message);
        return;
      }

      console.log(`[Scheduler] Found ${(usersToRemind || []).length} users to remind`);

      for (const user of (usersToRemind || [])) {
        await emailService.sendSubscriptionRenewalReminderEmail({
          name: user.full_name,
          email: user.email,
          plan: user.subscription_plan,
          renewalDate: user.subscription_renewal_date,
          amount: user.subscription_plan === 'monthly' ? '£9.99' : '£99.99',
        }).catch(console.error);

        await supabase
          .from('profiles')
          .update({ renewal_reminder_sent: true })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('[Scheduler] Renewal reminder error:', error);
    }
  });

  console.log('[Scheduler] Renewal reminder scheduler started');
}

module.exports = { startRenewalScheduler };
