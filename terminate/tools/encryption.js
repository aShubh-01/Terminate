const ALGORITHM_NAME = "AES-CBC"
const KEY_BYTE_LENGTH = 16
const IV_BYTE_LENGTH = 16

const webCrypto =
  globalThis.crypto || require("node:crypto").webcrypto

const DEFAULT_SECRET_KEY = process.env.CLI_ENCRYPTION_KEY

const config = require("../scripts/helpers/config")

/**
 * Ensures a valid secret key is available
 * @param {string|undefined} providedKey 
 * @returns {string} - The key to use
 */
function getSecret(providedKey) {
  const secret = providedKey || config.encryptionKey
  if (!secret) {
    throw new Error("Missing encryption key. Provide via 'key' argument or core config.json.")
  }
  return secret
}

function hexToUint8Array(hexString) {

  if (hexString.length % 2 !== 0) {
    throw new Error("Hex string must have even length")
  }

  const matches = hexString.match(/.{1,2}/g) || []

  return new Uint8Array(
    matches.map((byte) => parseInt(byte, 16))
  )

}

async function encryptStringRaw(text, secretKeyString) {

  const encryptionKey = hexToUint8Array(secretKeyString)

  if (encryptionKey.length !== KEY_BYTE_LENGTH) {
    throw new Error("Invalid key length")
  }

  const iv = webCrypto.getRandomValues(
    new Uint8Array(IV_BYTE_LENGTH)
  )

  const key = await webCrypto.subtle.importKey(
    "raw",
    encryptionKey,
    { name: ALGORITHM_NAME, length: 128 },
    false,
    ["encrypt"]
  )

  const encoded = new TextEncoder().encode(text)

  const encryptedBuffer = await webCrypto.subtle.encrypt(
    { name: ALGORITHM_NAME, iv },
    key,
    encoded
  )

  const encryptedBytes = new Uint8Array(encryptedBuffer)

  const ivHex = Array.from(iv)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  const encryptedHex = Array.from(encryptedBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return ivHex + encryptedHex

}

async function decryptStringRaw(encryptedCombinedHex, secretKeyString) {

  const encryptionKey = hexToUint8Array(secretKeyString)

  if (encryptionKey.length !== KEY_BYTE_LENGTH) {
    throw new Error("Invalid key length")
  }

  if (encryptedCombinedHex.length < IV_BYTE_LENGTH * 2) {
    throw new Error("Encrypted string too short")
  }

  const ivHex = encryptedCombinedHex.slice(0, IV_BYTE_LENGTH * 2)
  const encryptedHex = encryptedCombinedHex.slice(IV_BYTE_LENGTH * 2)

  const iv = hexToUint8Array(ivHex)
  const encryptedBytes = hexToUint8Array(encryptedHex)

  const key = await webCrypto.subtle.importKey(
    "raw",
    encryptionKey,
    { name: ALGORITHM_NAME, length: 128 },
    false,
    ["decrypt"]
  )

  const decryptedBuffer = await webCrypto.subtle.decrypt(
    { name: ALGORITHM_NAME, iv },
    key,
    encryptedBytes
  )

  return new TextDecoder().decode(decryptedBuffer)

}

/* ─────────────────────────────
   Tool Functions
──────────────────────────── */

exports.generateKey = async () => {

  const key = webCrypto.getRandomValues(
    new Uint8Array(KEY_BYTE_LENGTH)
  )

  const hex = Array.from(key)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")

  return hex

}

exports.encrypt = async ({ input, key }) => {
  const secret = getSecret(key)

  const payload =
    typeof input === "string"
      ? input
      : JSON.stringify(input)

  return encryptStringRaw(payload, secret)

}

exports.decrypt = async ({ input, key }) => {
  const secret = getSecret(key)

  const decrypted = await decryptStringRaw(String(input), secret)

  if (!decrypted) {
    throw new Error("Decryption returned empty result")
  }

  try {
    return JSON.parse(decrypted)
  } catch {
    return decrypted
  }

}