const mongoose = require('mongoose');

const connect = async () => {
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error('Missing MONGO_URI (or MONGODB_URI) env var');
    process.exit(1);
  }

  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
};

const main = async () => {
  try {
    await connect();

    // Load model after connecting so collection is ready.
    const User = require('../models/User');

    const indexes = await User.collection.indexes();
    console.log(indexes);
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {
      // ignore
    }
  }
};

main();
