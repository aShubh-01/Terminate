// ── Health Route ────────────────────────────────────────────
const router = require("express").Router()

router.get("/", (req, res) => {
  res.json({
    ok: true,
    service: "terminate-server",
    version: require("../../package.json").version,
    uptime: Math.floor(process.uptime()),
  })
})

module.exports = router
