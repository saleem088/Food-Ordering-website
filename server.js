/* =====================================================
   server.js - Starts the HTTP Server
   Project : Tasty Bites Online Ordering System
   Run     : npm run dev   (auto-restart)  or  npm start
   Needs   : app.js, .env (PORT)
   Does    : listen on PORT, explain common start-up
             errors, shut down cleanly
   ===================================================== */

"use strict";

const app = require("./app"); // also loads .env and opens the database
const { closeDatabase } = require("./config/db");

const PORT = Number(process.env.PORT) || 5000;

const server = app.listen(PORT, () => {
  console.log("====================================================");
  console.log(" Tasty Bites API running");
  console.log(" URL    : http://localhost:" + PORT + "/api");
  console.log(" Health : http://localhost:" + PORT + "/api/health");
  console.log(" Mode   : " + (process.env.NODE_ENV || "development"));
  console.log("====================================================");
});

// ---------- Start-up errors ----------
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error("Port " + PORT + " is already in use. Stop the other server or change PORT in .env.");
  } else {
    console.error("Server error:", err.message);
  }
  process.exit(1);
});

// ---------- Clean shutdown (Ctrl+C or a stop signal) ----------
let shuttingDown = false;

function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("\n" + signal + " received. Shutting down...");

  server.close(() => {
    closeDatabase();
    console.log("Server stopped.");
    process.exit(0);
  });

  // Force exit if connections do not close in time
  setTimeout(() => process.exit(1), 10000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

// ---------- Last-resort safety nets ----------
process.on("unhandledRejection", (reason) => {
  console.error("Unhandled promise rejection:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught exception:", err);
  shutdown("uncaughtException");
});