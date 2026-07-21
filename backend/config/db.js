/**
 * Database Configuration Module
 * Handles MongoDB connection setup and configuration
 */

const mongoose = require('mongoose');

/**
 * Connect to MongoDB Database
 * @returns {Promise<void>}
 */
const connectDatabase = async () => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    const mongoDatabase = process.env.MONGO_DATABASE;
    const mongoAuthSource = process.env.MONGO_AUTH_SOURCE;

    if (!mongoUrl || !mongoDatabase) {
      const error = new Error('MongoDB connection parameters are not defined in environment variables (MONGO_URL and MONGO_DATABASE required)');
      console.error('❌ MongoDB Configuration Error:', error.message);
      throw error;
    }

    console.log('🔄 Connecting to MongoDB...');
    console.log(`   URL: ${mongoUrl}`);
    console.log(`   Database: ${mongoDatabase}`);

    // Construct the full MongoDB URI with database and auth source
    const mongoUri = `${mongoUrl}/${mongoDatabase}?authSource=${mongoAuthSource || 'admin'}`;

    // Connection options with proper timeouts
    const connectionOptions = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,  // Timeout for initial connection
      serverSelectionTimeoutMS: 30000,  // Timeout for server selection
      retryWrites: true,
      retryReads: true,
      Family: 4, // Use IPv4 only to avoid DNS issues
    };

    await mongoose.connect(mongoUri, connectionOptions);

    console.log('✅ MongoDB Connected Successfully');

    // Handle connection events
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  MongoDB Disconnected - Connection lost');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB Connection Error:', err.message);
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB Reconnected Successfully');
    });

  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error.message);
    // Throw error instead of exiting - let the server handle it
    throw error;
  }
};

/**
 * Disconnect from MongoDB Database
 * @returns {Promise<void>}
 */
const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    console.log('✅ MongoDB Disconnected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Disconnection Error:', error.message);
  }
};

module.exports = {
  connectDatabase,
  disconnectDatabase,
};
