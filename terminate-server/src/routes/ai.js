// ── AI Routes ───────────────────────────────────────────────
const router = require("express").Router()
const aiController = require("../controllers/aiController")
const auth = require("../middleware/auth")
const rateLimit = require("../middleware/rateLimit")

// All AI routes require authentication + rate limiting
router.post("/prompt", auth, rateLimit, aiController.prompt)

module.exports = router
