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
  Chip,
  IconButton
} from '@mui/material';
import {
  MyLocation,
  Refresh
} from '@mui/icons-material';

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
     ✅ Detect user zone (kept exactly as your original logic)
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
              return { zone: data.data.zone, locationName: data.data.locationName };
          }
        }
      }

      // Fallback: browser geolocation
      return new Promise((resolve) => {
        if (!navigator.geolocation) {
          resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur / Putrajaya' });
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
                  resolve({ zone: data.data.zone, locationName: data.data.locationName });
                else resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur / Putrajaya' });
              }
            } catch (e) {
              resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur / Putrajaya' });
            }
          },
          () => resolve({ zone: 'WLY01', locationName: 'Kuala Lumpur / Putrajaya' }),
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
        );
      });
    } catch (error) {
      return { zone: 'WLY01', locationName: 'Kuala Lumpur / Putrajaya' };
    }
  };

  /* -----------------------------------------------------
     ✅ MAIN EFFECT → Fetch prayer times once on mount
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
     ✅ Fetch prayer times from backend API
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

  const getCurrentPrayer = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];

    for (let i = prayers.length - 1; i >= 0; i--) {
      if (prayers[i].time) {
        const [h, m] = prayers[i].time.split(':');
        const tMin = parseInt(h) * 60 + parseInt(m);
        if (minutesNow >= tMin) return prayers[i];
      }
    }
    return prayers[prayers.length - 1];
  };

  const getNextPrayer = () => {
    if (!prayerTimes) return null;

    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    const prayers = [
      { name: 'Fajr', time: prayerTimes.fajr },
      { name: 'Dhuhr', time: prayerTimes.dhuhr },
      { name: 'Asr', time: prayerTimes.asr },
      { name: 'Maghrib', time: prayerTimes.maghrib },
      { name: 'Isha', time: prayerTimes.isha }
    ];

    for (const p of prayers) {
      const [h, m] = p.time.split(':');
      const tMin = parseInt(h) * 60 + parseInt(m);
      if (minutesNow < tMin) return p;
    }
    return prayers[0];
  };

  const currentPrayer = getCurrentPrayer();
  const nextPrayer = getNextPrayer();

  /* -----------------------------------------------------
     ✅ Loading / Error states
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

        {/* ✅ Location */}
        <Box sx={{ mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <MyLocation sx={{ fontSize: 14, mr: 0.5 }} />
            {locationName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            JAKIM Zone {zone}
          </Typography>
        </Box>

        {/* ✅ Gregorian + Hijri Dates */}
        <Box sx={{ mb: 2 }}>
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
              mb: 2,
              borderRadius: 2,
              backgroundColor: 'rgba(13,148,136,0.08)'
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
        {(prayerTimes.imsak || prayerTimes.syuruk) && (
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
        )}

        {/* ✅ Minimalist Prayer Grid */}
        <Grid container spacing={1.5}>
          {['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].map((key) => {
            const isCurrent =
              currentPrayer &&
              currentPrayer.name.toLowerCase() === key;

            return (
              <Grid item xs={6} key={key}>
                <Box
                  sx={{
                    p: 2,
                    textAlign: 'center',
                    borderRadius: 2,
                    backgroundColor: isCurrent
                      ? 'rgba(124,58,237,0.08)'
                      : 'transparent'
                  }}
                >
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    fontWeight={600}
                  >
                    {formatName(key)}
                  </Typography>

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
              </Grid>
            );
          })}
        </Grid>

        {/* ✅ Footer */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Based on official JAKIM timetable
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default PrayerTimes;
