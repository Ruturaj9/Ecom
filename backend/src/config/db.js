// src/config/db.js
const mongoose = require('mongoose');

/**
 * Establish a reliable MongoDB connection with proper
 * error handling, reconnection behavior, and logging.
 * Main application logic is preserved exactly.
 */
const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI environment variable is not set.');
    process.exit(1);
  }

  try {
    // Recommended Mongoose connection settings for production stability
    await mongoose.connect(uri, {
      // Modern Mongoose defaults already include:
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      // No need for deprecated useCreateIndex or useFindAndModify
      maxPoolSize: 10,           // helps under heavy load
      serverSelectionTimeoutMS: 5000, // fail fast instead of hanging
      socketTimeoutMS: 45000,    // close inactive sockets
    });

    console.log(`✅ MongoDB Connected: ${mongoose.connection.host}`);

    // Connection event listeners for better diagnostics
    mongoose.connection.on('error', err => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️  Mongoose disconnected.');
    });

    mongoose.connection.on('reconnected', () => {
      console.info('🔄 Mongoose reconnected.');
    });

  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
