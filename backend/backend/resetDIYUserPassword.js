const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import User model
const User = require('./models/User');

// Get password from command line argument or use default
const newPassword = process.argv[2] || 'test123456';
const diyUserEmail = 'test@example.com';

async function resetDIYUserPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/caravan-compliance');
    console.log('✅ Connected to MongoDB');

    // Find the DIY user
    const diyUser = await User.findOne({ email: diyUserEmail });
    if (!diyUser) {
      console.log('❌ DIY user not found!');
      console.log('Email:', diyUserEmail);
      console.log('\n💡 Creating a new DIY user with this email...');
      
      // Create new DIY user
      const newUser = new User({
        name: 'Test DIY User',
        email: diyUserEmail,
        password: newPassword,
        phone: '+61412345678',
        postcode: '2000',
        userType: 'diy',
        isActive: true,
        emailVerified: true
      });
      
      await newUser.save();
      console.log('✅ Created new DIY user successfully!');
      console.log('📧 Email:', diyUserEmail);
      console.log('🔑 Password:', newPassword);
      console.log('👤 User Type: DIY');
      console.log('\n🚀 You can now login to the application!');
      console.log('\n💡 Login URL: http://localhost:3000/login');
      
    } else {
      console.log('🔍 Found DIY user:');
      console.log('   Name:', diyUser.name);
      console.log('   Email:', diyUser.email);
      console.log('   User Type:', diyUser.userType);

      // Generate new password hash
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Update the password
      diyUser.password = hashedPassword;
      await diyUser.save();

      console.log('\n✅ DIY user password reset successfully!');
      console.log('📧 Email:', diyUserEmail);
      console.log('🔑 New Password:', newPassword);
      console.log('👤 User Type: DIY');
      console.log('\n🚀 You can now login to the application!');
      console.log('\n💡 Login URL: http://localhost:3000/login');
    }

  } catch (error) {
    console.error('❌ Error resetting DIY user password:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

// Run the script
resetDIYUserPassword();
