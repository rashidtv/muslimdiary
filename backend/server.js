const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const prayerNotificationsRoutes = require('./routes/prayerNotifications');
require('dotenv').config();

const app = express();

// ==================== CRITICAL RENDER FIXES ====================
// Add these settings for Render deployment
app.set('trust proxy', 1); // Trust Render's proxy

// Health check with NO database dependency (for initial deployment)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '2.4.0'
  });
});

// Simple test endpoint without DB
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString()
  });
});
// ==================== END CRITICAL FIXES ====================

// Middleware
app.use(cors());
app.use(express.json());

// Proxy route for OpenStreetMap Nominatim API (to fix CORS)
// ==================== CORS PROXY FOR OPENSTREETMAP ====================
app.get('/api/nominatim-proxy', async (req, res) => {
  try {
    const { lat, lon, format, zoom, addressdetails } = req.query;
    
    console.log('🌍 OpenStreetMap Proxy Request:', { lat, lon });
    
    // Validate required parameters
    if (!lat || !lon) {
      return res.status(400).json({ 
        error: 'Missing required parameters: lat and lon' 
      });
    }

    // Use axios instead of fetch (fetch is not available in Node.js by default)
    const axios = require('axios');
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=${format || 'json'}&lat=${lat}&lon=${lon}&zoom=${zoom || 10}&addressdetails=${addressdetails || 1}`,
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'User-Agent': 'MuslimDailyApp/1.0 (contact@example.com)',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('✅ OpenStreetMap Proxy Success:', response.data.display_name || 'Location found');
    
    // Send the response back to frontend
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ OpenStreetMap Proxy Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch location data',
      details: error.message 
    });
  }
});

// Enhanced startup logging
console.log('🚀 Muslim Daily Backend Starting...');
console.log('📅 Startup Time:', new Date().toISOString());
console.log('🗄️  MongoDB Persistent Storage');
console.log('💰 COMPLETELY FREE - No costs, no subscriptions');

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/muslimdiary';

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  console.log('🏠 Database:', mongoose.connection.name);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  process.exit(1);
});

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB Connected Successfully');
  console.log('🏠 Database:', mongoose.connection.name);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

// Import models
const User = require('./models/User');

// ==================== HEALTH MONITORING ENDPOINTS ====================

// Health check endpoint 1 - Basic
app.get('/api/health1', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Muslim Daily Backend',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    storage: 'mongodb-persistent'
  });
});

// Health check endpoint 2 - Memory usage
app.get('/api/health2', (req, res) => {
  const used = process.memoryUsage();
  res.json({ 
    status: 'healthy',
    memory: {
      rss: `${Math.round(used.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)} MB`,
      external: `${Math.round(used.external / 1024 / 1024)} MB`
    },
    uptime: `${Math.round(process.uptime())} seconds`,
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Health check endpoint 3 - Detailed stats
app.get('/api/health3', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    
    res.json({ 
      status: 'healthy',
      stats: {
        totalUsers: userCount,
        serverUptime: `${Math.round(process.uptime())} seconds`,
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
      },
      timestamp: new Date().toISOString(),
      service: 'Muslim Daily API - MongoDB Edition'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Warmup endpoint - Simulates real API call
app.get('/api/warmup', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    
    res.json({ 
      status: 'warmed up',
      users: userCount,
      timestamp: new Date().toISOString(),
      message: 'Muslim Daily backend is ready to handle requests',
      database: 'connected'
    });
  } catch (error) {
    res.json({ 
      status: 'warming up',
      error: error.message,
      timestamp: new Date().toISOString(),
      message: 'Backend is starting up...'
    });
  }
});

// Simple ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ 
    pong: true,
    timestamp: new Date().toISOString(),
    service: 'Muslim Daily API',
    version: '1.0.0',
    message: 'Alhamdulillah! Serving the Muslim community for free!',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ==================== ROUTES ====================

// Root endpoint
app.get('/', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    
    res.json({ 
      message: '🕌 MuslimDaily API - Free Muslim Practice Companion',
      version: '1.0.0',
      status: 'Alhamdulillah! Serving the Muslim community for free!',
      features: [
        'Prayer time tracking',
        'Quran reading tracker', 
        'Dhikr counter',
        'Progress analytics',
        'User authentication',
        'Persistent MongoDB storage',
        'Completely FREE forever'
      ],
      stats: {
        totalUsers: userCount,
        serverTime: new Date().toISOString(),
        database: 'MongoDB Persistent'
      },
      healthEndpoints: [
        '/api/health1',
        '/api/health2', 
        '/api/health3',
        '/api/warmup',
        '/api/ping'
      ]
    });
  } catch (error) {
    res.json({ 
      message: '🕌 MuslimDaily API - Free Muslim Practice Companion',
      status: 'Starting up...',
      error: error.message
    });
  }
});

// Health check (existing)
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    
    res.json({ 
      success: true, 
      message: 'Muslim Daily API is running!',
      timestamp: new Date().toISOString(),
      usersCount: userCount,
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== AUTHENTICATION ROUTES ====================

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email, password, and name are required' 
      });
    }

    // Basic email validation
    if (!email.includes('@')) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid email format' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        error: 'User already exists' 
      });
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      name: name,
      password: password, // Will be hashed by the User model
      zone: 'SGR01',
      location: {
        latitude: null,
        longitude: null,
        autoDetected: false
      },
      prayerProgress: {
        fajr: [],
        dhuhr: [],
        asr: [],
        maghrib: [],
        isha: []
      }
    });

    await user.save();

    // Generate token (simple version for now)
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'muslim-daily-secret-key', 
      { expiresIn: '7d' }
    );

    console.log(`✅ New user registered: ${email}`);

    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        zone: user.zone,
        location: user.location
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Registration failed: ' + error.message
    });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password are required' 
      });
    }

    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid credentials' 
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();
    
    // Generate token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user._id }, 
      process.env.JWT_SECRET || 'muslim-daily-secret-key', 
      { expiresIn: '7d' }
    );

    console.log(`✅ User logged in: ${email}`);

    res.json({
      success: true,
      token: token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        zone: user.zone,
        location: user.location
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Login failed: ' + error.message
    });
  }
});

// Get current user
app.get('/api/auth/me', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'muslim-daily-secret-key');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        zone: user.zone,
        location: user.location
      }
    });

  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
});

// Auth test endpoint
app.get('/api/auth/test', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    
    res.json({ 
      success: true, 
      message: 'Auth routes are working!',
      usersCount: userCount,
      timestamp: new Date().toISOString(),
      database: 'MongoDB'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// ==================== USER PROFILE ROUTES ====================

// Update user location
app.put('/api/user/location', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'muslim-daily-secret-key');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const { location, zone } = req.body;
    
    if (location) user.location = location;
    if (zone) user.zone = zone;

    await user.save();

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        zone: user.zone,
        location: user.location
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update location: ' + error.message
    });
  }
});

// Track prayer for authenticated user
app.post('/api/user/prayer', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'muslim-daily-secret-key');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    const { prayer, completed, timestamp } = req.body;
    
    if (!prayer) {
      return res.status(400).json({ 
        success: false, 
        error: 'Prayer type is required' 
      });
    }

    const prayerTime = new Date(timestamp || new Date());

    if (completed) {
      // Add to prayer progress
      if (!user.prayerProgress[prayer]) {
        user.prayerProgress[prayer] = [];
      }
      user.prayerProgress[prayer].push(prayerTime);
    } else {
      // Remove from prayer progress (most recent entry)
      if (user.prayerProgress[prayer] && user.prayerProgress[prayer].length > 0) {
        user.prayerProgress[prayer].pop();
      }
    }

    await user.save();

    res.json({
      success: true,
      prayerProgress: user.prayerProgress,
      message: `Prayer ${prayer} ${completed ? 'completed' : 'unmarked'} successfully`
    });

  } catch (error) {
    console.error('Prayer tracking error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update prayer: ' + error.message
    });
  }
});

// Get user prayer progress
app.get('/api/user/progress', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'muslim-daily-secret-key');
    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }

    res.json({
      success: true,
      prayerProgress: user.prayerProgress,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        zone: user.zone
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get prayer progress: ' + error.message
    });
  }
});

app.use('/api/notifications', prayerNotificationsRoutes);

// ==================== EXISTING PRAYER TIMES ROUTES ====================

// Import prayer times routes
const prayerTimesRoutes = require('./routes/prayerTimes');
app.use('/api/prayertimes', prayerTimesRoutes);

// ==================== GRACEFUL SHUTDOWN HANDLING ====================

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  mongoose.connection.close(false, () => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  mongoose.connection.close(false, () => {
    console.log('✅ MongoDB connection closed');
    process.exit(0);
  });
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🕌 MuslimDaily server running on port ${PORT}`);
  console.log(`💰 COMPLETELY FREE - No costs, no subscriptions`);
  console.log(`🌍 API available at: http://localhost:${PORT}`);
  console.log(`🗄️  MongoDB Persistent Storage Active`);
  console.log(`🏥 Health monitoring endpoints ready for UptimeRobot`);
  console.log(`📋 Available health endpoints:`);
  console.log(`   GET  /health (Simple - No DB dependency)`);
  console.log(`   GET  /api/health1`);
  console.log(`   GET  /api/health2`);
  console.log(`   GET  /api/health3`);
  console.log(`   GET  /api/warmup`);
  console.log(`   GET  /api/ping`);
  console.log(`   GET  /api/test`);
});