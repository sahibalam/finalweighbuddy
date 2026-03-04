const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

require('dotenv').config();
const path = require('path');

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const vehicleRoutes = require('./routes/vehicles');
const caravanRoutes = require('./routes/caravans');
const weighRoutes = require('./routes/weighs');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');
const subscriptionRoutes = require('./routes/subscriptions');
const reportRoutes = require('./routes/reports');
const uploadRoutes = require('./routes/uploads');
const submissionRoutes = require('./routes/submissions');
const fleetStaffRoutes = require('./routes/fleetStaff');

const app = express();
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(
  helmet({
    hsts: false,
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        upgradeInsecureRequests: null,
        scriptSrc: ["'self'", 'https://js.stripe.com'],
        scriptSrcElem: ["'self'", 'https://js.stripe.com'],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
        connectSrc: ["'self'", 'https://api.stripe.com', 'https://checkout.stripe.com', 'https://q.stripe.com'],
        imgSrc: ["'self'", 'data:', 'blob:']
      }
    }
  })
);
app.use(compression());

//CORS configuration
console.log('�� CORS Configuration:');
console.log('Frontend URL:', process.env.FRONTEND_URL || 'http://43.205.46.154');
console.log('Environment:', process.env.NODE_ENV);
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://43.205.46.154',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
// Add this after CORS
console.log('✅ CORS configured with methods:', ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']);
console.log('✅ CORS configured with headers:', ['Content-Type', 'Authorization']);


// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection - MongoDB Atlas only
if (!process.env.MONGODB_URI) {
  console.error('❌ MONGODB_URI environment variable is required for MongoDB Atlas connection');
  process.exit(1);
}

const mongoUri = process.env.MONGODB_URI;
console.log('🔗 Connecting to MongoDB Atlas...');
mongoose.connect(mongoUri)
.then(() => console.log('✅ Connected to MongoDB Atlas'))
.catch(err => {
  console.error('❌ MongoDB Atlas connection error:', err);
  process.exit(1);
});



// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/caravans', caravanRoutes);
app.use('/api/weighs', weighRoutes);
app.use('/api/fleet', fleetStaffRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/submissions', submissionRoutes);

// Serve uploaded files statically with CORS headers
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://43.205.46.154');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Cross-Origin-Resource-Policy', 'cross-origin');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
}, express.static(path.join(__dirname, './uploads')));

// Serve template images (used for PDF reports)
app.use('/static-images', express.static(path.join(__dirname, '../frontend/public/images')));

app.use('/api/admin', adminRoutes);

// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Caravan Compliance API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler - serve React app for client-side routing
app.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
}); 