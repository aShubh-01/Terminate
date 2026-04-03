// ── Terminate Server Config ─────────────────────────────────
// Single source of truth for all environment-driven settings.

require("dotenv").config()

module.exports = {
  port: parseInt(process.env.PORT || "4000", 10),
  env: process.env.NODE_ENV || "development",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30d",

  // Database (for future use)
  dbUrl: process.env.DATABASE_URL || "",

  // AI
  systemAiKey: process.env.SYSTEM_AI_KEY || "",
  systemAiModel: process.env.SYSTEM_AI_MODEL || "deepseek-chat",
  systemAiBaseUrl: process.env.SYSTEM_AI_BASE_URL || "https://api.deepseek.com",

  // Rate Limits
  rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW || "900000", 10), // 15 min
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || "100", 10),
}
