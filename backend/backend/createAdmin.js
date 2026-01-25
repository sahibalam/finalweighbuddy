const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Admin user data
const adminData = {
  name: 'Admin User',
  email: 'admin@weighbuddy.com',
  password: 'admin123456',
  phone: '+61412345678',
  postcode: '2000',
  userType: 'admin',
  businessName: 'WeighBuddy Admin',
  isActive: true,
  emailVerified: true
};

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email:', adminData.email);
      console.log('Password:', adminData.password);
      process.exit(0);
    }

    // Create admin user
    const adminUser = new User(adminData);
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', adminData.email);
    console.log('🔑 Password:', adminData.password);
    console.log('👤 User Type: Admin');
    console.log('\n🚀 You can now login to the admin dashboard!');

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdminUser(); 