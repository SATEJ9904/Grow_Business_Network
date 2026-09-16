/**
 * Demo Members Seed Script
 * Creates ~30 demo members spread across several chapters and business
 * categories, so the admin dashboard / directory has sample data to browse.
 * Run: node backend/seed-demo-members.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Chapter = require('./models/Chapter');

const CHAPTERS = [
  { name: 'Kolhapur Chapter', city: 'Kolhapur' },
  { name: 'Pune Chapter', city: 'Pune' },
  { name: 'Mumbai Chapter', city: 'Mumbai' },
  { name: 'Nagpur Chapter', city: 'Nagpur' },
  { name: 'Nashik Chapter', city: 'Nashik' },
  { name: 'Sangli Chapter', city: 'Sangli' },
];

const CATEGORIES = [
  { businessCategory: 'Real Estate', industry: 'Property Development' },
  { businessCategory: 'Information Technology', industry: 'Software Services' },
  { businessCategory: 'Healthcare', industry: 'Clinics & Diagnostics' },
  { businessCategory: 'Finance & Insurance', industry: 'Investment Advisory' },
  { businessCategory: 'Manufacturing', industry: 'Industrial Equipment' },
  { businessCategory: 'Food & Beverage', industry: 'Restaurants & Catering' },
  { businessCategory: 'Education', industry: 'Coaching & Training' },
  { businessCategory: 'Retail', industry: 'Apparel & Fashion' },
  { businessCategory: 'Automobile', industry: 'Auto Sales & Service' },
  { businessCategory: 'Legal Services', industry: 'Corporate Law' },
  { businessCategory: 'Event Management', industry: 'Weddings & Corporate Events' },
  { businessCategory: 'Construction', industry: 'Civil Contracting' },
  { businessCategory: 'Media & Advertising', industry: 'Digital Marketing' },
  { businessCategory: 'Travel & Tourism', industry: 'Travel Agency' },
  { businessCategory: 'Interior Design', industry: 'Home & Office Interiors' },
];

const FIRST_NAMES = [
  'Rahul', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Anjali', 'Suresh', 'Kavita',
  'Rajesh', 'Neha', 'Sanjay', 'Pooja', 'Manoj', 'Divya', 'Ashok', 'Swati',
  'Ganesh', 'Meera', 'Prakash', 'Ritu', 'Deepak', 'Sunita', 'Vijay', 'Anita',
  'Nitin', 'Shreya', 'Ramesh', 'Komal', 'Sachin', 'Pallavi',
];

const LAST_NAMES = [
  'Sharma', 'Patil', 'Deshmukh', 'Kulkarni', 'Joshi', 'Kadam', 'Chavan',
  'Pawar', 'Shinde', 'Jadhav', 'More', 'Bhosale', 'Gaikwad', 'Nikam', 'Rane',
];

const COMPANY_SUFFIXES = [
  'Enterprises', 'Traders', 'Solutions', 'Group', 'Industries', 'Associates',
  'Ventures', 'Services', 'Corporation', 'Pvt Ltd',
];

function pick(arr, i) {
  return arr[i % arr.length];
}

async function connect() {
  const mongoUri = `${process.env.MONGO_URL}/${process.env.MONGO_DATABASE}?authSource=${process.env.MONGO_AUTH_SOURCE || 'admin'}`;
  console.log('🔌 Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  console.log('✅ Connected to MongoDB');
}

async function ensureChapters() {
  const chapterDocs = [];
  for (const ch of CHAPTERS) {
    let existing = await Chapter.findOne({ name: ch.name });
    if (!existing) {
      existing = await Chapter.create({
        name: ch.name,
        city: ch.city,
        description: `${ch.city} chapter of GBN - Grow Business Network`,
      });
      console.log('📍 Created chapter:', ch.name);
    } else {
      console.log('📍 Using existing chapter:', ch.name);
    }
    chapterDocs.push(existing);
  }
  return chapterDocs;
}

async function seedMembers() {
  await connect();
  const chapters = await ensureChapters();

  const COUNT = 30;
  const created = [];

  for (let i = 0; i < COUNT; i++) {
    const firstName = pick(FIRST_NAMES, i);
    const lastName = pick(LAST_NAMES, i + 3);
    const name = `${firstName} ${lastName}`;
    const chapter = pick(chapters, i);
    const category = pick(CATEGORIES, i);
    const suffix = pick(COMPANY_SUFFIXES, i + 2);
    const companyName = `${firstName} ${category.businessCategory.split(' ')[0]} ${suffix}`;
    const email = `demo.${firstName}.${lastName}${i}@gbndemo.com`.toLowerCase();
    const mobile = `9${(100000000 + i * 7919 + 12345).toString().slice(-9)}`;

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('⏭️  Skipping (already exists):', email);
      continue;
    }

    const user = new User({
      name,
      email,
      mobile,
      password: 'Demo@1234',
      companyName,
      chapterId: chapter._id,
      city: chapter.city,
      state: 'Maharashtra',
      businessCategory: category.businessCategory,
      industry: category.industry,
      tagline: `Trusted ${category.businessCategory} partner in ${chapter.city}`,
      description: `${companyName} provides quality ${category.businessCategory.toLowerCase()} services in ${chapter.city} and nearby areas.`,
      aboutBusiness: `We specialize in ${category.industry.toLowerCase()} with a strong focus on customer satisfaction and long-term business relationships.`,
      businessStarted: String(2010 + (i % 14)),
      employees: pick(['1-10', '11-50', '51-100', '100+'], i),
      turnover: pick(['Under 10L', '10L-50L', '50L-1Cr', '1Cr+'], i),
      gstRegistered: i % 3 === 0 ? 'No' : 'Yes',
      businessType: pick(['Manufacturer', 'Trader', 'Service Provider', 'Distributor'], i),
      role: 'member',
      status: 'approved',
      paymentStatus: 'paid',
      accountStatus: 1,
      enforcementStatus: 'ACTIVE',
      isEmailVerified: true,
    });

    await user.save();
    created.push(user.email);
    console.log(`✅ Created (${created.length}/${COUNT}):`, name, '-', companyName, '-', chapter.name, '-', category.businessCategory);
  }

  console.log(`\n🎉 Done. Created ${created.length} new demo members.`);
}

seedMembers()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  });
