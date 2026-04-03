// ── Structured Logger ───────────────────────────────────────
// Lightweight, production-safe logger with levels and timestamps.

const config = require("../config")

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 }
const CURRENT = config.env === "production" ? LEVELS.info : LEVELS.debug

function format(level, msg, meta) {
  const ts = new Date().toISOString()
  const base = `[${ts}] [${level.toUpperCase()}] ${msg}`
  if (meta && Object.keys(meta).length) {
    return `${base} ${JSON.stringify(meta)}`
  }
  return base
}

const logger = {
  error: (msg, meta) => CURRENT >= LEVELS.error && console.error(format("error", msg, meta)),
  warn:  (msg, meta) => CURRENT >= LEVELS.warn  && console.warn(format("warn", msg, meta)),
  info:  (msg, meta) => CURRENT >= LEVELS.info  && console.log(format("info", msg, meta)),
  debug: (msg, meta) => CURRENT >= LEVELS.debug && console.log(format("debug", msg, meta)),
}

module.exports = logger
