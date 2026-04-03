/**
 * Tool Executor Module
 * Handles the execution of tool functions with proper error handling
 */

/**
 * Execute a tool function with the provided arguments
 * @param {object} tool - The loaded tool module
 * @param {string} fn - The function name to execute
 * @param {object} args - The arguments to pass to the function
 * @returns {Promise<any>} - The result of the function execution
 * @throws {Error} - If execution fails
 */
async function executeTool(tool, fn, args) {
  try {
    const result = await tool[fn](args)

    // Only output result if it's defined and not null
    if (result !== undefined) {
      return result
    }

    return null
  } catch (error) {
    throw new Error(`Tool execution failed: ${error.message}`)
  }
}

/**
 * Execute tool with proper error handling and result formatting
 * @param {object} tool - The loaded tool module
 * @param {string} fn - The function name to execute
 * @param {object} args - The arguments to pass to the function
 * @returns {Promise<{success: boolean, result?: any, error?: string}>} - Execution result
 */
async function executeToolWithResult(tool, fn, args) {
  try {
    const result = await executeTool(tool, fn, args)
    return {
      success: true,
      result: result
    }
  } catch (error) {
    return {
      success: false,
      error: error.message
    }
  }
}

module.exports = {
  executeTool,
  executeToolWithResult
}