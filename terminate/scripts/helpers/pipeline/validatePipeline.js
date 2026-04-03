/**
 * Pipeline Validator Module
 * Validates pipeline steps and placeholder references
 */

/**
 * Validate pipeline steps and placeholder usage
 * @param {string[]} steps - Array of step command strings
 * @throws {Error} - If validation fails with descriptive error message
 */
function validatePipeline(steps) {
  if (!Array.isArray(steps) || steps.length === 0) {
    throw new Error("Invalid pipeline: no steps provided")
  }

  // Check for placeholders in each step
  for (let i = 0; i < steps.length; i++) {
    const stepIndex = i + 1 // 1-indexed for user-facing messages
    const step = steps[i]
    
    // Find all placeholder references in this step
    const placeholders = step.match(/\$(\d+)/g)
    
    if (placeholders) {
      for (const placeholder of placeholders) {
        const refStep = parseInt(placeholder.slice(1), 10)
        
        // Check if placeholder references a future step
        if (refStep > stepIndex) {
          throw new Error(
            `Invalid pipeline: step ${stepIndex} references $${refStep} but only ${stepIndex} step(s) exist`
          )
        }
        
        // Check if placeholder references step 0 or negative
        if (refStep <= 0) {
          throw new Error(
            `Invalid pipeline: step ${stepIndex} contains invalid placeholder $${refStep}`
          )
        }
      }
    }
  }
}

module.exports = {
  validatePipeline
}