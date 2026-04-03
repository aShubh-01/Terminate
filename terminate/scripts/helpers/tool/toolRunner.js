/**
 * Tool Runner Module
 * Main orchestrator that coordinates all tool execution components
 */

const { parseArgs, validateArgs } = require("./argumentParser")
const { loadTool, loadSchema, validateToolFunction, getFunctionSchema } = require("./toolLoader")
const { executeTool } = require("./toolExecutor")
const { printHelp } = require("./helpPrinter")

/**
 * Exit the process with an error message
 * @param {string} msg - The error message to display
 */
function exit(msg) {
  if (msg) console.error(msg)
  process.exit(1)
}

/**
 * Parse a tool command string into components
 * @param {string} command - The raw command string
 * @returns {object} - Object containing file, function, and argument string
 */
function parseCommand(command) {
  const trimmedCommand = command.replace(/\\/g, "").trim()
  const firstSpace = trimmedCommand.indexOf(" ")

  const selector = firstSpace === -1 ? trimmedCommand : trimmedCommand.slice(0, firstSpace)
  const argString = firstSpace === -1 ? "" : trimmedCommand.slice(firstSpace + 1)

  if (!selector.includes(".")) {
    throw new Error("Invalid format. Use :file.function")
  }

  const [file, fn] = selector.split(".")
  return { file, fn, argString }
}

/**
 * Main tool execution function
 * @param {string} rawCommand - The raw command string from CLI
 * @returns {Promise<void>}
 */
async function runTool(rawCommand) {
  // Validate command format
  if (!rawCommand.startsWith(":")) {
    exit("Invalid tool command")
  }

  const command = rawCommand.slice(1)
  
  // Parse command components
  const { file, fn, argString } = parseCommand(command)

  // Load tool and schema
  let tool, schema, fnSchema

  try {
    tool = loadTool(file)
    schema = loadSchema(file)
    fnSchema = getFunctionSchema(schema, fn)
  } catch (error) {
    exit(error.message)
  }

  // Validate tool function exists
  try {
    validateToolFunction(tool, fn)
  } catch (error) {
    exit(error.message)
  }

  // Handle help mode
  if (argString.trim() === "--help") {
    printHelp(file, fn, schema)
  }

  // Parse arguments
  let args
  try {
    args = parseArgs(argString, fnSchema)
  } catch (error) {
    exit(error.message)
  }

  // Validate arguments
  const validation = validateArgs(args, fnSchema)
  if (!validation.valid) {
    console.error("Input validation failed:")
    for (const err of validation.errors) {
      console.error(`${err.path} ${err.message}`)
    }
    process.exit(1)
  }

  // Execute tool
  try {
    const result = await executeTool(tool, fn, args)
    
    // Output result if defined
    if (result !== undefined) {
      console.log(result)
    }
  } catch (error) {
    exit(error.message)
  }
}

module.exports = {
  runTool,
  parseCommand
}