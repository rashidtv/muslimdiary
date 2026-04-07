const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// Middleware to verify token
const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        error: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key');
    req.user = await User.findById(decoded.userId);
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      error: 'Invalid token' 
    });
  }
};

// Update user location and zone
router.put('/location', auth, async (req, res) => {
  try {
    const { location, zone } = req.body;
    
    req.user.location = location;
    if (zone) req.user.zone = zone;
    
    await req.user.save();

    res.json({
      success: true,
      user: {
        id: req.user._id,
        email: req.user.email,
        name: req.user.name,
        zone: req.user.zone,
        location: req.user.location
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update location' 
    });
  }
});

// Update prayer completion
router.post('/prayer', auth, async (req, res) => {
  try {
    const { prayer, completed, timestamp } = req.body;
    const prayerTime = new Date(timestamp);

    if (completed) {
      // Add to prayer progress
      if (!req.user.prayerProgress[prayer]) {
        req.user.prayerProgress[prayer] = [];
      }
      req.user.prayerProgress[prayer].push(prayerTime);
    } else {
      // Remove from prayer progress (most recent entry)
      if (req.user.prayerProgress[prayer] && req.user.prayerProgress[prayer].length > 0) {
        req.user.prayerProgress[prayer].pop();
      }
    }

    await req.user.save();

    res.json({
      success: true,
      prayerProgress: req.user.prayerProgress
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update prayer progress' 
    });
  }
});

// Get user prayer progress
router.get('/progress', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      prayerProgress: req.user.prayerProgress
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get prayer progress' 
    });
  }
});

module.exports = router;