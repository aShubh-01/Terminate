// ── JWT Auth Middleware ──────────────────────────────────────
// Verifies Bearer token and injects `req.user`.

const jwt = require("jsonwebtoken")
const config = require("../config")

function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ ok: false, error: "Missing or invalid token." })
  }

  const token = header.split(" ")[1]

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.user = payload // { id, email, plan, iat, exp }
    next()
  } catch (err) {
    return res.status(401).json({ ok: false, error: "Token expired or invalid." })
  }
}

module.exports = auth
