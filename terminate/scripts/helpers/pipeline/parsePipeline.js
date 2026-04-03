/**
 * Pipeline Parser Module
 * Safely splits pipeline commands by pipes while respecting quoted strings
 */

/**
 * Parse a pipeline command into individual steps
 * @param {string} pipelineCommand - The raw pipeline command string
 * @returns {string[]} - Array of step command strings
 * @throws {Error} - If pipeline is empty or invalid
 */
function parsePipeline(pipelineCommand) {
  if (!pipelineCommand || pipelineCommand.trim() === "") {
    throw new Error("Pipeline command cannot be empty")
  }

  const steps = []
  let currentStep = ""
  let inSingleQuote = false
  let inDoubleQuote = false
  let escaped = false

  for (let i = 0; i < pipelineCommand.length; i++) {
    const char = pipelineCommand[i]
    const nextChar = pipelineCommand[i + 1]

    // Handle escape sequences
    if (escaped) {
      currentStep += char
      escaped = false
      continue
    }

    if (char === "\\") {
      currentStep += char
      escaped = true
      continue
    }

    // Handle quote states
    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote
      currentStep += char
      continue
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote
      currentStep += char
      continue
    }

    // Split on pipe only when not inside quotes
    if (char === "|" && !inSingleQuote && !inDoubleQuote) {
      const trimmedStep = currentStep.trim()
      if (trimmedStep) {
        steps.push(trimmedStep)
      }
      currentStep = ""
      continue
    }

    currentStep += char
  }

  // Add the last step
  const trimmedStep = currentStep.trim()
  if (trimmedStep) {
    steps.push(trimmedStep)
  }

  if (steps.length === 0) {
    throw new Error("No valid steps found in pipeline")
  }

  return steps
}

module.exports = {
  parsePipeline
}