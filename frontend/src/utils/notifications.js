// Auto-request notification permission without user interaction
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('This browser does not support notifications');
    return false;
  }

  try {
    // Auto-request permission
    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted automatically');
      
      // Register service worker for PWA notifications
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/sw.js');
          console.log('Service Worker registered for notifications');
        } catch (error) {
          console.log('Service Worker registration failed, using browser notifications');
        }
      }
      
      return true;
    } else {
      console.log('Notification permission not granted automatically');
      return false;
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Schedule a single prayer time notification
export const schedulePrayerTimeNotification = async (prayerName, prayerTime) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const now = new Date();
  const prayerDateTime = new Date(prayerTime);
  
  // If prayer time is in the future, schedule it
  if (prayerDateTime > now) {
    const timeUntilPrayer = prayerDateTime.getTime() - now.getTime();
    
    if (timeUntilPrayer > 0) {
      setTimeout(() => {
        sendPrayerNotification(prayerName);
      }, timeUntilPrayer);
      
      console.log(`Scheduled ${prayerName} notification in ${Math.round(timeUntilPrayer/60000)} minutes`);
      return true;
    }
  }
  
  return false;
};

// Send immediate prayer notification
export const sendPrayerNotification = (prayerName) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return false;
  }

  const options = {
    body: `It's time for ${prayerName} prayer. May your prayers be accepted. 🌙`,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: `prayer-${prayerName}`,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'snooze',
        title: '⏰ Snooze 5 min'
      },
      {
        action: 'dismiss',
        title: '❌ Dismiss'
      }
    ]
  };

  try {
    // Try service worker notification first (for PWA)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(`${prayerName} Prayer Time`, options);
      });
    } else {
      // Fallback to browser notifications
      const notification = new Notification(`${prayerName} Prayer Time`, options);
      
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
    
    console.log(`Prayer notification sent: ${prayerName}`);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
};

// Schedule notifications for all prayer times
export const scheduleAllPrayerTimeNotifications = async (prayerTimes) => {
  const prayers = [
    { name: 'Fajr', time: prayerTimes.fajr },
    { name: 'Dhuhr', time: prayerTimes.dhuhr },
    { name: 'Asr', time: prayerTimes.asr },
    { name: 'Maghrib', time: prayerTimes.maghrib },
    { name: 'Isha', time: prayerTimes.isha }
  ];

  for (const prayer of prayers) {
    if (prayer.time) {
      await schedulePrayerTimeNotification(prayer.name, prayer.time);
    }
  }
};

// Test notification (for development)
export const sendTestNotification = () => {
  return sendPrayerNotification('Test');
};