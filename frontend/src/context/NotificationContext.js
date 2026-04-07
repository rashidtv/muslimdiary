import React, { createContext, useContext, useEffect, useState } from 'react';
import { calculatePrayerTimes, getCurrentLocation } from '../utils/prayerTimes';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [serviceWorkerReady, setServiceWorkerReady] = useState(false);

  // Auto-initialize notifications on component mount
  useEffect(() => {
    initializeAutoNotifications();
    registerServiceWorker();
    
    // Set up visibility change listener for background tab support
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const handleVisibilityChange = () => {
    if (!document.hidden && notificationsEnabled) {
      // App became visible, refresh notifications if needed
      refreshNotificationsIfNeeded();
    }
  };

  const refreshNotificationsIfNeeded = async () => {
    // Check if we need to reschedule notifications (e.g., after phone was off)
    const lastScheduled = localStorage.getItem('lastNotificationSchedule');
    const now = Date.now();
    
    if (!lastScheduled || (now - parseInt(lastScheduled)) > 12 * 60 * 60 * 1000) {
      // Reschedule if never scheduled or more than 12 hours ago
      await refreshNotifications();
    }
  };

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        // Add more aggressive scope for better mobile support
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        });
        console.log('✅ Service Worker registered:', registration);
        
        // Set up periodic background sync if supported
        if ('periodicSync' in registration) {
          try {
            await registration.periodicSync.register('prayer-notification-check', {
              minInterval: 24 * 60 * 60 * 1000 // 24 hours
            });
            console.log('✅ Periodic sync registered');
          } catch (syncError) {
            console.log('ℹ️ Periodic sync not supported');
          }
        }
        
        if (registration.installing) {
          registration.installing.addEventListener('statechange', (event) => {
            if (event.target.state === 'activated') {
              setServiceWorkerReady(true);
              console.log('✅ Service Worker activated and ready');
            }
          });
        } else if (registration.active) {
          setServiceWorkerReady(true);
          console.log('✅ Service Worker already active');
        }
      } catch (error) {
        console.error('❌ Service Worker registration failed:', error);
      }
    }
  };

  const initializeAutoNotifications = async () => {
    setLoading(true);
    try {
      console.log('🔄 Initializing automatic prayer notifications...');
      
      // Get user location first - USING SAME PRECISE LOGIC AS QIBLA
      const location = await getCurrentLocation(); // This uses the same function as prayer times
      setUserLocation(location);
      console.log('📍 Precise location obtained for notifications:', location);

      if (location) {
        // Auto-enable notifications without asking user
        const enabled = await enableAutoNotifications(location);
        setNotificationsEnabled(enabled);
        
        if (enabled) {
          console.log('✅ Automatic prayer notifications enabled successfully');
        } else {
          console.log('❌ Automatic prayer notifications not enabled');
        }
      }
    } catch (error) {
      console.error('Error initializing auto notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        console.log('📍 Geolocation not supported, using precise default location');
        resolve({
          latitude: 3.1390, // Kuala Lumpur coordinates
          longitude: 101.6869,
          accuracy: 0,
          note: 'default-precise'
        });
        return;
      }

      console.log('📍 Requesting precise GPS location for accurate prayer times...');
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            altitude: position.coords.altitude,
            altitudeAccuracy: position.coords.altitudeAccuracy,
            heading: position.coords.heading,
            speed: position.coords.speed,
            timestamp: position.timestamp
          };
          
          console.log('📍 Precise location obtained for prayer calculations:', location);
          console.log(`📍 GPS Accuracy: ${location.accuracy} meters`);
          
          if (location.accuracy > 1000) {
            console.warn('⚠️ Location accuracy is low (>1km). Prayer times may be less accurate.');
          } else if (location.accuracy > 100) {
            console.log('ℹ️ Location accuracy is moderate. Prayer times should be reasonably accurate.');
          } else {
            console.log('✅ High accuracy location! Prayer times will be very precise.');
          }
          
          resolve(location);
        },
        (error) => {
          console.log('📍 Location error, using precise default:', error);
          // Use precise default instead of Semenyih
          resolve({
            latitude: 3.1390, // Kuala Lumpur coordinates
            longitude: 101.6869,
            accuracy: 0,
            note: 'fallback-precise'
          });
        },
        {
          enableHighAccuracy: true, // High accuracy for precise prayer times
          timeout: 20000, // Longer timeout for better accuracy
          maximumAge: 10 * 60 * 1000 // 10 minutes max for fresh data
        }
      );
    });
  };

  const enableAutoNotifications = async (location) => {
    try {
      // Auto-request notification permission
      const permissionGranted = await requestNotificationPermission();
      
      if (permissionGranted && location) {
        // Calculate prayer times using your existing function
        const times = await calculatePrayerTimes(location.latitude, location.longitude);
        setPrayerTimes(times);

        // Schedule notifications for all prayer times
        await scheduleAllPrayerNotifications(times);
        
        // Store schedule timestamp for background recovery
        localStorage.setItem('lastNotificationSchedule', Date.now().toString());
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error enabling auto notifications:', error);
      return false;
    }
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      console.warn('🔕 Notifications not supported');
      return false;
    }

    // Check if we already have permission
    if (Notification.permission === 'granted') {
      console.log('✅ Notification permission already granted');
      return true;
    }

    // Check if we've asked before and user denied
    const previouslyDenied = localStorage.getItem('notificationPermissionDenied');
    if (previouslyDenied === 'true' && Notification.permission === 'denied') {
      console.log('ℹ️ Notification permission previously denied');
      return false;
    }

    try {
      // Auto-request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('✅ Notification permission granted automatically');
        localStorage.removeItem('notificationPermissionDenied');
        return true;
      } else {
        console.log('❌ Notification permission not granted');
        localStorage.setItem('notificationPermissionDenied', 'true');
        return false;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  };

  const scheduleAllPrayerNotifications = async (prayerTimes) => {
    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];

    let scheduledCount = 0;

    // Clear any existing timeouts
    clearAllScheduledNotifications();

    for (const prayer of prayers) {
      if (prayer.time) {
        const scheduled = await schedulePrayerTimeNotification(prayer.name, prayer.time);
        if (scheduled) scheduledCount++;
      }
    }

    console.log(`📅 Scheduled ${scheduledCount} real prayer notifications`);
    
    // Store in localStorage for background recovery
    localStorage.setItem('scheduledPrayerCount', scheduledCount.toString());
    
    return scheduledCount > 0;
  };

  const clearAllScheduledNotifications = () => {
    // Clear any existing notification timeouts
    if (window.prayerNotificationTimeouts) {
      window.prayerNotificationTimeouts.forEach(timeoutId => {
        clearTimeout(timeoutId);
      });
    }
    window.prayerNotificationTimeouts = [];
  };

  const schedulePrayerTimeNotification = async (prayerName, prayerTimeStr) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    try {
      const now = new Date();
      const prayerTime = parseTimeString(prayerTimeStr);
      
      // If prayer time is in the future, schedule it
      if (prayerTime > now) {
        const timeUntilPrayer = prayerTime.getTime() - now.getTime();
        
        if (timeUntilPrayer > 0 && timeUntilPrayer < 24 * 60 * 60 * 1000) {
          const timeoutId = setTimeout(() => {
            sendPrayerNotification(prayerName);
          }, timeUntilPrayer);
          
          // Store timeout ID for cleanup
          if (!window.prayerNotificationTimeouts) {
            window.prayerNotificationTimeouts = [];
          }
          window.prayerNotificationTimeouts.push(timeoutId);
          
          console.log(`⏰ Scheduled ${prayerName} notification in ${Math.round(timeUntilPrayer/60000)} minutes`);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error(`Error scheduling ${prayerName} notification:`, error);
      return false;
    }
  };

  const parseTimeString = (timeStr) => {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    
    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;
    
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    
    // If the time has already passed today, schedule for tomorrow
    if (date < new Date()) {
      date.setDate(date.getDate() + 1);
    }
    
    return date;
  };

  const sendPrayerNotification = (prayerName) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return false;
    }

    try {
      // Use service worker for PWA (supports actions and background)
      if ('serviceWorker' in navigator && serviceWorkerReady) {
        const options = {
          body: `It's time for ${prayerName} prayer. May your prayers be accepted. 🌙`,
          tag: `prayer-${prayerName}-${Date.now()}`,
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

        navigator.serviceWorker.ready.then(registration => {
          registration.showNotification(`${prayerName} Prayer Time`, options)
            .then(() => console.log(`📢 PWA Notification sent: ${prayerName}`))
            .catch(error => {
              console.error('PWA Notification failed, falling back to simple notification:', error);
              sendSimpleBrowserNotification(prayerName);
            });
        });
      } else {
        // Use simple browser notifications (no actions)
        sendSimpleBrowserNotification(prayerName);
      }
      
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  };

  const sendSimpleBrowserNotification = (prayerName) => {
    const options = {
      body: `It's time for ${prayerName} prayer. May your prayers be accepted. 🌙`,
      tag: `prayer-${prayerName}-${Date.now()}`,
      requireInteraction: false
    };

    const notification = new Notification(`${prayerName} Prayer Time`, options);
    notification.onclick = () => {
      window.focus();
      notification.close();
    };
    console.log(`📢 Simple Browser Notification sent: ${prayerName}`);
  };

  const refreshNotifications = async () => {
    if (userLocation) {
      setLoading(true);
      try {
        const times = await calculatePrayerTimes(userLocation.latitude, userLocation.longitude);
        setPrayerTimes(times);
        
        if (notificationsEnabled) {
          await scheduleAllPrayerNotifications(times);
        }
      } catch (error) {
        console.error('Error refreshing notifications:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const value = {
    notificationsEnabled,
    prayerTimes,
    userLocation,
    loading,
    serviceWorkerReady,
    refreshNotifications,
    enableAutoNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};