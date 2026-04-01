/**
 * Execution Context Module
 * Manages runtime state during pipeline execution
 */

/**
 * Create a new execution context
 * @returns {object} - Execution context with results storage and step tracking
 */
function createExecutionContext() {
  return {
    /**
     * Store for step results (1-indexed)
     * @type {object}
     */
    results: {},
    
    /**
     * Current step number being executed
     * @type {number}
     */
    step: 0
  }
}

/**
 * Store a step result in the execution context
 * @param {object} context - The execution context
 * @param {number} stepNumber - The step number (1-indexed)
 * @param {any} result - The result to store
 */
function storeResult(context, stepNumber, result) {
  if (!context || typeof context !== 'object') {
    throw new Error("Invalid execution context")
  }
  
  if (!Number.isInteger(stepNumber) || stepNumber <= 0) {
    throw new Error("Step number must be a positive integer")
  }
  
  context.results[stepNumber] = result
}

/**
 * Get a step result from the execution context
 * @param {object} context - The execution context
 * @param {number} stepNumber - The step number to retrieve (1-indexed)
 * @returns {any} - The stored result
 * @throws {Error} - If result doesn't exist
 */
function getResult(context, stepNumber) {
  if (!context || typeof context !== 'object') {
    throw new Error("Invalid execution context")
  }
  
  if (!Number.isInteger(stepNumber) || stepNumber <= 0) {
    throw new Error("Step number must be a positive integer")
  }
  
  if (!context.results.hasOwnProperty(stepNumber)) {
    throw new Error(`Result for step ${stepNumber} not found`)
  }
  
  return context.results[stepNumber]
}

/**
 * Increment the current step counter
 * @param {object} context - The execution context
 */
function incrementStep(context) {
  if (!context || typeof context !== 'object') {
    throw new Error("Invalid execution context")
  }
  
  context.step++
}

/**
 * Get the current step number
 * @param {object} context - The execution context
 * @returns {number} - The current step number
 */
function getCurrentStep(context) {
  if (!context || typeof context !== 'object') {
    throw new Error("Invalid execution context")
  }
  
  return context.step
}

module.exports = {
  createExecutionContext,
  storeResult,
  getResult,
  incrementStep,
  getCurrentStep
}