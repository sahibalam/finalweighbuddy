const axios = require('axios');

async function testSubscriptionEndpoints() {
  try {
    console.log('Testing subscription endpoints...\n');
    
    // Test 1: Get subscription plans (public endpoint)
    console.log('1. Testing /api/subscriptions/plans');
    try {
      const plansResponse = await axios.get('http://localhost:5000/api/subscriptions/plans');
      console.log('✅ Plans endpoint working');
      console.log('Available plans:', Object.keys(plansResponse.data.plans));
    } catch (error) {
      console.log('❌ Plans endpoint failed:', error.message);
    }
    
    // Test 2: Check if server is running
    console.log('\n2. Testing server health');
    try {
      const healthResponse = await axios.get('http://localhost:5000/api/health');
      console.log('✅ Server is running');
      console.log('Server status:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Server not responding:', error.message);
    }
    
    // Test 3: Check environment variables
    console.log('\n3. Checking environment variables');
    console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET');
    console.log('MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Wait a moment for server to start, then test
setTimeout(testSubscriptionEndpoints, 3000);



