const fs = require("fs")
const path = require("path")
const config = require("./config")

// Use the core path to store auth tokens
const AUTH_FILE = path.join(config.corePath, ".auth")

/**
 * Auth Helper
 * Manages JWT tokens and server connectivity for the CLI platform.
 */
const auth = {
  /**
   * Save the JWT token returned from the server
   */
  setToken: (token) => {
    fs.writeFileSync(AUTH_FILE, token, "utf8")
    // Secure the file so only the current user can read it
    try {
      fs.chmodSync(AUTH_FILE, 0o600)
    } catch (e) {
      // Ignore chmod errors on systems that don't support it (e.g. Windows)
    }
  },

  /**
   * Get the stored token
   */
  getToken: () => {
    if (fs.existsSync(AUTH_FILE)) {
      return fs.readFileSync(AUTH_FILE, "utf8").trim()
    }
    return null
  },

  /**
   * Clear the token on logout
   */
  logout: () => {
    if (fs.existsSync(AUTH_FILE)) fs.unlinkSync(AUTH_FILE)
  },

  /**
   * Universal authenticated request helper
   * Handles target domain, headers, and error parsing.
   */
  request: async (endpoint, options = {}) => {
    const apiBaseUrl = process.env.TERMINATE_API_URL || "https://api.terminate.ashubh.dev/v1"
    const url = `${apiBaseUrl}${endpoint}`
    
    const token = auth.getToken()
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || `Server responded with ${response.status}`)
      }

      return data
    } catch (err) {
      if (err.message.includes("fetch is not defined")) {
        throw new Error("Node.js 18+ is required for the Terminate platform.")
      }
      throw err
    }
  }
}

module.exports = auth
