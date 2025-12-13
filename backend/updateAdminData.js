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

const updateAdminData = async () => {
  try {
    console.log('Starting admin data update...');

    // Update Vehicle data with missing fields
    const vehicleUpdates = [
      {
        _id: '6897877870af5e7518c7dd2a',
        updates: {
          variant: 'LandCruiser',
          registrationState: 'QLD',
          isReferenceData: true
        }
      },
      {
        _id: '6897877870af5e7518c7dd2d',
        updates: {
          variant: 'Ranger',
          registrationState: 'QLD',
          isReferenceData: true
        }
      }
    ];

    console.log('Updating existing vehicles...');
    for (const update of vehicleUpdates) {
      try {
        const result = await Vehicle.findByIdAndUpdate(
          update._id,
          { $set: update.updates },
          { new: true, runValidators: true }
        );
        if (result) {
          console.log(`✅ Updated vehicle ${update._id} with variant: ${update.updates.variant}`);
        } else {
          console.log(`❌ Vehicle ${update._id} not found`);
        }
      } catch (error) {
        console.error(`❌ Error updating vehicle ${update._id}:`, error.message);
      }
    }

    // Update Caravan data with missing fields
    const caravanUpdates = [
      {
        _id: '6897878270af5e7518c7dd3d',
        updates: {
          variant: 'Swan',
          registrationState: 'QLD',
          tbm: 350,
          tbm2: 275,
          isReferenceData: true
        }
      },
      {
        _id: '6897878270af5e7518c7dd42',
        updates: {
          variant: 'Pioneer',
          registrationState: 'QLD',
          tbm: 350,
          tbm2: 291,
          isReferenceData: true
        }
      }
    ];

    console.log('Updating existing caravans...');
    for (const update of caravanUpdates) {
      try {
        const result = await Caravan.findByIdAndUpdate(
          update._id,
          { $set: update.updates },
          { new: true, runValidators: true }
        );
        if (result) {
          console.log(`✅ Updated caravan ${update._id} with variant: ${update.updates.variant}`);
        } else {
          console.log(`❌ Caravan ${update._id} not found`);
        }
      } catch (error) {
        console.error(`❌ Error updating caravan ${update._id}:`, error.message);
      }
    }

    // Add new reference data based on client's images
    console.log('Adding new reference vehicles...');
    const newVehicles = [
      {
        make: 'Toyota',
        model: 'LandCruiser',
        variant: 'XLV',
        year: 2023,
        frontAxleCapacity: 1400,
        rearAxleCapacity: 1850,
        gvm: 2980,
        gcm: 6480,
        btc: 3500,
        tbm: 350,
        fuelType: 'diesel',
        transmission: 'automatic',
        bodyType: 'suv',
        isReferenceData: true,
        source: 'manual'
      },
      {
        make: 'Toyota',
        model: 'LandCruiser',
        variant: '300',
        year: 2023,
        frontAxleCapacity: 1630,
        rearAxleCapacity: 1930,
        gvm: 3280,
        gcm: 6750,
        btc: 3500,
        tbm: 350,
        fuelType: 'diesel',
        transmission: 'automatic',
        bodyType: 'suv',
        isReferenceData: true,
        source: 'manual'
      }
    ];

    for (const vehicle of newVehicles) {
      try {
        const newVehicle = new Vehicle(vehicle);
        await newVehicle.save();
        console.log(`✅ Added new vehicle: ${vehicle.make} ${vehicle.model} ${vehicle.variant}`);
      } catch (error) {
        console.error(`❌ Error adding vehicle ${vehicle.make} ${vehicle.model}:`, error.message);
      }
    }

    console.log('Adding new reference caravans...');
    const newCaravans = [
      {
        make: 'SUV',
        model: 'Caravan',
        variant: 'GR14',
        year: 2024,
        length: 4.5,
        gtm: 2170,
        atm: 2400,
        tbm: 350,
        tbm2: 275,
        axleGroupLoading: 2170,
        bodyType: 'caravan',
        axleCount: 1,
        isReferenceData: true,
        source: 'manual'
      },
      {
        make: 'ZONE',
        model: 'Caravan',
        variant: 'SOJOURN',
        year: 2025,
        length: 5.2,
        gtm: 3806,
        atm: 4000,
        tbm: 350,
        tbm2: 291,
        axleGroupLoading: 3806,
        bodyType: 'caravan',
        axleCount: 1,
        isReferenceData: true,
        source: 'manual'
      }
    ];

    for (const caravan of newCaravans) {
      try {
        const newCaravan = new Caravan(caravan);
        await newCaravan.save();
        console.log(`✅ Added new caravan: ${caravan.make} ${caravan.model} ${caravan.variant}`);
      } catch (error) {
        console.error(`❌ Error adding caravan ${caravan.make} ${caravan.model}:`, error.message);
      }
    }

    console.log('\n🎉 Admin data update completed successfully!');
    
    // Display updated data
    console.log('\n📊 Updated Vehicle Data:');
    const vehicles = await Vehicle.find({ isReferenceData: true });
    vehicles.forEach(v => {
      console.log(`  ${v.make} ${v.model} ${v.variant || 'N/A'} (${v.year}) - GVM: ${v.gvm}kg, GCM: ${v.gcm}kg`);
    });

    console.log('\n📊 Updated Caravan Data:');
    const caravans = await Caravan.find({ isReferenceData: true });
    caravans.forEach(c => {
      console.log(`  ${c.make} ${c.model} ${c.variant || 'N/A'} (${c.year}) - GTM: ${c.gtm}kg, ATM: ${c.atm}kg, TBM: ${c.tbm || 'N/A'}kg`);
    });

  } catch (error) {
    console.error('❌ Error updating admin data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the update
const runUpdate = async () => {
  await connectDB();
  await updateAdminData();
};

runUpdate();
