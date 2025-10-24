// frontend/src/utils/prayerCalculator.js
import { CalculationMethod, PrayerTimes, Coordinates } from 'adhan';

export const calculatePrayerTimes = (latitude, longitude, date = new Date()) => {
  const coordinates = new Coordinates(latitude, longitude);
  
  // Use Malaysia calculation method
  const params = CalculationMethod.MuslimWorldLeague();
  params.madhab = 'Shafi'; // Mazhab Syafie
  
  const prayerTimes = new PrayerTimes(coordinates, date, params);
  
  return {
    fajr: formatTime(prayerTimes.fajr),
    sunrise: formatTime(prayerTimes.sunrise),
    dhuhr: formatTime(prayerTimes.dhuhr),
    asr: formatTime(prayerTimes.asr),
    maghrib: formatTime(prayerTimes.maghrib),
    isha: formatTime(prayerTimes.isha),
    method: 'Muslim World League (Shafi)',
    calculated: true
  };
};

const formatTime = (date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Default coordinates for Kuala Lumpur
export const defaultCoordinates = {
  latitude: 3.1390,
  longitude: 101.6869,
  city: 'Kuala Lumpur'
};