// ── Auth Controller ─────────────────────────────────────────
// Handles user registration, login, and token verification.

const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const config = require("../config")
const logger = require("../utils/logger")

// ── In-Memory User Store (Replace with DB) ──────────────────
const users = new Map()

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex")
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, plan: user.plan || "free" },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  )
}

// ── POST /v1/auth/register ──────────────────────────────────
exports.register = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Email and password required." })
  }

  if (users.has(email)) {
    return res.status(409).json({ ok: false, error: "User already exists." })
  }

  const user = {
    id: crypto.randomUUID(),
    email,
    password: hashPassword(password),
    plan: "free",
    createdAt: new Date().toISOString(),
  }

  users.set(email, user)
  const token = generateToken(user)

  logger.info("User registered", { email: user.email, id: user.id })

  res.status(201).json({
    ok: true,
    token,
    user: { id: user.id, email: user.email, plan: user.plan },
  })
}

// ── POST /v1/auth/login ─────────────────────────────────────
exports.login = async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ ok: false, error: "Email and password required." })
  }

  const user = users.get(email)
  if (!user || user.password !== hashPassword(password)) {
    return res.status(401).json({ ok: false, error: "Invalid credentials." })
  }

  const token = generateToken(user)

  logger.info("User logged in", { email: user.email })

  res.json({
    ok: true,
    token,
    user: { id: user.id, email: user.email, plan: user.plan },
  })
}

// ── GET /v1/auth/me ─────────────────────────────────────────
exports.me = async (req, res) => {
  res.json({
    ok: true,
    user: req.user,
  })
}
