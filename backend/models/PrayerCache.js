const mongoose = require('mongoose');

const prayerCacheSchema = new mongoose.Schema({
  zone: { type: String, required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  fajr: String,
  dhuhr: String,
  asr: String,
  maghrib: String,
  isha: String,
  source: String,
}, {
  timestamps: true
});

prayerCacheSchema.index({ zone: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('PrayerCache', prayerCacheSchema);