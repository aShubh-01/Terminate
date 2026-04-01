/**
 * Tool Loader Module
 * Handles loading and validation of tool files and their schemas
 */

const path = require("path")
const fs = require("fs")
const config = require("../config")

/**
 * Load a tool module from the tools directory
 * @param {string} file - The tool file name (without extension)
 * @returns {object} - The loaded tool module
 * @throws {Error} - If tool file is not found or cannot be loaded
 */
function loadTool(file) {
  const userToolsPath = path.join(config.userPath, "tools", `${file}.js`)
  
  // __dirname correctly resolves inside the snapshot when running in pkg
  const coreToolsPath = path.resolve(__dirname, "..", "..", "..", "tools", `${file}.js`)

  const toolPath = fs.existsSync(userToolsPath) ? userToolsPath : coreToolsPath

  if (!fs.existsSync(toolPath)) {
    throw new Error(`Tool file not found: ${file}.js`)
  }

  try {
    return require(toolPath)
  } catch (error) {
    throw new Error(`Failed to load tool ${file}: ${error.message}`)
  }
}

/**
 * Load validation schema for a tool
 * @param {string} file - The tool file name (without extension)
 * @returns {object|null} - The validation schema or null if not found
 */
function loadSchema(file) {
  const userValidatorPath = path.join(config.userPath, "tools", "validators", `${file}.json`)
  
  // __dirname correctly resolves inside the snapshot when running in pkg
  const coreValidatorPath = path.resolve(__dirname, "..", "..", "..", "tools", "validators", `${file}.json`)

  const validatorPath = fs.existsSync(userValidatorPath) ? userValidatorPath : coreValidatorPath

  if (!fs.existsSync(validatorPath)) {
    return null
  }

  try {
    return require(validatorPath)
  } catch (error) {
    throw new Error(`Failed to load schema for ${file}: ${error.message}`)
  }
}

/**
 * Validate that a tool function exists in the loaded module
 * @param {object} tool - The loaded tool module
 * @param {string} fn - The function name to validate
 * @throws {Error} - If function is not found in the tool module
 */
function validateToolFunction(tool, fn) {
  if (typeof tool[fn] !== "function") {
    throw new Error(`Function '${fn}' not found in ${tool.constructor.name || 'tool'}`)
  }
}

/**
 * Get the schema for a specific function
 * @param {object|null} schema - The full schema object
 * @param {string} fn - The function name
 * @returns {object|null} - The function schema or null if not found
 */
function getFunctionSchema(schema, fn) {
  if (!schema || !schema[fn]) {
    return null
  }
  return schema[fn]
}

module.exports = {
  loadTool,
  loadSchema,
  validateToolFunction,
  getFunctionSchema
}