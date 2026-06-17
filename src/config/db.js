const mongoose = require('mongoose');

const connectDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URL, {
      dbName: "discount_mart_db",
    });

    console.log('MongoDB DB connection successful!');

  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
  }
};

module.exports = connectDb;