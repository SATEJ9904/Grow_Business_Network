/**
 * Database Seeding Script
 * Creates initial admin user for the application
 * Run: node seed.js
 */

require('dotenv').config();

const mongoose = require('mongoose');
const { connectDatabase } = require('./config/db');
const User = require('./models/User');
const Chapter = require('./models/Chapter');

const ADMIN_EMAIL = 'Admin@gbn.com';
const ADMIN_PASSWORD = 'AdminGBN@123';


/**
 * Seed database with initial admin user and chapters
 */
const seedDatabase = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log(`📍 MONGO_URL: ${process.env.MONGO_URL}`);
    console.log(`📍 MONGO_DATABASE: ${process.env.MONGO_DATABASE}\n`);

    // Connect to MongoDB using the database configuration with timeout
    const connectionPromise = connectDatabase();
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('MongoDB connection timeout after 30 seconds')), 30000)
    );

    await Promise.race([connectionPromise, timeoutPromise]);

    console.log('✅ Connected to MongoDB\n');

    // Step 1: Create chapters first (if they don't exist)
    let defaultChapterId = null;
    const chaptersCount = await Chapter.countDocuments();

    if (chaptersCount === 0) {
      console.log('📍 Creating sample chapters...');
      // Create sample chapters
      const chapters = [
        {
          name: 'Mumbai Chapter',
          city: 'Mumbai',
          description: 'Networking Club Mumbai Chapter',
        },
        {
          name: 'Bangalore Chapter',
          city: 'Bangalore',
          description: 'Networking Club Bangalore Chapter',
        },
        {
          name: 'Delhi Chapter',
          city: 'Delhi',
          description: 'Networking Club Delhi Chapter',
        },
        {
          name: 'Pune Chapter',
          city: 'Pune',
          description: 'Networking Club Pune Chapter',
        },
        {
          name: 'Hyderabad Chapter',
          city: 'Hyderabad',
          description: 'Networking Club Hyderabad Chapter',
        },
      ];

      const createdChapters = await Chapter.insertMany(chapters);
      defaultChapterId = createdChapters[0]._id; // Use Mumbai as default
      console.log('✅ Sample chapters created successfully!');
      console.log(`📍 Total chapters created: ${chapters.length}\n`);
    } else {
      // If chapters already exist, get the first one
      const firstChapter = await Chapter.findOne();
      defaultChapterId = firstChapter._id;
      console.log(`ℹ️  Chapters already exist: ${chaptersCount}`);
      console.log(`📍 Using chapter: ${firstChapter.name}\n`);
    }

    // Step 2: Create admin user
    const adminExists = await User.findOne({ email: ADMIN_EMAIL });

    if (adminExists) {
      console.log(`⚠️  Admin user already exists: ${ADMIN_EMAIL}`);
      console.log(`ID: ${adminExists._id}\n`);
    } else {
      console.log('👤 Creating admin user...');
      // Create admin user
      const adminUser = new User({
        name: 'Admin GBN',
        email: ADMIN_EMAIL,
        mobile: '9999999999',
        password: ADMIN_PASSWORD,
        companyName: 'Networking Club',
        chapterId: defaultChapterId, // Assign first chapter
        role: 'admin',
        status: 'approved',
        isEmailVerified: true,
      });

      // Save admin user (password will be hashed automatically)
      await adminUser.save();

      console.log('✅ Admin user created successfully!\n');
      console.log('='.repeat(50));
      console.log('📧 Email: ' + ADMIN_EMAIL);
      console.log('🔐 Password: ' + ADMIN_PASSWORD);
      console.log('🆔 User ID: ' + adminUser._id);
      console.log('='.repeat(50) + '\n');
    }

    // Display all users
    const allUsers = await User.find({});
    console.log('📋 All Users in Database:');
    console.log('═'.repeat(50));  
    allUsers.forEach((user) => {
      console.log(`\nName: ${user.name}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Status: ${user.status}`);
      console.log(`ID: ${user._id}`);
    });

    console.log('\n' + '═'.repeat(50));
    console.log('✅ Database seeding completed!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error seeding database:');
    console.error('─'.repeat(50));
    console.error('Error Message:', error.message);
    console.error('Error Code:', error.code);
    console.error('─'.repeat(50));
    
    // Provide troubleshooting hints
    if (error.message.includes('timeout')) {
      console.error('\n⚠️  MongoDB Connection Timeout Troubleshooting:');
      console.error('   1. Verify MONGO_URL is reachable: ' + process.env.MONGO_URL);
      console.error('   2. Check firewall/security groups allow MongoDB port');
      console.error('   3. Verify MONGO_DATABASE name: ' + process.env.MONGO_DATABASE);
      console.error('   4. Check MongoDB service is running');
    } else if (error.message.includes('undefined')) {
      console.error('\n⚠️  Environment Variable Missing:');
      console.error('   Required: MONGO_URL, MONGO_DATABASE, MONGO_AUTH_SOURCE');
      console.error('   Current values:');
      console.error('   - MONGO_URL:', process.env.MONGO_URL ? '✅ Set' : '❌ Not set');
      console.error('   - MONGO_DATABASE:', process.env.MONGO_DATABASE ? '✅ Set' : '❌ Not set');
      console.error('   - MONGO_AUTH_SOURCE:', process.env.MONGO_AUTH_SOURCE ? '✅ Set' : '❌ Not set');
    }
    
    process.exit(1);
  }
};

// Run seeding
seedDatabase();
