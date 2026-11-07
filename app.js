/* =====================================================
   app.js - Express Application Setup
   Project : Tasty Bites Online Ordering System
   Used by : server.js (starts it), tests (import it)
   Needs   : .env, config/db.js, all routes, middleware
   Order   : security -> parsing -> routes -> 404 -> errors
   Note    : does NOT call listen(). server.js does that.
   ===================================================== */

"use strict";

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

require("./config/db"); // opens the database and creates tables on first load

const {
  requireJsonBody,
  sanitizeBody
} = require("./middleware/validate.middleware");
const { notFound, errorHandler } = require("./middleware/error.middleware");

const authRoutes = require("./routes/auth.routes");
const menuRoutes = require("./routes/menu.routes");
const orderRoutes = require("./routes/order.routes");
const adminRoutes = require("./routes/admin.routes");

const IS_TEST = process.env.NODE_ENV === "test";

const app = express();

// Behind a proxy (deployment) the real client IP is needed for rate limits
if (process.env.TRUST_PROXY) app.set("trust proxy", Number(process.env.TRUST_PROXY) || 1);
app.disable("x-powered-by");

// =====================================================
// 1. SECURITY HEADERS
// =====================================================
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        "img-src": ["'self'", "data:", "https://www.themealdb.com", "https://images.unsplash.com"]
      }
    }
  })
);

// =====================================================
// 2. CORS (only the websites listed in .env)
// =====================================================
const allowedOrigins = String(process.env.CLIENT_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsHandler = cors({
  origin(origin, callback) {
    // No Origin header: Postman, curl, server-to-server, tests
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  maxAge: 600
});

app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (origin && origin === `${req.protocol}://${req.get("host")}`) return next();
  return corsHandler(req, res, next);
});

// =====================================================
// 3. GLOBAL RATE LIMIT (safety net)
// =====================================================
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    skip: () => IS_TEST,
    handler: (req, res) =>
      res.status(429).json({ message: "Too many requests. Please wait a moment and try again." })
  })
);

// =====================================================
// 4. BODY PARSING AND SHAPE CHECKS
// =====================================================
app.use(express.json({ limit: "10kb" }));
app.use(requireJsonBody);
app.use(sanitizeBody);

// =====================================================
// 5. ROUTES
// =====================================================
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// Serve the browser app from the API origin so its modules and API requests work together.
app.use(express.static(path.join(__dirname, "..", "client")));

// =====================================================
// 6. 404 AND ERRORS (must be LAST, in this order)
// =====================================================
app.use(notFound);
app.use(errorHandler);

module.exports = app;