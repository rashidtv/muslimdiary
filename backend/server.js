const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const prayerNotificationsRoutes = require('./routes/prayerNotifications');
const prayerTimesRoutes = require('./routes/prayerTimes');
const authRoutes = require('./routes/auth'); // Use the separate auth routes
require('dotenv').config();

const app = express();

// ==================== SECURITY CONFIGURATION ====================
app.set('trust proxy', 1); // Trust Render's proxy

// Security headers middleware
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ==================== ENHANCED CORS CONFIGURATION ====================
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : [
      'https://muslimdiary-whur.onrender.com',
      'http://localhost:3000',
      'http://127.0.0.1:3000'
    ];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS Blocked Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['X-Total-Count', 'X-API-Version'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Handle preflight requests globally
app.options('*', cors(corsOptions));

// ==================== MIDDLEWARE ====================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ==================== CRITICAL HEALTH ENDPOINTS (No DB Dependency) ====================
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    version: '2.4.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    timestamp: new Date().toISOString(),
    version: '2.4.0'
  });
});

// ==================== PROXY ROUTES ====================
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

    const axios = require('axios');
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=${format || 'json'}&lat=${lat}&lon=${lon}&zoom=${zoom || 10}&addressdetails=${addressdetails || 1}`,
      {
        timeout: 10000,
        headers: {
          'User-Agent': 'MuslimDiaryApp/2.4.0 (https://muslimdiary-whur.onrender.com)',
          'Accept': 'application/json'
        }
      }
    );
    
    console.log('✅ OpenStreetMap Proxy Success');
    
    res.json(response.data);
    
  } catch (error) {
    console.error('❌ OpenStreetMap Proxy Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to fetch location data',
      details: error.message 
    });
  }
});

// ==================== DATABASE CONNECTION ====================
console.log('🚀 Muslim Diary Backend Starting...');
console.log('📅 Startup Time:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🗄️  MongoDB Persistent Storage');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/muslimdiary';

// Enhanced MongoDB connection with better error handling
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB Connected Successfully');
  console.log('🏠 Database:', mongoose.connection.name);
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
  console.log('⚠️  Continuing without database connection...');
});

// MongoDB connection events
mongoose.connection.on('connected', () => {
  console.log('✅ MongoDB Connected Successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

// ==================== IMPORT MODELS ====================
const User = require('./models/User');

// ==================== HEALTH MONITORING ENDPOINTS ====================
app.get('/api/health1', (req, res) => {
  res.json({ 
    status: 'healthy',
    service: 'Muslim Diary Backend',
    timestamp: new Date().toISOString(),
    version: '2.4.0',
    environment: process.env.NODE_ENV || 'development',
    storage: 'mongodb-persistent'
  });
});

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
      service: 'Muslim Diary API - MongoDB Edition'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/api/warmup', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    
    res.json({ 
      status: 'warmed up',
      users: userCount,
      timestamp: new Date().toISOString(),
      message: 'Muslim Diary backend is ready to handle requests',
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

// Enhanced ping endpoint
app.get('/api/ping', (req, res) => {
  res.json({ 
    pong: true,
    timestamp: new Date().toISOString(),
    service: 'Muslim Diary API',
    version: '2.4.0',
    message: 'Alhamdulillah! Serving the Muslim community for free!',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Enhanced health check endpoint
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.4.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      memory: {
        used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
      },
      uptime: `${Math.round(process.uptime())}s`
    }
  };

  res.json(healthCheck);
});

// ==================== ROUTES CONFIGURATION ====================

// Root endpoint
app.get('/', async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    
    res.json({ 
      message: '🕌 Muslim Diary API - Free Muslim Practice Companion',
      version: '2.4.0',
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
      endpoints: {
        auth: ['/api/auth/login', '/api/auth/register', '/api/auth/me'],
        prayer: ['/api/prayertimes/:zone', '/api/prayertimes/coordinates/:lat/:lng'],
        user: ['/api/user/progress', '/api/user/location'],
        health: ['/api/health', '/api/ping', '/health']
      },
      documentation: 'https://github.com/your-repo/docs'
    });
  } catch (error) {
    res.json({ 
      message: '🕌 Muslim Diary API - Free Muslim Practice Companion',
      status: 'Starting up...',
      error: error.message,
      version: '2.4.0'
    });
  }
});

// ==================== API ROUTES ====================

// Use imported route files (CLEAN - no duplicate routes)
app.use('/api/auth', authRoutes);
app.use('/api/prayertimes', prayerTimesRoutes);
app.use('/api/notifications', prayerNotificationsRoutes);

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
    
    // SECURITY FIX: Remove hardcoded fallback secret
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
    console.error('Location update error:', error);
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
    
    // SECURITY FIX: Remove hardcoded fallback secret
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
      if (!user.prayerProgress[prayer]) {
        user.prayerProgress[prayer] = [];
      }
      user.prayerProgress[prayer].push(prayerTime);
    } else {
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
    
    // SECURITY FIX: Remove hardcoded fallback secret
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
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
    console.error('Progress fetch error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get prayer progress: ' + error.message
    });
  }
});

// ==================== ERROR HANDLING MIDDLEWARE ====================

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Global error handling middleware
app.use((error, req, res, next) => {
  console.error('🚨 Global Error Handler:', error);

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      details: error.message
    });
  }

  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token'
    });
  }

  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired'
    });
  }

  // Default error
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
});

// ==================== GRACEFUL SHUTDOWN HANDLING ====================

process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('✅ MongoDB connection closed');
      process.exit(0);
    });
  });
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection at:', promise, 'reason:', reason);
});

// Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception:', error);
  process.exit(1);
});

// ==================== SERVER START ====================

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🕌 Muslim Diary server running on port ${PORT}`);
  console.log(`💰 COMPLETELY FREE - No costs, no subscriptions`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Frontend URL: https://muslimdiary-whur.onrender.com`);
  console.log(`🗄️  MongoDB: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
  console.log(`🏥 Health monitoring endpoints ready`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET  /health (No DB dependency)`);
  console.log(`   GET  /api/health (Full health check)`);
  console.log(`   GET  /api/ping (Quick status)`);
  console.log(`   GET  /api/prayertimes/:zone (Prayer times)`);
  console.log(`   POST /api/auth/login (User login)`);
});