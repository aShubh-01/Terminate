// ── Global Error Handler ────────────────────────────────────
// Catches all unhandled errors and returns a clean JSON response.

const logger = require("../utils/logger")
const config = require("../config")

function errorHandler(err, req, res, next) {
  const status = err.status || 500
  const message = err.message || "Internal Server Error"

  logger.error(message, {
    status,
    path: req.originalUrl,
    method: req.method,
    ...(config.env !== "production" && { stack: err.stack }),
  })

  res.status(status).json({
    ok: false,
    error: message,
    ...(config.env !== "production" && { stack: err.stack }),
  })
}

module.exports = errorHandler
