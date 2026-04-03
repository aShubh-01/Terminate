/**
 * Help Printer Module
 * Handles displaying help information for tools and functions
 */

/**
 * Print help information for a specific tool function
 * @param {string} file - The tool file name
 * @param {string} fn - The function name
 * @param {object|null} schema - The validation schema
 */
function printHelp(file, fn, schema) {
  const fnSchema = schema && schema[fn]

  if (!fnSchema) {
    console.log("No help available for this function")
    process.exit(0)
  }

  console.log(`\n:${file}.${fn}`)
  if (fnSchema.description) {
    console.log(fnSchema.description)
  }

  const required = new Set(fnSchema.required || [])

  console.log("\nArguments:\n")

  for (const [name, prop] of Object.entries(fnSchema.properties || {})) {
    const type = Array.isArray(prop.type)
      ? prop.type.join(" | ")
      : prop.type

    const label = required.has(name) ? "required" : "optional"

    if (prop.description) {
      console.log(`    ${prop.description}`)
    }
    console.log(`  ${name}`)
    console.log(`    type: ${type}`)
    console.log(`    ${label}`)
    console.log("")
  }

  if (fnSchema.examples) {
    console.log("Examples:\n")

    for (const ex of fnSchema.examples) {
      console.log(`  ${ex}`)
    }

    console.log("")
  }

  process.exit(0)
}

/**
 * Print general help information
 * @param {string} [message] - Optional custom message to display
 */
function printGeneralHelp(message) {
  if (message) {
    console.log(message)
  } else {
    console.log("Tool CLI Usage:")
    console.log("  :file.function [arguments]")
    console.log("")
    console.log("Examples:")
    console.log("  :math.add num1=10 num2=20")
    console.log("  :math.add {num1:10,num2:20}")
    console.log("  :json.parse '{\"key\":\"value\"}'")
    console.log("")
    console.log("Use --help after any command to see detailed help:")
    console.log("  :math.add --help")
  }
  process.exit(0)
}

module.exports = {
  printHelp,
  printGeneralHelp
}