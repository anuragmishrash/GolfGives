/**
 * seedAdmin.js — Supabase version
 * 
 * Seeds an admin user and a test subscriber in Supabase.
 * Run: node scripts/seedAdmin.js
 * 
 * NOTE: Supabase Auth handles password hashing — no bcrypt needed.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const { supabase } = require('../lib/supabase');

const seedData = async () => {
  try {
    console.log('🌱 Seeding Supabase database...');

    // ── 1. Seed Admin User ──────────────────────────────────────────────────
    const adminEmail = 'itsanuragmishra99@gmail.com';
    const adminPass = '987654321Anu';

    // Check if admin already exists in profiles
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('email', adminEmail)
      .single();

    if (existingAdmin) {
      // Update role to admin if not already
      await supabase
        .from('profiles')
        .update({ role: 'admin', subscription_status: 'active' })
        .eq('id', existingAdmin.id);
      console.log('✅ Existing user updated to Admin role');
    } else {
      // Create via Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: adminEmail,
        password: adminPass,
        options: { data: { full_name: 'Anurag Mishra (Admin)' } },
      });

      if (signUpError) {
        console.error('❌ Admin signup error:', signUpError.message);
      } else {
        // Upsert profile with admin role
        await supabase.from('profiles').upsert({
          id: authData.user.id,
          email: adminEmail,
          full_name: 'Anurag Mishra (Admin)',
          role: 'admin',
          subscription_status: 'active',
        });
        console.log('✅ Admin user created:', adminEmail);
      }
    }

    // ── 2. Seed Test Subscriber ─────────────────────────────────────────────
    const subEmail = 'test@golfgives.com';

    const { data: existingSub } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', subEmail)
      .single();

    if (existingSub) {
      console.log('ℹ️  Test subscriber already exists');
    } else {
      const { data: subAuthData, error: subSignUpError } = await supabase.auth.signUp({
        email: subEmail,
        password: 'Test@123456',
        options: { data: { full_name: 'Test Subscriber' } },
      });

      if (subSignUpError) {
        console.error('❌ Subscriber signup error:', subSignUpError.message);
      } else {
        const subId = subAuthData.user.id;

        await supabase.from('profiles').upsert({
          id: subId,
          email: subEmail,
          full_name: 'Test Subscriber',
          role: 'subscriber',
          subscription_status: 'active',
        });

        // Seed 5 scores for the test subscriber
        const now = new Date();
        const scores = [
          { user_id: subId, score: 42, score_date: new Date(now - 5 * 86400000).toISOString().split('T')[0] },
          { user_id: subId, score: 38, score_date: new Date(now - 4 * 86400000).toISOString().split('T')[0] },
          { user_id: subId, score: 40, score_date: new Date(now - 3 * 86400000).toISOString().split('T')[0] },
          { user_id: subId, score: 45, score_date: new Date(now - 2 * 86400000).toISOString().split('T')[0] },
          { user_id: subId, score: 35, score_date: new Date(now - 1 * 86400000).toISOString().split('T')[0] },
        ];

        const { error: scoresError } = await supabase.from('scores').insert(scores);
        if (scoresError) console.error('Score insert error:', scoresError.message);
        else console.log('✅ Test subscriber created with 5 scores:', subEmail);
      }
    }

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
