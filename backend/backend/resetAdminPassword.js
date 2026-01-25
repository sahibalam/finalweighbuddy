const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();
                            
// Import User model
const User = require('./models/User');

// Get password from command line argument or use default
const newPassword = process.argv[2] || 'admin123456';
const adminEmail = 'admin@weighbuddy.com';

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/caravan-compliance');
    console.log('✅ Connected to MongoDB');

    // Find the admin user
    const adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      console.log('❌ Admin user not found!');
      console.log('Email:', adminEmail);
      process.exit(1);
    }

    console.log('🔍 Found admin user:');
    console.log('   Name:', adminUser.name);
    console.log('   Email:', adminUser.email);
    console.log('   User Type:', adminUser.userType);

    // Generate new password hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update the password
    adminUser.password = hashedPassword;
    await adminUser.save();

    console.log('\n✅ Admin password reset successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 New Password:', newPassword);
    console.log('👤 User Type: Admin');
    console.log('\n🚀 You can now login to the admin dashboard!');
    console.log('\n💡 Login URL: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Error resetting admin password:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the script
resetAdminPassword();
