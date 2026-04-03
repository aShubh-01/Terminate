// ── Rate Limiter ────────────────────────────────────────────
// In-memory sliding window. Replace with Redis in production at scale.

const config = require("../config")

const hits = new Map() // key: IP or userId → { count, resetAt }

function rateLimit(req, res, next) {
  const key = req.user?.id || req.ip
  const now = Date.now()
  const record = hits.get(key)

  if (!record || now > record.resetAt) {
    hits.set(key, { count: 1, resetAt: now + config.rateLimitWindow })
    return next()
  }

  if (record.count >= config.rateLimitMax) {
    return res.status(429).json({
      ok: false,
      error: "Rate limit exceeded. Try again later.",
    })
  }

  record.count++
  next()
}

module.exports = rateLimit
