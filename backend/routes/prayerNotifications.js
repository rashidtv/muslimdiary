const express = require('express');
const router = express.Router();
const axios = require('axios');

// Store user notification preferences (in production, use database)
const userNotifications = new Map();

// Enable WhatsApp notifications for user
router.post('/enable-whatsapp', async (req, res) => {
  try {
    const { userId, phoneNumber, prayerTimes } = req.body;
    
    userNotifications.set(userId, {
      phoneNumber,
      prayerTimes,
      enabled: true
    });

    res.json({ success: true, message: 'WhatsApp notifications enabled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send WhatsApp notification (using Twilio API)
router.post('/send-adhan-notification', async (req, res) => {
  try {
    const { userId, prayerName, prayerTime } = req.body;
    const userPrefs = userNotifications.get(userId);

    if (!userPrefs || !userPrefs.enabled) {
      return res.status(400).json({ success: false, message: 'Notifications not enabled' });
    }

    // Using Twilio WhatsApp API
    const message = `🕌 Adhan Time: ${prayerName} prayer is at ${prayerTime}. May Allah accept your prayers!`;

    // Twilio integration would go here
    // const twilioResponse = await axios.post(...);

    res.json({ success: true, message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;