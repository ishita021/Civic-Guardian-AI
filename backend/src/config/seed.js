'use strict';

const mongoose = require('mongoose');
const User = require('../models/User');
const Issue = require('../models/Issue');
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

const demoIssues = [
  {
    title: 'Large pothole near Central Market',
    description: 'A deep pothole near the Central Market signal is slowing traffic and causing two-wheelers to swerve suddenly.',
    category: 'pothole',
    severity: 'high',
    priority: 'urgent',
    status: 'verified',
    location: {
      type: 'Point',
      coordinates: [77.5946, 12.9716],
      address: 'Central Market Road, near main traffic signal',
      city: 'Bengaluru',
      ward: 'Ward 12',
      landmark: 'Central Market',
    },
    aiCategory: 'Road Damage',
    aiPriority: 'urgent',
    aiConfidence: 94,
    aiDepartment: 'Road Maintenance Department',
    aiSuggestion: 'Barricade the damaged section and schedule urgent patch repair.',
    aiTags: ['pothole', 'road', 'traffic', 'safety'],
    confirmCount: 5,
    upvoteCount: 18,
  },
  {
    title: 'Garbage pile outside Green Park gate',
    description: 'Garbage has been dumped near the park entrance for three days and is causing bad smell in the area.',
    category: 'garbage',
    severity: 'medium',
    priority: 'high',
    status: 'pending',
    location: {
      type: 'Point',
      coordinates: [77.6011, 12.9784],
      address: 'Green Park Main Gate',
      city: 'Bengaluru',
      ward: 'Ward 18',
      landmark: 'Green Park',
    },
    aiCategory: 'Waste Management',
    aiPriority: 'high',
    aiConfidence: 91,
    aiDepartment: 'Sanitation Department',
    aiSuggestion: 'Assign collection team and inspect nearby dumping pattern.',
    aiTags: ['garbage', 'sanitation', 'park'],
    confirmCount: 2,
    upvoteCount: 11,
  },
  {
    title: 'Broken street light on Lake View Road',
    description: 'Street light pole number 14 is not working, making the road dark and unsafe after 8 PM.',
    category: 'broken_street_light',
    severity: 'medium',
    priority: 'medium',
    status: 'in_progress',
    location: {
      type: 'Point',
      coordinates: [77.6123, 12.9652],
      address: 'Lake View Road, pole 14',
      city: 'Bengaluru',
      ward: 'Ward 21',
      landmark: 'Lake View Apartments',
    },
    aiCategory: 'Street Lighting',
    aiPriority: 'medium',
    aiConfidence: 88,
    aiDepartment: 'Electrical Maintenance Department',
    aiSuggestion: 'Inspect wiring and replace the faulty LED unit.',
    aiTags: ['street light', 'safety', 'electrical'],
    confirmCount: 3,
    upvoteCount: 9,
  },
  {
    title: 'Water leakage near Metro Station',
    description: 'Continuous water leakage from an underground pipe is creating a slippery patch near the metro entrance.',
    category: 'water_leakage',
    severity: 'high',
    priority: 'urgent',
    status: 'pending',
    location: {
      type: 'Point',
      coordinates: [77.5801, 12.9851],
      address: 'Metro Station Gate 2',
      city: 'Bengaluru',
      ward: 'Ward 9',
      landmark: 'Metro Station',
    },
    aiCategory: 'Water Supply',
    aiPriority: 'urgent',
    aiConfidence: 96,
    aiDepartment: 'Water Works Department',
    aiSuggestion: 'Close the affected section and dispatch leak detection team.',
    aiTags: ['water leakage', 'pipe', 'metro', 'slippery'],
    confirmCount: 4,
    upvoteCount: 22,
  },
  {
    title: 'Drain blocked after heavy rain',
    description: 'The roadside drain is blocked with plastic waste and rainwater is overflowing onto the street.',
    category: 'drainage',
    severity: 'high',
    priority: 'high',
    status: 'resolved',
    location: {
      type: 'Point',
      coordinates: [77.6217, 12.9362],
      address: '8th Cross Road, Koramangala',
      city: 'Bengaluru',
      ward: 'Ward 33',
      landmark: '8th Cross Bus Stop',
    },
    aiCategory: 'Drainage',
    aiPriority: 'high',
    aiConfidence: 89,
    aiDepartment: 'Stormwater Drain Department',
    aiSuggestion: 'Clear drain blockage and inspect for repeat clogging points.',
    aiTags: ['drainage', 'rain', 'flooding'],
    confirmCount: 6,
    upvoteCount: 16,
  },
  {
    title: 'Illegal parking blocking footpath',
    description: 'Vehicles are parked across the footpath near the school, forcing pedestrians to walk on the road.',
    category: 'encroachment',
    severity: 'medium',
    priority: 'medium',
    status: 'rejected',
    location: {
      type: 'Point',
      coordinates: [77.5665, 12.9358],
      address: 'School Road, Jayanagar',
      city: 'Bengaluru',
      ward: 'Ward 27',
      landmark: 'Public School',
    },
    aiCategory: 'Encroachment',
    aiPriority: 'medium',
    aiConfidence: 83,
    aiDepartment: 'Traffic Enforcement Department',
    aiSuggestion: 'Verify obstruction and coordinate with traffic enforcement.',
    aiTags: ['encroachment', 'parking', 'footpath'],
    confirmCount: 1,
    denyCount: 4,
    upvoteCount: 5,
  },
];

async function upsertDefaultUser(seedUser) {
  let user = await User.findOne({ email: seedUser.email }).select('+password +isActive');

  if (!user) {
    user = await User.create(seedUser);
    console.log(`+ Seeded ${seedUser.role}: ${seedUser.email}`);
    return user;
  }

  user.name = seedUser.name;
  user.password = seedUser.password;
  user.role = seedUser.role;
  user.isActive = true;
  user.isEmailVerified = true;
  await user.save();
  console.log(`- Refreshed default user: ${seedUser.email}`);
  return user;
}

async function seedDatabase() {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/civic_guardian_ai';

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB.');

    console.log('Checking default users...');
    const seededUsers = {};
    for (const seedUser of seedUsers) {
      const user = await upsertDefaultUser(seedUser);
      seededUsers[seedUser.role] = user;
    }

    const reporter = seededUsers.citizen;
    console.log('Checking demo issues...');
    for (const demoIssue of demoIssues) {
      const exists = await Issue.findOne({ title: demoIssue.title });
      if (exists) {
        console.log(`- Issue already exists: ${demoIssue.title}`);
        continue;
      }

      await Issue.create({
        ...demoIssue,
        createdBy: reporter._id,
        statusHistory: [{
          status: demoIssue.status || 'pending',
          changedBy: reporter._id,
          note: 'Demo issue seeded for project presentation.',
        }],
      });
      console.log(`+ Seeded issue: ${demoIssue.title}`);
    }

    console.log('Database seeding complete.');
    console.log('\nDefault Accounts:');
    console.log('--------------------------------------------------');
    console.log('Admin:     admin@civicguardian.com     / Password123');
    console.log('Moderator: moderator@civicguardian.com / Password123');
    console.log('Citizen:   citizen@civicguardian.com   / Password123');
    console.log('--------------------------------------------------\n');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    process.exit(1);
  }
}

seedDatabase();
