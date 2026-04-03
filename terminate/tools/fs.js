const fs = require("fs").promises
const path = require("path")

const config = require("../scripts/helpers/config")

/**
 * Ensures the filePath is within the allowed user workspace
 * @param {string} filePath 
 */
function assertSafePath(filePath) {
  const userPath = config.userPath

  const resolvedTarget = path.resolve(filePath)
  const resolvedUser = path.resolve(userPath)

  if (!resolvedTarget.startsWith(resolvedUser)) {
    throw new Error(`Access Denied: Path is outside the allowed workspace: ${filePath}`)
  }
}

/**
 * Read a file from the filesystem
 * @param {object} args - Arguments object
 * @param {string} args.filePath - Path to the file to read
 * @returns {Promise<string>} - File content
 */
exports.read = async ({ filePath }) => {
  assertSafePath(filePath)
  try {
    const content = await fs.readFile(filePath, "utf8")
    return content
  } catch (error) {
    throw new Error(`Failed to read file: ${error.message}`)
  }
}

/**
 * Write content to a file (overwrites existing content)
 * @param {object} args - Arguments object
 * @param {string} args.filePath - Path to the file to write
 * @param {string} args.content - Content to write to the file
 * @returns {Promise<string>} - Success message
 */
exports.write = async ({ filePath, content }) => {
  assertSafePath(filePath)
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    
    await fs.writeFile(filePath, content, "utf8")
    return `Successfully wrote to file: ${filePath}`
  } catch (error) {
    throw new Error(`Failed to write file: ${error.message}`)
  }
}

/**
 * Append content to an existing file
 * @param {object} args - Arguments object
 * @param {string} args.filePath - Path to the file to append to
 * @param {string} args.content - Content to append to the file
 * @returns {Promise<string>} - Success message
 */
exports.append = async ({ filePath, content }) => {
  assertSafePath(filePath)
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath)
    await fs.mkdir(dir, { recursive: true })
    
    await fs.appendFile(filePath, content, "utf8")
    return `Successfully appended to file: ${filePath}`
  } catch (error) {
    throw new Error(`Failed to append to file: ${error.message}`)
  }
}

/**
 * Update specific content in a file using search and replace
 * @param {object} args - Arguments object
 * @param {string} args.filePath - Path to the file to update
 * @param {string} args.search - Text to search for
 * @param {string} args.replace - Text to replace with
 * @returns {Promise<string>} - Success message
 */
exports.update = async ({ filePath, search, replace }) => {
  assertSafePath(filePath)
  try {
    // Read current content
    const currentContent = await fs.readFile(filePath, "utf8")
    
    // Check if search text exists
    if (!currentContent.includes(search)) {
      throw new Error(`Search text not found in file: ${search}`)
    }
    
    // Replace content
    const updatedContent = currentContent.replace(search, replace)
    
    // Write updated content
    await fs.writeFile(filePath, updatedContent, "utf8")
    
    return `Successfully updated file: ${filePath}`
  } catch (error) {
    throw new Error(`Failed to update file: ${error.message}`)
  }
}

/**
 * Delete a file from the filesystem
 * @param {object} args - Arguments object
 * @param {string} args.filePath - Path to the file to delete
 * @returns {Promise<string>} - Success message
 */
exports.delete = async ({ filePath }) => {
  assertSafePath(filePath)
  try {
    await fs.unlink(filePath)
    return `Successfully deleted file: ${filePath}`
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}