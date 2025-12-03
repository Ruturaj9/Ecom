// src/scripts/createAdmin.js
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const bcrypt = require('bcrypt');

async function main() {
  await connectDB();

  const argv = process.argv.slice(2);
  const email = argv[0];
  const pass = argv[1];

  if (!email || !pass) {
    console.error('Usage: node src/scripts/createAdmin.js admin@example.com StrongP@ssw0rd!');
    process.exit(1);
  }

  const existing = await User.findOne({ email });
  if (existing) {
    console.error('User already exists:', email);
    process.exit(1);
  }

  const saltRounds = 12;
  const passwordHash = await bcrypt.hash(pass, saltRounds);

  const user = new User({
    email,
    passwordHash,
    roles: ['admin']
  });

  await user.save();
  console.log('Admin user created:', email);
  process.exit(0);
}

main().catch(err => {
  console.error('Error creating admin:', err);
  process.exit(1);
});
