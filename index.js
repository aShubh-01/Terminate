#!/usr/bin/env node

const { runTool } = require("./scripts/helpers/tool/toolRunner")
const { runPipeline } = require("./scripts/helpers/pipeline/pipelineRunner")

const rawCommand = process.argv.slice(2).join(" ").trim()

/* ─────────────────────────────
   Pipeline Mode
───────────────────────────── */

if (rawCommand.startsWith("--")) {
  const pipeline = rawCommand.slice(2).trim()
  runPipeline(pipeline)
  return
}

/* ─────────────────────────────
   Tool Mode
───────────────────────────── */

runTool(rawCommand)