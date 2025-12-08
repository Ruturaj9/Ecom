// src/index.js
require('dotenv').config();
const http = require('http');
const mongoose = require('mongoose');

const app = require('./app');
const connectDB = require('./config/db');

const PORT = Number(process.env.PORT) || 4000;
const HOST = process.env.HOST || '0.0.0.0';

// Start / stop helpers
let server;

/**
 * Gracefully shutdown server and mongoose connection.
 * @param {number} code exit code
 */
async function gracefulShutdown(code = 0) {
  try {
    console.info('Shutting down gracefully...');
    if (server && server.listening) {
      await new Promise((resolve, reject) => {
        server.close(err => (err ? reject(err) : resolve()));
      });
      console.info('HTTP server closed.');
    }
    if (mongoose.connection && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.info('Mongoose disconnected.');
    }
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
  } finally {
    process.exit(code);
  }
}

/**
 * Start the application: connect DB then start HTTP server.
 */
async function start() {
  try {
    // Basic environment sanity checks (non-blocking; preserves existing behavior)
    if (!process.env.MONGO_URI) {
      console.warn('Warning: MONGO_URI is not set. Ensure your DB config is correct.');
    }

    // Connect to DB (preserves existing connectDB behavior)
    await connectDB();

    // Create server using Express app
    server = http.createServer(app);

    // Tune timeouts to avoid proxy-related premature socket closures
    // Values chosen to be slightly higher than many reverse proxies defaults
    server.keepAliveTimeout = 65 * 1000; // 65s
    server.headersTimeout = 70 * 1000; // must be >= keepAliveTimeout

    // Start listening
    server.listen(PORT, HOST, () => {
      console.info(`Server running on http://${HOST}:${PORT} (env: ${process.env.NODE_ENV || 'development'})`);
    });

    // Handle unhandled promise rejections and uncaught exceptions
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      // Attempt graceful shutdown (exit code 1)
      gracefulShutdown(1);
    });

    process.on('uncaughtException', err => {
      console.error('Uncaught Exception thrown:', err);
      // Attempt graceful shutdown (exit code 1)
      gracefulShutdown(1);
    });

    // Listen for termination signals (SIGINT, SIGTERM)
    ['SIGINT', 'SIGTERM'].forEach(sig => {
      process.on(sig, async () => {
        console.info(`Received ${sig}, initiating graceful shutdown...`);
        await gracefulShutdown(0);
      });
    });
  } catch (err) {
    console.error('Failed to start server', err);
    // Ensure any opened connections are closed
    await gracefulShutdown(1);
  }
}

// Run startup
start();

// Export for testing or external control (if needed)
module.exports = { start, gracefulShutdown };
