const { pipeline } = require("@xenova/transformers")
const vectors = require("./dataset_vectors.json")

let embedder = null
let loading = null

let commandCentroid = null
let languageCentroid = null
let initialized = false

function cosine(a, b) {
  let dot = 0

  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
  }

  return dot
}


function average(vectors) {
  const len = vectors[0].length
  const avg = new Array(len).fill(0)

  for (const vec of vectors) {
    for (let i = 0; i < len; i++) {
      avg[i] += vec[i]
    }
  }

  for (let i = 0; i < len; i++) {
    avg[i] /= vectors.length
  }

  return avg
}


async function ensureModel() {

  if (embedder) return

  if (!loading) {
    loading = pipeline(
      "feature-extraction",
      "Xenova/bge-small-en-v1.5"
    )
  }

  embedder = await loading
}


function init() {

  if (initialized) return

  const commandVecs = []
  const languageVecs = []

  for (const item of vectors) {
    if (item.label === "command") {
      commandVecs.push(item.vector)
    } else {
      languageVecs.push(item.vector)
    }
  }

  commandCentroid = average(commandVecs)
  languageCentroid = average(languageVecs)

  initialized = true
}


async function embed(text) {

  await ensureModel()

  const out = await embedder(text, {
    pooling: "mean",
    normalize: true
  })

  return out.data
}


async function detectCommand(input) {

  init()

  const vec = await embed(input)

  const commandScore = cosine(vec, commandCentroid)
  const languageScore = cosine(vec, languageCentroid)

  return commandScore > languageScore
}


module.exports = { detectCommand }