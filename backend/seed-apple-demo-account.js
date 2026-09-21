/**
 * Apple App Review Demo Account Seed Script
 * Creates a single "role: demo" account so App Review can sign in and use
 * every feature (browse chapters/members, edit profile, generate a
 * website, report/block, request account deletion) without paying the
 * membership fee or waiting for a human admin to approve a real
 * registration. Demo accounts are treated as approved for login purposes
 * but are hidden from other members' directories/search and never trigger
 * the "new member joined" broadcast email - see memberController.js /
 * adminController.js for where `role === 'demo'` is excluded.
 *
 * Run: node backend/seed-apple-demo-account.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Chapter = require('./models/Chapter');

const DEMO_EMAIL = 'appreview@gbnsocialassociations.in';
const DEMO_PASSWORD = 'AppleReview@2026';

const seedAppleDemoAccount = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = `${process.env.MONGO_URL}/${process.env.MONGO_DATABASE}?authSource=${process.env.MONGO_AUTH_SOURCE || 'admin'}`;
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    const existing = await User.findOne({ email: DEMO_EMAIL });
    if (existing) {
      console.log('⚠️  Apple demo account already exists!');
      console.log(`Email: ${existing.email}`);
      console.log(`Status: ${existing.status}, Role: ${existing.role}`);
      return;
    }

    let chapter = await Chapter.findOne();
    if (!chapter) {
      chapter = await Chapter.create({
        name: 'Pune Chapter',
        city: 'Pune',
        description: 'Pune chapter of GBN - Grow Business Network',
      });
      console.log('📍 Created a default chapter for the demo account');
    }

    const demoUser = new User({
      name: 'App Review Demo',
      email: DEMO_EMAIL,
      mobile: '9999999999',
      password: DEMO_PASSWORD,
      city: chapter.city,
      chapterId: chapter._id,
      role: 'demo',
      status: 'approved',
      paymentStatus: 'paid',
      isEmailVerified: true,
      companyName: 'GBN Review Enterprises',
      businessCategory: 'Information Technology',
      industry: 'Software Services',
      tagline: 'Sample business profile for App Review',
      description: 'This is a demo business profile provided for app review purposes.',
    });

    await demoUser.save();

    console.log('✅ Apple App Review demo account created successfully!');
    console.log('\n📋 Credentials to paste into App Store Connect → App Review Information → Notes:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Email   : ${DEMO_EMAIL}`);
    console.log(`Password: ${DEMO_PASSWORD}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  } catch (error) {
    console.error('❌ Error seeding Apple demo account:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

seedAppleDemoAccount();
