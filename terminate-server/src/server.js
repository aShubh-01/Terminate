// ── Terminate Server ─ Entry Point ──────────────────────────
const app = require("./app")
const config = require("./config")
const logger = require("./utils/logger")

app.listen(config.port, () => {
  logger.info(`Terminate Server running`, {
    port: config.port,
    env: config.env,
    endpoints: ["/v1/health", "/v1/auth", "/v1/ai"],
  })
})

// ── Graceful Shutdown ───────────────────────────────────────
process.on("SIGTERM", () => {
  logger.info("SIGTERM received. Shutting down...")
  process.exit(0)
})

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled rejection", { error: err.message, stack: err.stack })
})
