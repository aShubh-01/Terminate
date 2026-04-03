// ── Terminate Server ─ Express App ──────────────────────────
const express = require("express")
const errorHandler = require("./middleware/errorHandler")

const app = express()

// ── Core Middleware ─────────────────────────────────────────
app.use(express.json({ limit: "1mb" }))

// ── API Routes (versioned) ──────────────────────────────────
app.use("/v1/health", require("./routes/health"))
app.use("/v1/auth",   require("./routes/auth"))
app.use("/v1/ai",     require("./routes/ai"))

// ── 404 Catch ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, error: "Route not found." })
})

// ── Error Handler (must be last) ────────────────────────────
app.use(errorHandler)

module.exports = app
