const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/supermarket_pos';

let connectionPromise = null;

async function connectDB() {
  // Return existing connection if already connected
  if (mongoose.connection.readyState === 1) return;

  // Reuse in-flight connection promise (important for serverless concurrent requests)
  if (!connectionPromise) {
    connectionPromise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    }).then(() => {
      console.log(`✅ MongoDB connected`);
      connectionPromise = null;
    }).catch((err) => {
      console.error('❌ MongoDB connection failed:', err.message);
      connectionPromise = null;
      throw err; // Let the caller handle it — no process.exit on serverless
    });
  }

  return connectionPromise;
}

mongoose.connection.on('disconnected', () => {
  console.log('⚠️  MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

module.exports = { connectDB, mongoose };
