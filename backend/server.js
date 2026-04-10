// ============================================================
// ✅ Muslim Diary Backend (DB-Only Prayer Times Version)
// ============================================================
// - Fully stable: Uses MongoDB as authoritative storage
// - NO JAKIM API, NO cron scraping
// - Secure CORS
// - OSM reverse geocode proxy
// - Full auth + user progress system
// - Health monitoring endpoints
// ============================================================

require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Routes
const prayerTimesRoutes = require("./routes/prayerTimes");
const prayerNotificationsRoutes = require("./routes/prayerNotifications");
const authRoutes = require("./routes/auth");

const User = require("./models/User");

const app = express();


// ============================================================
// ✅ SECURITY HEADERS
// ============================================================
app.set("trust proxy", 1);

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});


// ============================================================
// ✅ CORS CONFIGURATION
// ============================================================
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "https://muslimdiary-whur.onrender.com",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
    ];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) callback(null, true);
    else {
      console.log("🚫 CORS Blocked:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "Origin",
  ],
  exposedHeaders: ["X-Total-Count", "X-API-Version"],
  maxAge: 86400,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));


// ============================================================
// ✅ BODY PARSING
// ============================================================
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));


// ============================================================
// ✅ REQUEST LOGGER
// ============================================================
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});


// ============================================================
// ✅ BASIC HEALTH ENDPOINT (No DB dependency)
// ============================================================
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    message: "Server running",
    time: new Date().toISOString(),
  });
});


// ============================================================
// ✅ OpenStreetMap Reverse Geocode Proxy
// ============================================================
app.get("/api/nominatim-proxy", async (req, res) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon)
      return res.status(400).json({ error: "lat & lon required" });

    const axios = require("axios");
    const response = await axios.get(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`,
      {
        timeout: 10000,
        headers: {
          "User-Agent": "MuslimDiaryApp/DB-Version",
        },
      }
    );

    return res.json(response.data);
  } catch (error) {
    console.error("OSM Proxy Error:", error.message);
    res.status(500).json({
      error: "Failed reverse geocode",
      details: error.message,
    });
  }
});


// ============================================================
// ✅ MONGODB CONNECTION
// ============================================================
console.log("🚀 Starting Muslim Diary Backend...");
console.log("📅 Startup:", new Date().toISOString());
console.log("🌍 Env:", process.env.NODE_ENV || "development");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 8000,
  })
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });


// MongoDB connection status logs
mongoose.connection.on("connected", () => console.log("✅ DB Connected"));
mongoose.connection.on("error", (err) =>
  console.error("❌ DB Error:", err.message)
);
mongoose.connection.on("disconnected", () => console.log("⚠️ DB Disconnected"));


// ============================================================
// ✅ HEALTH MONITORING ENDPOINTS
// ============================================================
app.get("/api/ping", (req, res) => {
  res.json({
    pong: true,
    time: new Date().toISOString(),
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

app.get("/api/health", async (req, res) => {
  res.json({
    server: "running",
    db: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});


// ============================================================
// ✅ MAIN ROUTES
// ============================================================
app.use("/api/auth", authRoutes);
app.use("/api/prayertimes", prayerTimesRoutes);
app.use("/api/notifications", prayerNotificationsRoutes);


// ============================================================
// ✅ USER PROFILE: Save user zone & location
// ============================================================
app.put("/api/user/location", async (req, res) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Missing token" });

    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const { location, zone } = req.body;

    if (location) user.location = location;
    if (zone) user.zone = zone;

    await user.save();

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============================================================
// ✅ GLOBAL 404 HANDLER
// ============================================================
app.use("*", (req, res) => {
  res.status(404).json({
    error: `Route ${req.originalUrl} not found`,
  });
});


// ============================================================
// ✅ START SERVER (Render compatible)
// ============================================================
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`🕌 Muslim Diary backend running on port ${PORT}`);
  console.log("🔗 Frontend:", process.env.FRONTEND_URL);
  console.log("✅ Ready to serve prayer times (DB-Only mode)");
});


// ============================================================
// ✅ CLEAN SHUTDOWN
// ============================================================
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received");
  server.close(() => {
    mongoose.connection.close(false, () => process.exit(0));
  });
});

process.on("SIGINT", () => {
  console.log("🛑 SIGINT received");
  server.close(() => {
    mongoose.connection.close(false, () => process.exit(0));
  });
});
