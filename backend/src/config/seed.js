'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const seedUsers = [
  {
    name: 'Admin User',
    email: 'admin@civicguardian.com',
    password: 'Password123',
    role: 'admin',
    isEmailVerified: true,
  },
  {
    name: 'Moderator User',
    email: 'moderator@civicguardian.com',
    password: 'Password123',
    role: 'moderator',
    isEmailVerified: true,
  },
  {
    name: 'Citizen User',
    email: 'citizen@civicguardian.com',
    password: 'Password123',
    role: 'citizen',
    isEmailVerified: true,
  },
];

async function seedDatabase() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/civic_guardian_ai';
  
  try {
    console.log(`Connecting to MongoDB at: ${MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB.');

    console.log('Checking default users...');
    for (const seedUser of seedUsers) {
      const exists = await User.findOne({ email: seedUser.email });
      if (!exists) {
        await User.create(seedUser);
        console.log(`+ Seeded ${seedUser.role}: ${seedUser.email}`);
      } else {
        console.log(`- User already exists: ${seedUser.email}`);
      }
    }
    
    console.log('✅ Database seeding check complete!');
    console.log('\nDefault Accounts Registered:');
    console.log('--------------------------------------------------');
    console.log('1. Admin:     admin@civicguardian.com     / Password123');
    console.log('2. Moderator: moderator@civicguardian.com / Password123');
    console.log('3. Citizen:   citizen@civicguardian.com   / Password123');
    console.log('--------------------------------------------------\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
