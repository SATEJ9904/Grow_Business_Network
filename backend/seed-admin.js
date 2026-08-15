/**
 * Admin User Seed Script
 * Creates initial admin user in database
 * Run: node backend/seed-admin.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    const mongoUri = `${process.env.MONGO_URL}/${process.env.MONGO_DATABASE}?authSource=${process.env.MONGO_AUTH_SOURCE || 'admin'}`;
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@gbn.com' });
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log(`Email: ${existingAdmin.email}`);
      console.log(`Status: ${existingAdmin.status}`);
      console.log(`Role: ${existingAdmin.role}`);
      return;
    }

    // Create admin user
    console.log('👤 Creating admin user...');
    
    // Dummy chapter ID (create a test chapter first if needed)
    let chapterId = new mongoose.Types.ObjectId();

    // Check if any chapter exists
    const Chapter = require('./models/Chapter');
    const existingChapter = await Chapter.findOne();
    if (existingChapter) {
      chapterId = existingChapter._id;
    } else {
      // Create a default chapter
      const defaultChapter = new Chapter({
        name: 'Default Chapter',
        city: 'Default',
        description: 'Default chapter for admin',
      });
      await defaultChapter.save();
      chapterId = defaultChapter._id;
      console.log('📍 Created default chapter');
    }

    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@gbn.com',
      mobile: '9876543210',
      password: 'Admin@123',
      companyName: 'GBN Admin',
      city: 'Admin City',
      chapterId: chapterId,
      role: 'admin',
      status: 'approved',
      isEmailVerified: true,
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully!');
    console.log('\n📋 Admin Credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Email  : admin@gbn.com');
    console.log('Password: Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n⚠️  IMPORTANT:');
    console.log('1. Change the default password immediately in production');
    console.log('2. Update email to your actual admin email');
    console.log('3. Access admin panel at: http://localhost:3000/admin');
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the script
seedAdmin();