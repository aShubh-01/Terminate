/**
 * Pipeline Runner Module
 * Main orchestrator for pipeline execution
 */

const { parsePipeline } = require("./parsePipeline")
const { validatePipeline } = require("./validatePipeline")
const { resolvePlaceholders } = require("./resolvePlaceholders")
const { createExecutionContext } = require("./executionContext")
const { parseCommand } = require("../tool/toolRunner")
const { loadTool, loadSchema, validateToolFunction, getFunctionSchema } = require("../tool/toolLoader")
const { executeTool } = require("../tool/toolExecutor")

/**
 * Exit the process with an error message (consistent with toolRunner.js)
 * @param {string} msg - The error message to display
 */
function exit(msg) {
  if (msg) console.error(msg)
  process.exit(1)
}

/**
 * Detect the type of a step command
 * @param {string} stepCommand - The step command string
 * @returns {object} - Object with type ('tool') and content
 */
function detectStepType(stepCommand) {
  const trimmed = stepCommand.trim()

  if (trimmed.startsWith(":")) {
    return { type: "tool", content: trimmed }
  }

  if (trimmed.startsWith("!")) {
    return { type: "shell", content: trimmed.slice(1).trim() }
  }

  if (trimmed.startsWith("@")) {
    return { type: "ai", content: trimmed.slice(1).trim() }
  }

  // default → shell command
  return { type: "shell", content: trimmed }
}

/**
 * Execute a single pipeline step with detailed logging
 * @param {string} stepCommand - The step command to execute
 * @param {object} context - The execution context
 * @param {string[]} executionLog - Array to store execution log
 * @returns {Promise<any>} - The step result
 */
async function executeStep(stepCommand, context, executionLog) {
  // Resolve placeholders in the step command
  const resolvedCommand = resolvePlaceholders(stepCommand, context.results)
  
  // Detect step type
  const stepInfo = detectStepType(resolvedCommand)
  
  // Log step information
  executionLog.push(`Command ${context.step}: ${resolvedCommand}`)
  
  let result;
  
  try {
    if (stepInfo.type === "tool") {
      // Parse tool command
      const { file, fn, argString } = parseCommand(stepInfo.content.slice(1))
      
      // Load tool and schema
      const tool = loadTool(file)
      const schema = loadSchema(file)
      const fnSchema = getFunctionSchema(schema, fn)
      
      // Validate tool function
      validateToolFunction(tool, fn)
      
      // Parse and validate arguments
      const { parseArgs, validateArgs } = require("../tool/argumentParser")
      const args = parseArgs(argString, fnSchema)
      const validation = validateArgs(args, fnSchema)
      
      if (!validation.valid) {
        const errors = validation.errors.map(err => `${err.path} ${err.message}`).join('\n')
        throw new Error(`Input validation failed:\n${errors}`)
      }
      
      // Execute tool
      result = await executeTool(tool, fn, args)
      
      // Log the result
      executionLog.push(`Output: ${result}\n`)
    } else if (stepInfo.type === "shell") {
      // Execute shell command
      const { execSync } = require("child_process")
      try {
        result = execSync(stepInfo.content, { encoding: "utf8", stdio: "pipe" })
        // Store the raw shell output (not JSON stringified)
        // The placeholder resolution will handle proper escaping
        // Log the result
        executionLog.push(`Output: ${JSON.stringify(result)}\n`)
      } catch (error) {
        throw new Error(`Shell command failed: ${error.message}`)
      }
    } else if (stepInfo.type === "ai") {
      // Execute AI prompt (placeholder for now)
      console.log(`AI PROMPT: ${stepInfo.content}`)
      result = `AI response for: ${stepInfo.content}`
      // Log the result
      executionLog.push(`Output: ${result}\n`)
    }
  } catch (error) {
    throw new Error(`Step execution failed: ${error.message}`)
  }
  
  return result
}

/**
 * Main pipeline execution function
 * @param {string} pipelineCommand - The raw pipeline command string
 * @returns {Promise<void>}
 */
async function runPipeline(pipelineCommand) {
  try {
    // Parse pipeline into steps
    const steps = parsePipeline(pipelineCommand)
    
    // Validate pipeline steps and placeholder references
    validatePipeline(steps)
    
    // Create execution context
    const context = createExecutionContext()
    
    // Initialize execution log
    const executionLog = []
    
    // Execute steps sequentially
    for (let i = 0; i < steps.length; i++) {
      context.step = i + 1 // 1-indexed step number
      const stepCommand = steps[i]
      
      try {
        // Execute the step with logging
        const result = await executeStep(stepCommand, context, executionLog)
        
        // Store result (1-indexed)
        context.results[context.step] = result
        
      } catch (error) {
        // Stop pipeline on first error
        exit(`Pipeline failed at step ${context.step}: ${error.message}`)
      }
    }
    
    // Print execution summary
    console.log("=== Pipeline Execution Summary ===")
    executionLog.forEach(line => console.log(line))
    
  } catch (error) {
    // Handle parsing or validation errors
    exit(`Pipeline error: ${error.message}`)
  }
}

module.exports = {
  runPipeline
}