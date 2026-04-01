 /**
 * Argument Parser Module
 * Handles parsing of command-line arguments for tool execution
 */

const Ajv = require("ajv")

const ajv = new Ajv({
  allErrors: true,
  allowUnionTypes: true
})

/**
 * Normalize object syntax by adding quotes around keys
 * @param {string} str - The string to normalize
 * @returns {string} - The normalized string
 */
function normalizeObjectSyntax(str) {
  // Handle both colon and equals syntax for object keys
  return str.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*([:=])/g, '$1"$2"$3')
}
/**
 * Parse a single value from string to appropriate type
 * @param {string} value - The string value to parse
 * @returns {any} - The parsed value (string, number, boolean, or object)
 */
function parseValue(value) {
  value = value.trim()

  // Handle quoted strings
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1)
  }

  // Handle booleans
  if (value === "true") return true
  if (value === "false") return false

  // Handle numbers
  const num = Number(value)
  if (!Number.isNaN(num)) return num

  // Handle objects and arrays
  if (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith("[") && value.endsWith("]"))
  ) {
    try {
      return JSON.parse(value)
    } catch { }
  }

  return value
}

/**
 * Parse argument string into an object
 * @param {string} argString - The argument string to parse
 * @param {object} fnSchema - The function schema for validation
 * @returns {object} - The parsed arguments object
 */
function parseArgs(argString, fnSchema) {
  let args = {}

  // Parse key=value pairs
const regex = /(\w+)\s*=\s*("[^"]*"|'[^']*'|\{[^}]*\}|\[[^\]]*\]|[^,\s}]+)/g
  let match

  while ((match = regex.exec(argString)) !== null) {
    args[match[1]] = parseValue(match[2])
  }

  const trimmed = argString.trim()

  // If no key=value pairs found and there's content, try to parse as direct input
  if (Object.keys(args).length === 0 && trimmed) {
    try {
      // Direct object
      if (trimmed.startsWith("{")) {
        const normalized = normalizeObjectSyntax(trimmed)
        args = JSON.parse(normalized)
      }
      // Direct string/value
      else {
        let value = parseValue(trimmed)

        // If schema has required fields, use the first one as the key
        if (fnSchema && fnSchema.required?.length) {
          const key = fnSchema.required[0]
          args[key] = value
        }
      }
    } catch (error) {
      throw new Error(`Invalid object syntax: ${error.message}`)
    }
  }

  return args
}

/**
 * Validate arguments against schema
 * @param {object} args - The arguments to validate
 * @param {object} schema - The validation schema
 * @returns {object} - Validation result with valid flag and errors
 */
function validateArgs(args, schema) {
  if (!schema) {
    return { valid: true, errors: [] }
  }

  const validate = ajv.compile(schema)
  const valid = validate(args)

  if (!valid) {
    return {
      valid: false,
      errors: validate.errors.map(err => ({
        path: err.instancePath,
        message: err.message,
        keyword: err.keyword,
        params: err.params
      }))
    }
  }

  return { valid: true, errors: [] }
}

module.exports = {
  parseArgs,
  validateArgs,
  parseValue
}