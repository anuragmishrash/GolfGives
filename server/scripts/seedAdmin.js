require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Seed Admin
    const adminEmail = 'itsanuragmishra99@gmail.com';
    const adminPass = '987654321Anu';
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      const passwordHash = await bcrypt.hash(adminPass, 12);
      admin = await User.create({
        name: 'Anurag Mishra (Admin)',
        email: adminEmail,
        passwordHash,
        role: 'admin',
        subscriptionStatus: 'active',
      });
      console.log('✅ Admin user created successfully');
    } else {
      admin.role = 'admin';
      admin.subscriptionStatus = 'active';
      await admin.save();
      console.log('✅ Existing user updated to Admin successfully');
    }

    // 2. Seed Test Subscriber
    const subEmail = 'test@golfgives.com';
    let sub = await User.findOne({ email: subEmail });

    if (!sub) {
      const passwordHash = await bcrypt.hash('Test@123456', 12);
      
      const now = new Date();
      // Generate 5 distinct dates
      const scores = [
        { score: 42, date: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) },
        { score: 38, date: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000) },
        { score: 40, date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
        { score: 45, date: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) },
        { score: 35, date: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000) },
      ];

      sub = await User.create({
        name: 'Test Subscriber',
        email: subEmail,
        passwordHash,
        role: 'subscriber',
        subscriptionStatus: 'active',
        scores,
      });
      console.log('✅ Test subscriber seeded successfully');
    } else {
      console.log('ℹ️ Test subscriber already exists');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
