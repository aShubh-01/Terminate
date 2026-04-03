// ── AI Controller ───────────────────────────────────────────
// Handles AI prompt requests. Supports system AI and BYO keys.

const config = require("../config")
const logger = require("../utils/logger")

// ── POST /v1/ai/prompt ──────────────────────────────────────
exports.prompt = async (req, res) => {
  const { message, model, apiKey } = req.body

  if (!message) {
    return res.status(400).json({ ok: false, error: "Message is required." })
  }

  // Determine which key and model to use
  const useKey = apiKey || config.systemAiKey
  const useModel = model || config.systemAiModel
  const baseUrl = config.systemAiBaseUrl

  if (!useKey) {
    return res.status(503).json({
      ok: false,
      error: "No AI key configured. Set your own via :config.set ai_key=<key>",
    })
  }

  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${useKey}`,
      },
      body: JSON.stringify({
        model: useModel,
        messages: [
          { role: "system", content: "You are Terminate, a concise CLI assistant. Reply in short, actionable answers." },
          { role: "user", content: message },
        ],
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      logger.error("AI upstream error", { status: response.status, body: errBody })
      return res.status(502).json({ ok: false, error: "AI provider returned an error." })
    }

    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content || ""

    logger.info("AI prompt served", { userId: req.user.id, model: useModel, byoKey: !!apiKey })

    res.json({ ok: true, reply, model: useModel })
  } catch (err) {
    logger.error("AI request failed", { error: err.message })
    res.status(500).json({ ok: false, error: "Failed to reach AI provider." })
  }
}
