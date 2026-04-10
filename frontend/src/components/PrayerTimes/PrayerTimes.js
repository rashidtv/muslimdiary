import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Button,
  Grid,
  IconButton
} from '@mui/material';
import { MyLocation, Refresh } from '@mui/icons-material';

/* -----------------------------------------------------
   ✅ PrayerTimes Component (Redesigned UI)
   ----------------------------------------------------- */
const PrayerTimes = () => {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [zone, setZone] = useState('');
  const [locationName, setLocationName] = useState('');

  const hasFetched = useRef(false);
  const initialLoadRef = useRef(true);

  const API_BASE =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:5000'
      : 'https://muslimdiarybackend.onrender.com';

  /* -----------------------------------------------------
     ✅ Address Cleaner (removes municipal councils only)
     ----------------------------------------------------- */
  const cleanLocationName = (raw) => {
    if (!raw) return '';

    const blacklist = [
      'majlis perbandaran',
      'majlis bandaraya',
      'majlis daerah',
      'perbandaran',
      'bandaraya',
      'daerah'
    ];

    const parts = raw.split(',').map((p) => p.trim());

    const cleaned = parts.filter((p) => {
      const low = p.toLowerCase();
      return !blacklist.some((bad) => low.includes(bad));
    });

    return cleaned.join(', ');
  };

  /* -----------------------------------------------------
     ✅ Detect user zone & location
     ----------------------------------------------------- */
  const getCurrentZone = async () => {
    try {
      const stored = localStorage.getItem('userLocationData');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.coordinates) {
          const { latitude, longitude } = parsed.coordinates;
          const response = await fetch(
            `${API_BASE}/api/prayertimes/coordinates/${latitude}/${longitude}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success)
              return {
                zone: data.data.zone,
                locationName: cleanLocationName(data.data.locationName)
              };
          }
        }
      }

      // Fallback: browser geolocation
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur, Malaysia' });
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            const { latitude, longitude } = pos.coords;
            try {
              const response = await fetch(
                `${API_BASE}/api/prayertimes/coordinates/${latitude}/${longitude}`
              );
              if (response.ok) {
                const data = await response.json();
                if (data.success)
                  resolve({
                    zone: data.data.zone,
                    locationName: cleanLocationName(data.data.locationName)
                  });
                else resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur' });
              }
            } catch (e) {
              resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur' });
            }
          },
          () => resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur' }),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      });
    } catch (error) {
      return { zone: 'WLY01', locationName: 'Kuala Lumpur' };
    }
  };

  /* -----------------------------------------------------
     ✅ Load on mount
     ----------------------------------------------------- */
  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;

      setTimeout(() => {
        if (!hasFetched.current) {
          hasFetched.current = true;
          fetchPrayerTimes();
        }
      }, 100);
    }
  }, []);

  useEffect(() => {
    if (prayerTimes) {
      setLastUpdated(new Date().toLocaleTimeString());
    }
  }, [prayerTimes]);

  /* -----------------------------------------------------
     ✅ Fetch prayer times
     ----------------------------------------------------- */
  const fetchPrayerTimes = async () => {
    if (loading) return;

    setLoading(true);
    setError('');

    try {
      const { zone: userZone, locationName: locName } = await getCurrentZone();

      setZone(userZone);
      setLocationName(locName);

      const response = await fetch(`${API_BASE}/api/prayertimes/${userZone}`);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);

      const data = await response.json();
      if (data.success && data.data) {
        setPrayerTimes(data.data);
        localStorage.setItem('lastKnownZone', userZone);
      } else throw new Error(data.error || 'Invalid data');
    } catch (err) {
      setError('Failed to load prayer times: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  /* -----------------------------------------------------
     ✅ Helpers
     ----------------------------------------------------- */
  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const hour = parseInt(h);
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${period}`;
  };

  const formatName = (name) =>
    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  const currentPrayer = (() => {
    if (!prayerTimes) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const list = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];
    for (let i = list.length - 1; i >= 0; i--) {
      const [h, m] = list[i].time.split(':');
      if (nowMin >= parseInt(h) * 60 + parseInt(m)) return list[i];
    }
    return list[list.length - 1];
  })();

  const nextPrayer = (() => {
    if (!prayerTimes) return null;
    const now = new Date();
    const nowMin = now.getHours() * 60 + now.getMinutes();
    const list = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];
    for (const p of list) {
      const [h, m] = p.time.split(':');
      if (nowMin < parseInt(h) * 60 + parseInt(m)) return p;
    }
    return list[0];
  })();

  /* -----------------------------------------------------
     ✅ Loading / Error
     ----------------------------------------------------- */
  if (loading)
    return (
      <Card elevation={0} sx={{ p: 4, textAlign: 'center' }}>
        <CircularProgress sx={{ mb: 2 }} />
        <Typography>Loading prayer times...</Typography>
      </Card>
    );

  if (error)
    return (
      <Card elevation={0} sx={{ p: 3 }}>
        <Alert
          severity="error"
          action={
            <Button size="small" onClick={fetchPrayerTimes}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Card>
    );

  if (!prayerTimes)
    return (
      <Card elevation={0} sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No prayer times available</Typography>
        <Button sx={{ mt: 2 }} variant="contained" onClick={fetchPrayerTimes}>
          Reload
        </Button>
      </Card>
    );

  /* -----------------------------------------------------
     ✅ PRAYER ICONS
     ----------------------------------------------------- */
  const prayerIcons = {
    fajr: '🌙',
    dhuhr: '☀️',
    asr: '🕓',
    maghrib: '🌇',
    isha: '🌙'
  };

  /* -----------------------------------------------------
     ✅ Final Redesigned UI
     ----------------------------------------------------- */
  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        mb: 3
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 3 } }}>

        {/* ✅ Trimmed Location */}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
          <MyLocation sx={{ fontSize: 14, mr: 0.5 }} />
          {locationName}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          JAKIM Zone {zone}
        </Typography>

        {/* ✅ Dates */}
        <Box sx={{ my: 2 }}>
          <Typography variant="subtitle1" fontWeight={600}>
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </Typography>

          {prayerTimes.hijri_date && (
            <Typography variant="body2" color="text.secondary">
              {prayerTimes.hijri_date}
            </Typography>
          )}
        </Box>

        {/* ✅ Next Prayer */}
        {nextPrayer && (
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(13,148,136,0.08)',
              mb: 2
            }}
          >
            <Typography variant="caption" color="text.secondary">
              Next prayer
            </Typography>
            <Typography variant="h6" fontWeight={700}>
              {formatName(nextPrayer.name)} • {formatTime(nextPrayer.time)}
            </Typography>
          </Box>
        )}

        {/* ✅ Imsak & Syuruk */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            mb: 2
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Imsak • {formatTime(prayerTimes.imsak)}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Syuruk • {formatTime(prayerTimes.syuruk)}
          </Typography>
        </Box>

        {/* ✅ Sequential Prayer List */}
        <Box>
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((key) => {
            const isCurrent =
              currentPrayer &&
              currentPrayer.name.toLowerCase() === key;

            return (
              <Box
                key={key}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  mb: 1,
                  borderRadius: 2,
                  backgroundColor: isCurrent
                    ? 'rgba(124,58,237,0.08)'
                    : 'transparent'
                }}
              >
                <Typography variant="body1">
                  {prayerIcons[key]} {formatName(key)}
                </Typography>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight={700}>
                    {formatTime(prayerTimes[key])}
                  </Typography>
                  {isCurrent && (
                    <Typography
                      variant="caption"
                      sx={{ color: '#7C3AED' }}
                    >
                      Current
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>

        {/* ✅ Footer */}
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mt: 3, display: 'block' }}
        >
          Based on official JAKIM timetable
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PrayerTimes;
