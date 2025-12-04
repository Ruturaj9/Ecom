// db.js
const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI env var is not set');
    process.exit(1);
  }

  try {
    // pass recommended options for compatibility (if using older mongoose versions adjust accordingly)
    await mongoose.connect(uri, {
      // useNewUrlParser: true, // mongoose >=6 has these by default
      // useUnifiedTopology: true,
      // useCreateIndex: true,
    });
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
  } catch (err) {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }
};

module.exports = connectDB;
