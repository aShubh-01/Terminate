/**
 * Placeholder Resolver Module
 * Replaces $n placeholders with stored step results
 */

/**
 * Resolve placeholders in a step command using stored results
 * @param {string} stepCommand - The step command string with placeholders
 * @param {object} results - Object containing stored step results (1-indexed)
 * @returns {string} - Command with placeholders resolved
 * @throws {Error} - If placeholder references non-existent result
 */
function resolvePlaceholders(stepCommand, results) {
    if (!stepCommand || typeof stepCommand !== 'string') {
        throw new Error("Invalid step command provided")
    }

    if (!results || typeof results !== 'object') {
        throw new Error("Invalid results object provided")
    }

    // Replace all $n placeholders with corresponding results
    return stepCommand.replace(/\$(\d+)/g, (match, stepNumber) => {
        const stepNum = parseInt(stepNumber, 10)

        // Check if the referenced result exists
        if (!results.hasOwnProperty(stepNum)) {
            throw new Error(`Placeholder $${stepNum} references non-existent step result`)
        }

        const result = results[stepNum]

        // Handle different result types
        if (result === null || result === undefined) {
            return '""'
        }

        if (typeof result === "object") {
            return JSON.stringify(result)
        }

        // For primitives and strings, check if they contain special characters
        // that would break JSON or command parsing
        if (typeof result === "string") {
            // If the string contains newlines, quotes, or other special characters,
            // we need to quote it properly for JSON arguments
            if (result.includes('\n') || result.includes('"') || result.includes("'") || result.includes(',')) {
                // Quote the string to make it safe for JSON arguments
                return `"${result.replace(/"/g, '\\"')}"`
            }
        }

        // For simple strings and primitives, return as-is
        return String(result)
    })
}

module.exports = {
    resolvePlaceholders
}