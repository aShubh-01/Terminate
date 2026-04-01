const http = require("http")
const { init, detectCommand } = require("./detector.js")
const config = require("../config")

const PORT = config.detectorPort

async function start() {
  await init()

  http.createServer(async (req, res) => {
    if (req.method !== "POST") {
      res.writeHead(404)
      res.end()
      return
    }

    let body = ""

    req.on("data", chunk => body += chunk)

    req.on("end", async () => {
      try {
        const { input } = JSON.parse(body)

        const result = await detectCommand(input)

        res.writeHead(200, {
          "Content-Type": "application/json"
        })

        res.end(JSON.stringify({ result }))
      } catch (err) {
        res.writeHead(500)
        res.end(JSON.stringify({ error: err.message }))
      }
    })
  }).listen(PORT)

  console.log(`Detector server running on ${PORT}`)
}

start()