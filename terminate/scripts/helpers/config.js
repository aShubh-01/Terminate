/**
 * Configuration Manager
 * Handles loading and validation of system and user paths
 */

const path = require("path")
const fs = require("fs")

const isPkg = typeof process.pkg !== "undefined"

// Determine the core system path (physical disk)
const corePath = isPkg
  ? path.join(path.dirname(process.execPath), "..")
  : path.join(__dirname, "..", "..")

// Attempt to load external config.json from the core path
const configPath = path.join(corePath, "config.json")
let externalConfig = {}

if (fs.existsSync(configPath)) {
  try {
    externalConfig = JSON.parse(fs.readFileSync(configPath, "utf8"))
  } catch (err) {
    console.error(`Failed to parse config.json: ${err.message}`)
  }
}

// Final paths (External Config > Environment Var > Default Workspace)
const config = {
  corePath: corePath,
  userPath:
    externalConfig.userPath ||
    process.env.CLI_USER_PATH ||
    path.join(corePath, "user"),
  encryptionKey:
    externalConfig.encryptionKey ||
    process.env.CLI_ENCRYPTION_KEY ||
    null,
  detectorPort:
    externalConfig.detectorPort ||
    process.env.CLI_DETECTOR_PORT ||
    4545
}

module.exports = config
