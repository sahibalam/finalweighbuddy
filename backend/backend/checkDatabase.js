const mongoose = require('mongoose');
const Vehicle = require('./models/Vehicle');
const Caravan = require('./models/Caravan');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/weighbuddy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const checkDatabase = async () => {
  try {
    console.log('🔍 Checking current database structure...\n');

    // Check Vehicle schema fields
    console.log('📋 Vehicle Schema Fields:');
    const vehicleFields = Object.keys(Vehicle.schema.paths);
    vehicleFields.forEach(field => {
      const path = Vehicle.schema.paths[field];
      console.log(`  - ${field}: ${path.instance} ${path.isRequired ? '(required)' : '(optional)'}`);
    });

    console.log('\n📋 Caravan Schema Fields:');
    const caravanFields = Object.keys(Caravan.schema.paths);
    caravanFields.forEach(field => {
      const path = Caravan.schema.paths[field];
      console.log(`  - ${field}: ${path.instance} ${path.isRequired ? '(required)' : '(optional)'}`);
    });

    // Check existing data
    console.log('\n📊 Current Vehicle Data:');
    const vehicles = await Vehicle.find({});
    vehicles.forEach(v => {
      console.log(`  ID: ${v._id}`);
      console.log(`  Make: ${v.make}, Model: ${v.model}, Year: ${v.year}`);
      console.log(`  Variant: ${v.variant || 'NOT SET'}`);
      console.log(`  Registration State: ${v.registrationState || 'NOT SET'}`);
      console.log(`  GVM: ${v.gvm}, GCM: ${v.gcm}`);
      console.log(`  Is Reference Data: ${v.isReferenceData || false}`);
      console.log('  ---');
    });

    console.log('\n📊 Current Caravan Data:');
    const caravans = await Caravan.find({});
    caravans.forEach(c => {
      console.log(`  ID: ${c._id}`);
      console.log(`  Make: ${c.make}, Model: ${c.model}, Year: ${c.year}`);
      console.log(`  Variant: ${c.variant || 'NOT SET'}`);
      console.log(`  Registration State: ${c.registrationState || 'NOT SET'}`);
      console.log(`  GTM: ${c.gtm}, ATM: ${c.atm}`);
      console.log(`  TBM: ${c.tbm || 'NOT SET'}, TBM2: ${c.tbm2 || 'NOT SET'}`);
      console.log(`  Is Reference Data: ${c.isReferenceData || false}`);
      console.log('  ---');
    });

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the check
const runCheck = async () => {
  await connectDB();
  await checkDatabase();
};

runCheck();



